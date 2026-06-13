use std::io::Read;
use std::path::PathBuf;
use std::sync::Arc;

use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::text::Text;
use actix_multipart::form::MultipartForm;
use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::{error, info, warn};
use utoipa::ToSchema;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::common::visibility::Visibility;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::edit::update_media_file_stored_cloud_contents::{updated_media_file_stored_cloud_contents, UpdateArgs};
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::endpoints::media_files::upload::upload_error::MediaFileUploadError;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::check_creator_tokens::{check_creator_tokens, CheckCreatorTokenArgs, CheckCreatorTokenResult};

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct UploadSavedSceneMediaFilePathInfo {
  token: MediaFileToken,
}

/// Form-multipart request fields.
///
/// IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `UploadSavedSceneMediaFileForm` (Under "Schema") FOR DETAILS ON FIELDS AND NULLABILITY.
#[derive(MultipartForm, ToSchema)]
#[multipart(duplicate_field = "deny")]
pub struct UploadSavedSceneMediaFileForm {
  /// UUID for request idempotency
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = String, format = Binary)]
  uuid_idempotency_token: Text<String>,

  // TODO: is MultipartBytes better than TempFile ?
  /// The uploaded file
  #[multipart(limit = "512 MiB")]
  #[schema(value_type = Vec<u8>, format = Binary)]
  file: TempFile,
}

// Unlike the "upload" endpoints, which are pure inserts, these endpoints are *upserts*.
#[derive(Serialize, ToSchema)]
pub struct UploadSavedSceneMediaFileSuccessResponse {
  pub success: bool,
  pub media_file_token: MediaFileToken,
}

/// Use this endpoint to make changes to an existing scene.
///
/// If you have a media token for the scene you're trying to save (i.e. not a completely
/// new, unsaved scene), call this endpoint to overwrite and save the changes to the scene.
///
/// If you want to create a new copy of an existing scene, call the "new scene" endpoint
/// instead as it won't overwrite an existing scene and will return a brand new media token.
#[utoipa::path(
  post,
  tag = "Media Files (Upload)",
  path = "/v1/media_files/upload/saved_scene/{token}",
  responses(
    (status = 200, description = "Success Update", body = UploadSavedSceneMediaFileSuccessResponse),
    (status = 400, description = "Bad input", body = MediaFileUploadError),
    (status = 401, description = "Not authorized", body = MediaFileUploadError),
    (status = 429, description = "Too many requests", body = MediaFileUploadError),
    (status = 500, description = "Server error", body = MediaFileUploadError),
  ),
  params(
    ("path" = UploadSavedSceneMediaFilePathInfo, description = "Path for Request"),
    (
      "request" = UploadSavedSceneMediaFileForm,
      description = "IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `UploadSavedSceneMediaFileForm` (Under 'Schema') FOR DETAILS ON FIELDS AND NULLABILITY."
    ),
  )
)]
pub async fn upload_saved_scene_media_file_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  MultipartForm(mut form): MultipartForm<UploadSavedSceneMediaFileForm>,
  path: Path<UploadSavedSceneMediaFilePathInfo>,
) -> Result<Json<UploadSavedSceneMediaFileSuccessResponse>, MediaFileUploadError> {

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("MySql pool error: {:?}", err);
        MediaFileUploadError::ServerError
      })?;

  // ==================== READ SESSION ==================== //

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        error!("Session checker error: {:?}", e);
        MediaFileUploadError::ServerError
      })?;

  let maybe_user_token = maybe_user_session
      .as_ref()
      .map(|session| session.get_user_token());

  let maybe_avt_token = server_state
      .avt_cookie_manager
      .get_avt_token_from_request(&http_request);

  // ==================== BANNED USERS ==================== //

  if let Some(ref user) = maybe_user_session {
    if user.is_banned {
      return Err(MediaFileUploadError::NotAuthorizedVerbose("user is banned".to_string()));
    }
  }

  // ==================== RATE LIMIT ==================== //

  let rate_limiter = match maybe_user_session {
    None => &server_state.redis_rate_limiters.file_upload_logged_out,
    Some(ref _session) => &server_state.redis_rate_limiters.file_upload_logged_in,
  };

  if let Err(_err) = rate_limiter.rate_limit_request(&http_request).await {
    return Err(MediaFileUploadError::RateLimited);
  }

  // ==================== MAKE SURE USER OWNS FILE ==================== //

  // TODO(bt,2024-03-26): Don't use the mysql_pool, use the mysql_connection.
  let media_file =
      get_media_file(&path.token, false, &server_state.mysql_pool)
          .await
          .map_err(|err| {
            error!("Error getting media file: {:?}", err);
            MediaFileUploadError::ServerError
          })?
          .ok_or_else(|| MediaFileUploadError::NotFoundVerbose("media file not found with that token".to_string()))?;

  let creator_check = check_creator_tokens(CheckCreatorTokenArgs {
    maybe_creator_user_token: media_file.maybe_creator_user_token.as_ref(),
    maybe_current_request_user_token: maybe_user_token,
    maybe_creator_anonymous_visitor_token: media_file.maybe_creator_anonymous_visitor_token.as_ref(),
    maybe_current_request_anonymous_visitor_token: maybe_avt_token.as_ref(),
  });

  match creator_check {
    CheckCreatorTokenResult::UserTokenMatch => {} // Allowed
    CheckCreatorTokenResult::NoUserAnonymousVisitorTokenMatch => {} // Allowed
    CheckCreatorTokenResult::InsufficientInformation => {} // TODO(bt,2024-03-28): Temporary fallthrough. This should be a 401.
    CheckCreatorTokenResult::UserTokenMismatch => return Err(MediaFileUploadError::NotAuthorizedVerbose(
      "user tokens do not match".to_string())),
    CheckCreatorTokenResult::NoUserAnonymousVisitorTokenMismatch => return Err(MediaFileUploadError::NotAuthorizedVerbose(
      "anonymous visitor tokens do not match".to_string())),
  }

  // ==================== HANDLE IDEMPOTENCY ==================== //

  // TODO(bt, 2024-02-26): This should be a transaction.
  let uuid_idempotency_token = form.uuid_idempotency_token.as_ref();

  if let Err(reason) = validate_idempotency_token_format(uuid_idempotency_token) {
    return Err(MediaFileUploadError::BadInput(reason));
  }

  insert_idempotency_token(uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        MediaFileUploadError::BadInput("invalid idempotency token".to_string())
      })?;

  // ==================== UPLOAD METADATA ==================== //

  let creator_set_visibility = maybe_user_session
      .as_ref()
      .map(|user_session| user_session.preferred_tts_result_visibility) // TODO: We need a new type of visibility control.
      .unwrap_or(Visibility::default());

  // ==================== USER DATA ==================== //

  let ip_address = get_request_ip(&http_request);

  // ==================== FILE DATA ==================== //

  let maybe_filename = form.file.file_name.as_deref()
      .as_deref()
      .map(|filename| PathBuf::from(filename));

  let maybe_file_extension = maybe_filename
      .as_ref()
      .and_then(|filename| filename.extension())
      .and_then(|ext| ext.to_str());

  let mut file_bytes = Vec::new();
  form.file.file.read_to_end(&mut file_bytes)
      .map_err(|e| {
        error!("Problem reading file: {:?}", e);
        MediaFileUploadError::ServerError
      })?;

  let file_size_bytes = file_bytes.len();

  let hash = sha256_hash_bytes(&file_bytes)
      .map_err(|io_error| {
        error!("Problem hashing bytes: {:?}", io_error);
        MediaFileUploadError::ServerError
      })?;

  // ==================== UPLOAD AND SAVE ==================== //

  // TODO(bt,2024-03-26): At first I thought we should map these to the existing file paths on upsert,
  //  but now I'm thinking we can just lead cruft in the bucket and clean it later. We don't have the
  //  benefit of restoring old versions (if we mapped to existing paths but had a versioning scheme),
  //  but we can move fast.

  const MIMETYPE: &str = "application/json";
  const PREFIX : Option<&str> = Some("upload_");
  const SUFFIX: &str = ".scn.json";

  let public_upload_path = MediaFileBucketPath::generate_new(PREFIX, Some(SUFFIX));

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type(
    public_upload_path.get_full_object_path_str(),
    file_bytes.as_ref(),
    MIMETYPE)
      .await
      .map_err(|e| {
        warn!("Upload media bytes to bucket error: {:?}", e);
        MediaFileUploadError::ServerError
      })?;

  updated_media_file_stored_cloud_contents(UpdateArgs {
    media_file_token: &path.token,
    public_bucket_directory_hash: public_upload_path.get_object_hash(),
    maybe_public_bucket_prefix: PREFIX,
    maybe_public_bucket_extension: Some(SUFFIX),
    maybe_mime_type: Some(MIMETYPE),
    file_size_bytes: file_size_bytes as u64,
    sha256_checksum: &hash,
    update_ip_address: &ip_address,
    mysql_pool: &server_state.mysql_pool,
  })
      .await
      .map_err(|err| {
        warn!("Updated file creation DB error: {:?}", err);
        MediaFileUploadError::ServerError
      })?;

  Ok(Json(UploadSavedSceneMediaFileSuccessResponse {
    success: true,
    media_file_token: path.token.clone(),
  }))
}

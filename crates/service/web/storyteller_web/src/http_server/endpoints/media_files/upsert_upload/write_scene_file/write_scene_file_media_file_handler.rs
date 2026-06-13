use std::path::PathBuf;
use std::sync::Arc;

use actix_multipart::Multipart;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{error, info, warn};
use utoipa::ToSchema;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use mysql_queries::queries::media_files::upsert::upsert_media_file_from_file_upload::{upsert_media_file_from_file_upload, UploadType, UpsertMediaFileFromUploadArgs};
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::endpoints::media_files::upsert_upload::write_error::MediaFileWriteError;
use crate::http_server::endpoints::media_files::upsert_upload::write_scene_file::drain_multipart_request::drain_multipart_request;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::check_creator_tokens::{check_creator_tokens, CheckCreatorTokenArgs, CheckCreatorTokenResult};

// Unlike the "upload" endpoints, which are pure inserts, these endpoints are *upserts*.
#[derive(Serialize, ToSchema)]
pub struct WriteSceneFileMediaSuccessResponse {
  pub success: bool,
  pub media_file_token: MediaFileToken,
}

/// DEPRECATED: Use the "new scene" and "saved scene" endpoints instead.
#[deprecated]
#[utoipa::path(
  post,
  tag = "Media Files [Deprecated]",
  path = "/v1/media_files/write/scene_file",
  responses(
    (status = 200, description = "Success Update", body = WriteSceneFileMediaSuccessResponse),
    (status = 400, description = "Bad input", body = MediaFileWriteError),
    (status = 401, description = "Not authorized", body = MediaFileWriteError),
    (status = 429, description = "Too many requests", body = MediaFileWriteError),
    (status = 500, description = "Server error", body = MediaFileWriteError),
  ),
  params(
    ("request" = (), description = "Ask Brandon. This is form-multipart."),
  )
)]
pub async fn write_scene_file_media_file_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  mut multipart_payload: Multipart,
) -> Result<HttpResponse, MediaFileWriteError> {

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("MySql pool error: {:?}", err);
        MediaFileWriteError::ServerError
      })?;

  // ==================== READ SESSION ==================== //

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        error!("Session checker error: {:?}", e);
        MediaFileWriteError::ServerError
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
      return Err(MediaFileWriteError::NotAuthorizedVerbose("user is banned".to_string()));
    }
  }

  // ==================== RATE LIMIT ==================== //

  let rate_limiter = match maybe_user_session {
    None => &server_state.redis_rate_limiters.file_upload_logged_out,
    Some(ref _session) => &server_state.redis_rate_limiters.file_upload_logged_in,
  };

  if let Err(_err) = rate_limiter.rate_limit_request(&http_request).await {
    return Err(MediaFileWriteError::RateLimited);
  }

  // ==================== READ MULTIPART REQUEST ==================== //

  let upload_media_request = drain_multipart_request(multipart_payload).await?;

  // ==================== MAKE SURE USER OWNS FILE ==================== //

  if let Some(media_file_token) = upload_media_request.media_file_token.as_ref() {
    // TODO(bt,2024-03-26): Don't use the mysql_pool, use the mysql_connection.
    let media_file =
        get_media_file(media_file_token, false, &server_state.mysql_pool)
        .await
        .map_err(|err| {
          error!("Error getting media file: {:?}", err);
          MediaFileWriteError::ServerError
        })?
        .ok_or_else(|| MediaFileWriteError::NotFoundVerbose("media file not found with that token".to_string()))?;

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
      CheckCreatorTokenResult::UserTokenMismatch => return Err(MediaFileWriteError::NotAuthorizedVerbose(
        "user tokens do not match".to_string())),
      CheckCreatorTokenResult::NoUserAnonymousVisitorTokenMismatch => return Err(MediaFileWriteError::NotAuthorizedVerbose(
        "anonymous visitor tokens do not match".to_string())),
    }
  }

  // ==================== HANDLE IDEMPOTENCY ==================== //

  // TODO(bt, 2024-02-26): This should be a transaction.
  let uuid_idempotency_token = upload_media_request.uuid_idempotency_token
      .ok_or(MediaFileWriteError::BadInput("no uuid".to_string()))?;

  if let Err(reason) = validate_idempotency_token_format(&uuid_idempotency_token) {
    return Err(MediaFileWriteError::BadInput(reason));
  }

  insert_idempotency_token(&uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        MediaFileWriteError::BadInput("invalid idempotency token".to_string())
      })?;

  // ==================== UPLOAD METADATA ==================== //

  let creator_set_visibility = maybe_user_session
      .as_ref()
      .map(|user_session| user_session.preferred_tts_result_visibility) // TODO: We need a new type of visibility control.
      .unwrap_or(Visibility::default());

  // ==================== USER DATA ==================== //

  let ip_address = get_request_ip(&http_request);

  // ==================== FILE DATA ==================== //

  let file_bytes = match upload_media_request.file_bytes {
    None => return Err(MediaFileWriteError::BadInput("missing file contents".to_string())),
    Some(bytes) => bytes,
  };

  let maybe_filename = upload_media_request.file_name
      .as_deref()
      .map(|filename| PathBuf::from(filename));

  let maybe_file_extension = maybe_filename
      .as_ref()
      .and_then(|filename| filename.extension())
      .and_then(|ext| ext.to_str());

  let file_size_bytes = file_bytes.len();

  let hash = sha256_hash_bytes(&file_bytes)
      .map_err(|io_error| {
        error!("Problem hashing bytes: {:?}", io_error);
        MediaFileWriteError::ServerError
      })?;

  // ==================== UPLOAD AND SAVE ==================== //

  // TODO(bt,2024-03-26): At first I thought we should map these to the existing file paths on upsert,
  //  but now I'm thinking we can just lead cruft in the bucket and clean it later. We don't have the
  //  benefit of restoring old versions (if we mapped to existing paths but had a versioning scheme),
  //  but we can move fast.

  const MIMETYPE: &str = "application/json";
  const PREFIX : Option<&str> = Some("upload_");
  const SUFFIX: &str = ".json";

  let public_upload_path = MediaFileBucketPath::generate_new(PREFIX, Some(SUFFIX));

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type(
    public_upload_path.get_full_object_path_str(),
    file_bytes.as_ref(),
    MIMETYPE)
      .await
      .map_err(|e| {
        warn!("Upload media bytes to bucket error: {:?}", e);
        MediaFileWriteError::ServerError
      })?;

  // TODO(bt, 2024-02-22): This should be a transaction.
  let (token, record_id) = upsert_media_file_from_file_upload(UpsertMediaFileFromUploadArgs {
    maybe_media_file_token: upload_media_request.media_file_token.as_ref(),
    maybe_media_class: Some(MediaFileClass::Dimensional),
    media_file_type: MediaFileType::SceneJson,
    maybe_engine_category: Some(MediaFileEngineCategory::Scene),
    maybe_animation_type: None,
    maybe_media_subtype: None,
    maybe_creator_user_token: maybe_user_token,
    maybe_creator_anonymous_visitor_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility,
    upload_type: UploadType::Filesystem,
    maybe_mime_type: Some(MIMETYPE),
    file_size_bytes: file_size_bytes as u64,
    duration_millis: 0,
    sha256_checksum: &hash,
    public_bucket_directory_hash: public_upload_path.get_object_hash(),
    maybe_public_bucket_prefix: PREFIX,
    maybe_public_bucket_extension: Some(SUFFIX),
    pool: &server_state.mysql_pool,
  })
      .await
      .map_err(|err| {
        warn!("New file creation DB error: {:?}", err);
        MediaFileWriteError::ServerError
      })?;

  info!("new media file id: {} token: {:?}", record_id, &token);

  let response = WriteSceneFileMediaSuccessResponse {
    success: true,
    media_file_token: token,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| MediaFileWriteError::ServerError)?;

  return Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body));
}

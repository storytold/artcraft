use std::collections::HashSet;
use std::io::Read;
use std::path::PathBuf;
use std::sync::Arc;

use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::text::Text;
use actix_multipart::form::MultipartForm;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::{error, info, warn};
use once_cell::sync::Lazy;
use utoipa::ToSchema;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use http_server_common::request::get_request_ip::get_request_ip;
use mimetypes::mimetype_for_bytes::get_mimetype_for_bytes;
use mimetypes::mimetype_to_extension::mimetype_to_extension;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::create::specialized_insert::insert_media_file_from_file_upload::{insert_media_file_from_file_upload, InsertMediaFileFromUploadArgs, UploadType};
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::endpoints::media_files::upload::upload_error::MediaFileUploadError;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;

/// Form-multipart request fields.
///
/// IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `UploadSnapshotMediaFileForm` (Under "Schema") FOR DETAILS ON FIELDS AND NULLABILITY.
#[derive(MultipartForm, ToSchema)]
#[multipart(duplicate_field = "deny")]
pub struct UploadSnapshotMediaFileForm {
  /// UUID for request idempotency
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = String, format = Binary)]
  uuid_idempotency_token: Text<String>,

  /// The uploaded "screenshot" / "snapshot" of the engine scene
  #[multipart(limit = "512 MiB")]
  #[schema(value_type = Vec<u8>, format = Binary)]
  snapshot: TempFile,

  /// Optional: If an engine scene was used to create this snapshot, provide it here to create a link
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<MediaFileToken>, format = Binary)]
  scene_media_token: Option<Text<MediaFileToken>>,

  /// Optional: Visibility of the scene
  #[multipart(limit = "2 KiB")]
  #[schema(value_type = Option<Visibility>, format = Binary)]
  maybe_visibility: Option<Text<Visibility>>,
}

// Unlike the "upload" endpoints, which are pure inserts, these endpoints are *upserts*.
#[derive(Serialize, ToSchema)]
pub struct UploadSnapshotMediaFileSuccessResponse {
  pub success: bool,

  /// The media token of the "screenshot" / "snapshot" we took.
  pub snapshot_media_token: MediaFileToken,
}

static ALLOWED_MIME_TYPES : Lazy<HashSet<&'static str>> = Lazy::new(|| {
  HashSet::from([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ])
});

/// Upload snapshots of the scenes created in the 3D image studio.
#[utoipa::path(
  post,
  tag = "Image Studio",
  path = "/v1/image_studio/scene_snapshot",
  responses(
    (status = 200, description = "Success Update", body = UploadSnapshotMediaFileSuccessResponse),
    (status = 400, description = "Bad input", body = MediaFileUploadError),
    (status = 401, description = "Not authorized", body = MediaFileUploadError),
    (status = 429, description = "Too many requests", body = MediaFileUploadError),
    (status = 500, description = "Server error", body = MediaFileUploadError),
  ),
  params(
    (
      "request" = UploadSnapshotMediaFileForm,
      description = "IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `UploadSnapshotMediaFileForm` (Under 'Schema') FOR DETAILS ON FIELDS AND NULLABILITY."
    ),
  )
)]
pub async fn upload_snapshot_media_file_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  MultipartForm(mut form): MultipartForm<UploadSnapshotMediaFileForm>,
) -> Result<Json<UploadSnapshotMediaFileSuccessResponse>, MediaFileUploadError> {

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
      .map(|session| session.get_strongly_typed_user_token());

  let maybe_avt_token = server_state
      .avt_cookie_manager
      .get_avt_token_from_request(&http_request);

  // ==================== BANNED USERS ==================== //

  if let Some(ref user) = maybe_user_session {
    if user.is_banned {
      return Err(MediaFileUploadError::NotAuthorizedVerbose("user is banned".to_string()));
    }
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

  let creator_set_visibility = form.maybe_visibility
      .map(|visibility| visibility.0)
      .or_else(|| {
        maybe_user_session
            .as_ref()
            .map(|user_session| user_session.preferred_tts_result_visibility)
      })
      .unwrap_or(Visibility::default());

  // ==================== USER DATA ==================== //

  let ip_address = get_request_ip(&http_request);

  // ==================== FILE VALIDATION ==================== //

  let mut file_bytes = Vec::new();
  form.snapshot.file.read_to_end(&mut file_bytes)
      .map_err(|e| {
        error!("Problem reading file: {:?}", e);
        MediaFileUploadError::ServerError
      })?;

  let mimetype = get_mimetype_for_bytes(file_bytes.as_ref())
      .map(|mimetype| mimetype.to_string())
      .ok_or_else(|| {
        warn!("Could not determine mimetype for file");
        MediaFileUploadError::BadInput("Could not determine mimetype for file".to_string())
      })?;

  if !ALLOWED_MIME_TYPES.contains(mimetype.as_str()) {
    // NB: Don't let our error message inject malicious strings
    let filtered_mimetype = mimetype
        .chars()
        .filter(|c| c.is_ascii())
        .filter(|c| c.is_alphanumeric() || *c == '/')
        .collect::<String>();
    return Err(MediaFileUploadError::BadInput(format!("unpermitted mime type: {}", &filtered_mimetype)));
  }

  // ==================== OTHER FILE METADATA ==================== //

  let maybe_filename = form.snapshot.file_name.as_deref()
      .as_deref()
      .map(|filename| PathBuf::from(filename));

  let extension = mimetype_to_extension(&mimetype)
      .or_else(|| {
        maybe_filename
            .as_ref()
            .and_then(|filename| filename.extension()) // TODO needs dot prefix
            .and_then(|ext| ext.to_str())
      })
      .ok_or_else(|| {
        warn!("Could not determine file extension for mimetype: {}", &mimetype);
        MediaFileUploadError::ServerError
      })?;

  let extension = format!(".{extension}"); // NB: needs dot prefix

  let file_size_bytes = file_bytes.len();

  let hash = sha256_hash_bytes(&file_bytes)
      .map_err(|io_error| {
        error!("Problem hashing bytes: {:?}", io_error);
        MediaFileUploadError::ServerError
      })?;

  // ==================== UPLOAD AND SAVE ==================== //

  const PREFIX : Option<&str> = Some("snapshot_");

  let public_upload_path = MediaFileBucketPath::generate_new(PREFIX, Some(&extension));

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type(
    public_upload_path.get_full_object_path_str(),
    file_bytes.as_ref(),
    &mimetype)
      .await
      .map_err(|e| {
        warn!("Upload media bytes to bucket error: {:?}", e);
        MediaFileUploadError::ServerError
      })?;

  let (token, record_id) = insert_media_file_from_file_upload(InsertMediaFileFromUploadArgs {
    maybe_media_class: Some(MediaFileClass::Image),
    media_file_type: MediaFileType::Image,
    maybe_creator_user_token: maybe_user_token.as_ref(),
    maybe_creator_anonymous_visitor_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility,
    upload_type: UploadType::Filesystem, // TODO(bt,2024-05-02): This should be a parameter and a well-known enum.
    maybe_engine_category: None,
    maybe_animation_type: None,
    maybe_prompt_token: None,
    maybe_batch_token: None,
    maybe_mime_type: Some(&mimetype),
    file_size_bytes: file_size_bytes as u64,
    maybe_duration_millis: None,
    sha256_checksum: &hash,
    maybe_title: Some("Snapshot"),
    maybe_scene_source_media_file_token: None,
    is_intermediate_system_file: true,
    maybe_generation_provider: None,
    public_bucket_directory_hash: public_upload_path.get_object_hash(),
    maybe_public_bucket_prefix: PREFIX,
    maybe_public_bucket_extension: Some(&extension),
    pool: &server_state.mysql_pool,
  })
      .await
      .map_err(|err| {
        warn!("New file creation DB error: {:?}", err);
        MediaFileUploadError::ServerError
      })?;

  info!("new media file id: {} token: {:?}", record_id, &token);

  Ok(Json(UploadSnapshotMediaFileSuccessResponse {
    success: true,
    snapshot_media_token: token,
  }))
}

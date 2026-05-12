use std::collections::HashSet;
use std::sync::Arc;

use actix_multipart::Multipart;
use actix_web::{web, HttpRequest, HttpResponse};
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
use videos::get_mp4_info::{get_mp4_info_for_bytes, get_mp4_info_for_bytes_and_len};

use crate::http_server::endpoints::media_files::upload::upload_error::MediaFileUploadError;
use crate::http_server::endpoints::media_files::upload::upload_video_old::drain_multipart_request::drain_multipart_request;
use crate::http_server::endpoints::media_files::upload::upload_video_old::drain_multipart_request::MediaFileUploadSource;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;

#[derive(Serialize, ToSchema)]
pub struct UploadVideoMediaSuccessResponse {
  pub success: bool,
  pub media_file_token: MediaFileToken,
}

static ALLOWED_MIME_TYPES : Lazy<HashSet<&'static str>> = Lazy::new(|| {
  HashSet::from([
    // Video
    "video/mp4", // NB: Only mp4 for now.
  ])
});

/// DEPRECATED: Use the "new video" endpoint instead.
#[deprecated]
#[utoipa::path(
  post,
  tag = "Media Files [Deprecated]",
  path = "/v1/media_files/upload/video",
  responses(
    (status = 200, description = "Success Update", body = UploadVideoMediaSuccessResponse),
    (status = 400, description = "Bad input", body = MediaFileUploadError),
    (status = 401, description = "Not authorized", body = MediaFileUploadError),
    (status = 429, description = "Too many requests", body = MediaFileUploadError),
    (status = 500, description = "Server error", body = MediaFileUploadError),
  ),
  params(
    ("request" = (), description = "Ask Brandon. This is form-multipart."),
  )
)]
pub async fn upload_video_media_file_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  mut multipart_payload: Multipart,
) -> Result<HttpResponse, MediaFileUploadError> {

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

  let maybe_avt_token = server_state
      .avt_cookie_manager
      .get_avt_token_from_request(&http_request);

  // ==================== BANNED USERS ==================== //

  if let Some(ref user) = maybe_user_session {
    if user.is_banned {
      return Err(MediaFileUploadError::NotAuthorized);
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

  // ==================== READ MULTIPART REQUEST ==================== //

  let upload_media_request = drain_multipart_request(multipart_payload)
      .await
      .map_err(|e| {
        // TODO: Error handling could be nicer.
        MediaFileUploadError::BadInput("bad request".to_string())
      })?;

  // TODO(bt, 2024-02-26): This should be a transaction.
  let uuid_idempotency_token = upload_media_request.uuid_idempotency_token
      .ok_or(MediaFileUploadError::BadInput("no uuid".to_string()))?;

  // ==================== HANDLE IDEMPOTENCY ==================== //

  if let Err(reason) = validate_idempotency_token_format(&uuid_idempotency_token) {
    return Err(MediaFileUploadError::BadInput(reason));
  }

  insert_idempotency_token(&uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        MediaFileUploadError::BadInput("invalid idempotency token".to_string())
      })?;

  // ==================== UPLOAD METADATA ==================== //

  let creator_set_visibility = upload_media_request.visibility
      .as_deref()
      .map(|visibility| Visibility::from_str(visibility))
      .transpose()
      .map_err(|err| {
        error!("Invalid visibility: {:?}", err);
        MediaFileUploadError::BadInput("invalid visibility".to_string())
      })?
      .or_else(|| {
        maybe_user_session
            .as_ref()
            .map(|user_session| user_session.preferred_tts_result_visibility)
      })
      .unwrap_or(Visibility::default());

  let upload_type = match upload_media_request.media_source {
    MediaFileUploadSource::Unknown => UploadType::Filesystem,
    MediaFileUploadSource::UserFile => UploadType::Filesystem,
    MediaFileUploadSource::UserDeviceApi => UploadType::DeviceCaptureApi,
  };

  // ==================== USER DATA ==================== //

  let ip_address = get_request_ip(&http_request);

  let maybe_user_token = maybe_user_session
      .map(|session| session.get_strongly_typed_user_token());

  // ==================== FILE DATA ==================== //

  let file_bytes = match upload_media_request.file_bytes {
    None => return Err(MediaFileUploadError::BadInput("missing file contents".to_string())),
    Some(bytes) => bytes,
  };

  let mut maybe_mimetype = get_mimetype_for_bytes(&file_bytes);

  let mimetype = match maybe_mimetype {
    None => return Err(MediaFileUploadError::BadInput("unknown mimetype".to_string())),
    Some(mimetype) => if ALLOWED_MIME_TYPES.contains(mimetype) {
      mimetype
    } else {
      return Err(MediaFileUploadError::BadInput("unsupported mimetype".to_string()));
    }
  };

  let file_size_bytes = file_bytes.len();

  let hash = sha256_hash_bytes(&file_bytes)
      .map_err(|io_error| {
        error!("Problem hashing bytes: {:?}", io_error);
        MediaFileUploadError::ServerError
      })?;

  // ==================== FRAME RATE ==================== //

  let mp4_info = get_mp4_info_for_bytes(file_bytes.as_ref())
      .map_err(|err| {
        warn!("Error reading mp4 info: {:?}", err);
        MediaFileUploadError::ServerError
      })?;

  // ==================== UPLOAD AND SAVE ==================== //

  // TODO(bt,2024-02-26): We statically know the extension if it was an allowed mimetype. Fix this.
  let mut extension = mimetype_to_extension(mimetype)
      .map(|extension| format!(".{extension}"))
      .unwrap_or(".mp4".to_string());

  const PREFIX : Option<&str> = Some("video_");

  let public_upload_path = MediaFileBucketPath::generate_new(PREFIX, Some(&extension));

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type(
    public_upload_path.get_full_object_path_str(),
    file_bytes.as_ref(),
    mimetype)
      .await
      .map_err(|e| {
        warn!("Upload media bytes to bucket error: {:?}", e);
        MediaFileUploadError::ServerError
      })?;

  // TODO(bt, 2024-02-22): This should be a transaction.
  let (token, record_id) = insert_media_file_from_file_upload(InsertMediaFileFromUploadArgs {
    maybe_media_class: Some(MediaFileClass::Video),
    media_file_type: MediaFileType::Video,
    maybe_creator_user_token: maybe_user_token.as_ref(),
    maybe_creator_anonymous_visitor_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility,
    upload_type,
    maybe_engine_category: None,
    maybe_prompt_token: None,
    maybe_batch_token: None,
    maybe_animation_type: None,
    maybe_mime_type: Some(mimetype),
    file_size_bytes: file_size_bytes as u64,
    maybe_duration_millis: Some(mp4_info.duration_millis as u64),
    sha256_checksum: &hash,
    maybe_title: upload_media_request.title.as_deref(),
    maybe_scene_source_media_file_token: None,
    is_intermediate_system_file: false, // NB: is_user_upload = TRUE
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

  let response = UploadVideoMediaSuccessResponse {
    success: true,
    media_file_token: token,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| MediaFileUploadError::ServerError)?;

  return Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body));
}

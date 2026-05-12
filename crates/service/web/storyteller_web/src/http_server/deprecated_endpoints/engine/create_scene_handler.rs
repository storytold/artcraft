use std::sync::Arc;

use actix_multipart::Multipart;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse, ResponseError};
use log::{error, info, warn};
use utoipa::ToSchema;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mimetypes::mimetype_for_bytes::get_mimetype_for_bytes;
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::create::specialized_insert::insert_media_file_from_file_upload::{insert_media_file_from_file_upload, InsertMediaFileFromUploadArgs, UploadType};
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::deprecated_endpoints::engine::drain_multipart_request::drain_multipart_request;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;

#[derive(Debug, Serialize, ToSchema)]
pub enum CreateSceneError {
  BadInput(String),
  NotAuthorized,
  MustBeLoggedIn,
  ServerError,
  RateLimited,
}

impl ResponseError for CreateSceneError {
  fn status_code(&self) -> StatusCode {
    match *self {
      CreateSceneError::BadInput(_) => StatusCode::BAD_REQUEST,
      CreateSceneError::NotAuthorized => StatusCode::UNAUTHORIZED,
      CreateSceneError::MustBeLoggedIn => StatusCode::UNAUTHORIZED,
      CreateSceneError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      CreateSceneError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

impl std::fmt::Display for CreateSceneError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

#[derive(Serialize, ToSchema)]
pub struct CreateSceneSuccessResponse {
  pub success: bool,
  pub media_file_token: MediaFileToken,
}

/// Deprecated: This was for Bevy engine.
#[deprecated]
#[utoipa::path(
  post,
  tag = "Engine",
  path = "/v1/engine/create_scene",
  responses(
    (status = 200, description = "Found", body = CreateSceneSuccessResponse),
    (status = 404, description = "Not found", body = CreateSceneError),
    (status = 500, description = "Server error", body = CreateSceneError),
  ),
)]
pub async fn create_scene_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  mut multipart_payload: Multipart,
) -> Result<HttpResponse, CreateSceneError> {

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("MySql pool error: {:?}", err);
        CreateSceneError::ServerError
      })?;

  // ==================== READ SESSION ==================== //

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        error!("Session checker error: {:?}", e);
        CreateSceneError::ServerError
      })?;

  let maybe_avt_token = server_state
      .avt_cookie_manager
      .get_avt_token_from_request(&http_request);

  // ==================== BANNED USERS ==================== //

  if let Some(ref user) = maybe_user_session {
    if user.is_banned {
      return Err(CreateSceneError::NotAuthorized);
    }
  }

  // ==================== RATE LIMIT ==================== //

  let rate_limiter = match maybe_user_session {
    None => &server_state.redis_rate_limiters.file_upload_logged_out,
    Some(ref _session) => &server_state.redis_rate_limiters.file_upload_logged_in,
  };

  if let Err(_err) = rate_limiter.rate_limit_request(&http_request).await {
    return Err(CreateSceneError::RateLimited);
  }

  // ==================== READ MULTIPART REQUEST ==================== //

  let upload_media_request = drain_multipart_request(multipart_payload)
      .await
      .map_err(|e| {
        // TODO: Error handling could be nicer.
        CreateSceneError::BadInput("bad request".to_string())
      })?;

  let uuid_idempotency_token = upload_media_request.uuid_idempotency_token
      .ok_or(CreateSceneError::BadInput("no uuid".to_string()))?;

  // ==================== HANDLE IDEMPOTENCY ==================== //

  if let Err(reason) = validate_idempotency_token_format(&uuid_idempotency_token) {
    return Err(CreateSceneError::BadInput(reason));
  }

  // TODO(bt, 2024-02-22): This should be a transaction.
  insert_idempotency_token(&uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        CreateSceneError::BadInput("invalid idempotency token".to_string())
      })?;

  // ==================== USER DATA ==================== //

  let ip_address = get_request_ip(&http_request);

  let maybe_user_token = maybe_user_session
      .map(|session| session.get_strongly_typed_user_token());

  // ==================== FILE DATA ==================== //

  let mut maybe_mimetype = upload_media_request.file_bytes
      .as_ref()
      .map(|bytes| get_mimetype_for_bytes(bytes.as_ref()))
      .flatten();

  let mime_type = maybe_mimetype
      .unwrap_or("text/plain");

  let bytes = match upload_media_request.file_bytes {
    None => return Err(CreateSceneError::BadInput("missing file contents".to_string())),
    Some(bytes) => bytes,
  };

  let file_size_bytes = bytes.len();

  let hash = sha256_hash_bytes(&bytes)
      .map_err(|io_error| {
        error!("Problem hashing bytes: {:?}", io_error);
        CreateSceneError::ServerError
      })?;

  const PREFIX : Option<&str> = Some("scene_");
  const SUFFIX : Option<&str> = Some(".scn.ron");

  let public_upload_path = MediaFileBucketPath::generate_new(PREFIX, SUFFIX);

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type(
    public_upload_path.get_full_object_path_str(),
    bytes.as_ref(),
    mime_type)
      .await
      .map_err(|e| {
        warn!("Upload media bytes to bucket error: {:?}", e);
        CreateSceneError::ServerError
      })?;

  // TODO(bt, 2024-02-22): This should be a transaction.
  let (token, record_id) = insert_media_file_from_file_upload(InsertMediaFileFromUploadArgs {
    maybe_media_class: Some(MediaFileClass::Dimensional),
    media_file_type: MediaFileType::SceneRon,
    maybe_creator_user_token: maybe_user_token.as_ref(),
    maybe_creator_anonymous_visitor_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility: Visibility::Public,
    upload_type: UploadType::StorytellerEngine,
    maybe_engine_category: Some(MediaFileEngineCategory::Scene),
    maybe_animation_type: None,
    maybe_mime_type: Some(mime_type),
    maybe_prompt_token: None,
    maybe_batch_token: None,
    file_size_bytes: file_size_bytes as u64,
    maybe_duration_millis: None,
    sha256_checksum: &hash,
    maybe_title: upload_media_request.title.as_deref(),
    maybe_scene_source_media_file_token: None,
    is_intermediate_system_file: false,
    maybe_generation_provider: None,
    public_bucket_directory_hash: public_upload_path.get_object_hash(),
    maybe_public_bucket_prefix: PREFIX,
    maybe_public_bucket_extension: SUFFIX,
    pool: &server_state.mysql_pool,
  })
      .await
      .map_err(|err| {
        warn!("New file creation DB error: {:?}", err);
        CreateSceneError::ServerError
      })?;

  info!("new media file id: {} token: {:?}", record_id, &token);

  let response = CreateSceneSuccessResponse {
    success: true,
    media_file_token: token,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| CreateSceneError::ServerError)?;

  return Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body));
}

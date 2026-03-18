// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::fmt;
use std::sync::Arc;

use actix_multipart::Multipart;
use actix_web::http::StatusCode;
use actix_web::web::BytesMut;
use actix_web::{web, HttpRequest, HttpResponse, ResponseError};
use futures::TryStreamExt;
use log::{error, info, warn};
use redis::Commands;

use enums::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use uuid_utils::uuid::generate_random_uuid;
use mysql_queries::queries::w2l::w2l_inference_jobs::insert_w2l_inference_job_extended::{insert_w2l_inference_job_extended, InsertW2lInferenceJobExtendedArgs};
use mysql_queries::queries::w2l::w2l_templates::check_w2l_template_exists::check_w2l_template_exists;
use redis_common::redis_keys::RedisKeys;

use crate::http_server::web_utils::read_multipart_field_bytes::checked_read_multipart_bytes;
use crate::http_server::web_utils::read_multipart_field_bytes::read_multipart_field_as_text;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

const BUCKET_AUDIO_FILE_NAME : &str = "input_audio_file";
const BUCKET_IMAGE_FILE_NAME: &str = "input_image_file";
const BUCKET_VIDEO_FILE_NAME : &str = "input_video_file";

const MIN_BYTES : usize = 10;
const MAX_BYTES : usize = 1024 * 1024 * 20;


#[derive(Serialize)]
pub struct InferW2lWithUploadSuccessResponse {
  pub success: bool,
  /// This is how frontend clients can request the job execution status.
  pub inference_job_token: String,
}

#[derive(Debug)]
pub enum InferW2lWithUploadError {
  BadInput(String),
  NotAuthorized,
  EmptyFileUploaded,
  ServerError,
  RateLimited,
}

impl ResponseError for InferW2lWithUploadError {
  fn status_code(&self) -> StatusCode {
    match *self {
      InferW2lWithUploadError::BadInput(_) => StatusCode::BAD_REQUEST,
      InferW2lWithUploadError::NotAuthorized => StatusCode::UNAUTHORIZED,
      InferW2lWithUploadError::EmptyFileUploaded => StatusCode::BAD_REQUEST,
      InferW2lWithUploadError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      InferW2lWithUploadError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      InferW2lWithUploadError::BadInput(reason) => reason.to_string(),
      InferW2lWithUploadError::NotAuthorized => "unauthorized".to_string(),
      InferW2lWithUploadError::EmptyFileUploaded => "empty file uploaded".to_string(),
      InferW2lWithUploadError::ServerError => "server error".to_string(),
      InferW2lWithUploadError::RateLimited => "rate limited".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for InferW2lWithUploadError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// This handles audio uploads w/ W2L templates.
pub async fn enqueue_infer_w2l_with_uploads(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  mut payload: Multipart
) -> Result<HttpResponse, InferW2lWithUploadError> {

  let ip_address = get_request_ip(&http_request);

  // ==================== READ SESSION ==================== //

  let maybe_session = server_state
    .session_checker
    .maybe_get_user_session(&http_request, &server_state.mysql_pool)
    .await
    .map_err(|e| {
      warn!("Session checker error: {:?}", e);
      InferW2lWithUploadError::ServerError
    })?;

  // ==================== BANNED USERS ==================== //

  if let Some(ref user) = maybe_session {
    if user.is_banned {
      return Err(InferW2lWithUploadError::NotAuthorized);
    }
  }

  // ==================== RATE LIMIT ==================== //

  let rate_limiter = match maybe_session {
    None => &server_state.redis_rate_limiters.logged_out,
    Some(ref _user) => &server_state.redis_rate_limiters.logged_in,
  };

  if let Err(_err) = rate_limiter.rate_limit_request(&http_request).await {
    return Err(InferW2lWithUploadError::RateLimited);
  }

  // ==================== SESSION DETAILS ==================== //

  let maybe_user_token : Option<String> = maybe_session
    .as_ref()
    .map(|user_session| user_session.user_token.as_str().to_string());

  let maybe_user_preferred_visibility : Option<Visibility> = maybe_session
      .as_ref()
      .map(|user_session| user_session.preferred_tts_result_visibility);

  let set_visibility = maybe_user_preferred_visibility
      .unwrap_or(Visibility::Public);

  info!("Enqueue infer w2l by user token: {:?}", maybe_user_token);

  // ==================== READ MULTIPART REQUEST ==================== //

  info!("Reading multipart request...");

  let mut maybe_uuid_idempotency_token: Option<String> = None;
  let mut maybe_template_token: Option<String> = None;
  let mut maybe_audio_file_name : Option<String> = None;
  let mut audio_bytes = BytesMut::with_capacity(0);

  while let Ok(Some(mut field)) = payload.try_next().await {
    let mut field_name = "".to_string();
    let mut filename = "".to_string();

    if let content_disposition = field.content_disposition() {
      field_name = content_disposition.get_name()
        .map(|s| s.to_string())
        .unwrap_or("".to_string());
      filename = content_disposition.get_filename()
        .map(|s| s.to_string())
        .unwrap_or("".to_string());
    }

    match field_name.as_ref() {
      "uuid_idempotency_token" => {
        // Form text field.
        maybe_uuid_idempotency_token = read_multipart_field_as_text(&mut field).await
          .map_err(|e| {
            warn!("Error reading idempotency token: {:}", e);
            InferW2lWithUploadError::ServerError
          })?;
      },
      "template_token" => {
        // Form text field.
        maybe_template_token = read_multipart_field_as_text(&mut field).await
          .map_err(|e| {
            warn!("Error reading template token: {:}", e);
            InferW2lWithUploadError::ServerError
          })?;
      },
      "audio" => {
        // Form binary data.
        maybe_audio_file_name = Some(filename.to_string());

        let maybe_bytes = checked_read_multipart_bytes(&mut field).await
          .map_err(|e| {
            warn!("Error reading audio upload: {:}", e);
            InferW2lWithUploadError::ServerError
          })?;

        audio_bytes = match maybe_bytes {
          Some(bytes) => bytes,
          None => {
            warn!("Empty file uploaded");
            return Err(InferW2lWithUploadError::EmptyFileUploaded); // Nothing was uploaded!
          },
        };
      },
      _ => continue,
    }

    info!("Saved file: {}.", &filename);
  }

  // ==================== CHECK REQUEST ==================== //

  let template_token = match &maybe_template_token {
    Some(ref token) => token.to_string(),
    None => {
      return Err(InferW2lWithUploadError::BadInput("No template selected".to_string()));
    }
  };

  let uuid_idempotency_token = match maybe_uuid_idempotency_token {
    Some(token) => token,
    None => {
      return Err(InferW2lWithUploadError::BadInput("No uuid idempotency token".to_string()));
    }
  };

  let exists = check_w2l_template_exists(&template_token, &server_state.mysql_pool).await
    .map_err(|e| {
      warn!("error checking tmpl existence : {:?}", e);
      InferW2lWithUploadError::ServerError
    })?;

  if !exists {
    return Err(InferW2lWithUploadError::BadInput("Template does not exist".to_string()));
  }

  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        warn!("redis error: {:?}", e);
        InferW2lWithUploadError::ServerError
      })?;

  let redis_count_key = RedisKeys::w2l_template_usage_count(&template_token);

  redis.incr::<_, _, ()>(&redis_count_key, 1)
      .map_err(|e| {
        warn!("redis error: {:?}", e);
        InferW2lWithUploadError::ServerError
      })?;

  // ==================== ANALYZE AND UPLOAD AUDIO FILE ==================== //

  let mut audio_type = "application/octet-stream".to_string();

  if let Some(maybe_type) = infer::get(audio_bytes.as_ref()) {
    audio_type = maybe_type.mime_type().to_string();
  }

  let upload_uuid = generate_random_uuid();

  let audio_upload_bucket_hash = upload_uuid.clone();

  //let audio_upload_bucket_path = hash_to_bucket_path_string(
  //  &upload_uuid,
  //  Some(&server_state.audio_uploads_bucket_root)
  //).map_err(|e| {
  //  warn!("Hash bucket path error: {:?}", e);
  //  InferW2lWithUploadError::ServerError
  //})?;

  let audio_upload_bucket_path = "THIS_IS_BROKEN_BECAUSE_W2L_IS_DEAD";

  info!("Uploading audio to bucket...");
  server_state.private_bucket_client.upload_file_with_content_type(
    &audio_upload_bucket_path,
    audio_bytes.as_ref(),
    &audio_type)
    .await
    .map_err(|e| {
      warn!("Upload audio bytes to bucket error: {:?}", e);
      InferW2lWithUploadError::ServerError
    })?;

  // ==================== SAVE JOB RECORD ==================== //

  info!("Creating w2l inference job record...");

  let job_token = insert_w2l_inference_job_extended(InsertW2lInferenceJobExtendedArgs {
    uuid_idempotency_token: &uuid_idempotency_token,
    maybe_template_token: maybe_template_token.as_deref(),
    audio_upload_bucket_hash: Some(&audio_upload_bucket_hash),
    audio_upload_bucket_path: Some(&audio_upload_bucket_path),
    maybe_audio_file_name: maybe_audio_file_name.as_deref(),
    audio_type: Some(&audio_type),
    maybe_user_token: maybe_user_token.as_deref(),
    ip_address: &ip_address,
    set_visibility,
    mysql_pool: &server_state.mysql_pool,
  }).await
      .map_err(|err| {
        error!("error inserting w2l inference job: {:?}", err);
        InferW2lWithUploadError::ServerError
      })?;

  server_state.firehose_publisher.enqueue_w2l_inference(maybe_user_token.as_deref(), &job_token, &template_token)
    .await
    .map_err(|e| {
      warn!("error publishing event: {:?}", e);
      InferW2lWithUploadError::ServerError
    })?;

  let response = InferW2lWithUploadSuccessResponse {
    success: true,
    inference_job_token: job_token.to_string(),
  };

  let body = serde_json::to_string(&response)
    .map_err(|_e| InferW2lWithUploadError::ServerError)?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}


use std::fmt;
use std::sync::Arc;

use crate::http_server::endpoints::webhooks::handle_image_payload::handle_image_payload;
use crate::http_server::endpoints::webhooks::handle_images_payload::handle_images_payload;
use crate::http_server::endpoints::webhooks::handle_model_glb_payload::handle_model_glb_payload;
use crate::http_server::endpoints::webhooks::handle_model_mesh_payload::handle_model_mesh_payload;
use crate::http_server::endpoints::webhooks::handle_video_payload::handle_video_payload;
use crate::state::server_state::ServerState;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::{web, HttpRequest, HttpResponse};
use anyhow::Error;
use http_server_common::response::response_success_helpers::SimpleGenericJsonSuccess;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::fal::get_inference_job_by_fal_id::get_inference_job_by_fal_id;
use mysql_queries::queries::generic_inference::fal::mark_fal_generic_inference_job_successfully_done::{mark_fal_generic_inference_job_successfully_done, MarkJobArgs};
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;
use serde_json::Value;
use utoipa::ToSchema;

// 1. tauri --> hit endpoint to enqueue
//
// 2. webhook
//  - upload media file
//  - update job record with media token + status
//
// 3. tauri --> storyteller jobs endpoint polls
//  - alert frontend of completion
//
// 4. javascript polls tauri  (backend removal)

// TODO(bt, 2025-06-03): Handle webhook crypto authentication
#[derive(Debug, Deserialize, ToSchema)]
pub struct FalWebhookRequest {
  pub status: FalWebhookStatus,

  pub request_id: Option<String>,
  pub gateway_request_id: Option<String>,

  pub error: Option<String>,

  /// Payload of the webhook, if any.
  pub payload: Option<Value>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub enum FalWebhookStatus {
  #[serde(alias = "OK")]
  Ok,
  #[serde(alias = "ERROR")]
  Error
}

// =============== Error Response ===============

#[derive(Debug, Serialize, ToSchema)]
pub enum FalWebhookError {
  BadInput(String),
  NotFound,
  NotAuthorized,
  ServerError,
}

impl ResponseError for FalWebhookError {
  fn status_code(&self) -> StatusCode {
    match *self {
      FalWebhookError::BadInput(_) => StatusCode::BAD_REQUEST,
      FalWebhookError::NotFound => StatusCode::NOT_FOUND,
      FalWebhookError::NotAuthorized => StatusCode::UNAUTHORIZED,
      FalWebhookError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for FalWebhookError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl From<anyhow::Error> for FalWebhookError {
  fn from(value: Error) -> Self {
    info!("Converting anyhow::Error to FalWebhookError: {:?}", value);
    FalWebhookError::ServerError
  }
}

// =============== Handler ===============

/// Fal webhook
#[utoipa::path(
  post,
  tag = "Webhooks",
  path = "/v1/webhooks/fal",
  responses(
    (status = 200, description = "Success", body = SimpleGenericJsonSuccess),
    (status = 400, description = "Bad input", body = FalWebhookError),
    (status = 401, description = "Not authorized", body = FalWebhookError),
    (status = 500, description = "Server error", body = FalWebhookError),
  ),
  params(
    ("request" = FalWebhookRequest, description = "Payload for Request"),
  )
)]
pub async fn fal_webhook_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  request: Json<FalWebhookRequest>,
) -> Result<Json<SimpleGenericJsonSuccess>, FalWebhookError> {

  info!("Received FAL webhook body: {:?}", request);

  let request_id = request.request_id
      .as_deref()
      .ok_or_else(|| FalWebhookError::BadInput("Missing request_id".to_string()))?;

  info!("FAL webhook request_id: {}", request_id);

  let payload = request.payload
      .as_ref()
      .ok_or_else(|| {
        warn!("FAL webhook missing payload for request_id: {}", request_id);
        FalWebhookError::BadInput("Missing payload".to_string())
      })?;

  let result = process_fal_webhook(&server_state, request_id, payload).await;

  if let Err(ref err) = result {
    error!("FAL webhook error for request_id {}: {:?}", request_id, err);

    let notification = NotificationDetailsBuilder::from_error(err)
        .set_title("FAL webhook processing failed".to_string())
        .set_description(Some(format!(
          "FAL webhook failed for request_id: {}\n\nError: {:?}",
          request_id, err,
        )))
        .set_third_party_id(Some(request_id.to_string()))
        .set_urgency(Some(NotificationUrgency::High))
        .set_http_method(Some(http_request.method().to_string()))
        .set_http_path(Some(http_request.path().to_string()))
        .build();

    if let Err(pager_err) = server_state.pager.enqueue_page(notification) {
      error!("Failed to enqueue FAL webhook pager alert: {:?}", pager_err);
    }
  }

  result
}

async fn process_fal_webhook(
  server_state: &ServerState,
  request_id: &str,
  payload: &Value,
) -> Result<Json<SimpleGenericJsonSuccess>, FalWebhookError> {

  let db_result = get_inference_job_by_fal_id(
    request_id,
    &server_state.mysql_pool,
  ).await;

  let job = match db_result {
    Ok(Some(record)) => record,
    Ok(None) => {
      warn!("Could not find job record by fal request_id: {}", request_id);
      return Err(FalWebhookError::NotFound)
    },
    Err(err) => {
      warn!("Error querying job record for request_id {}: {:?}", request_id, err);
      return Err(FalWebhookError::ServerError);
    }
  };

  info!("Fal webhook job record for request_id {}: {:?}", request_id, job);

  let mut maybe_media_token = None;
  let mut maybe_batch_token = None;

  if let Some(payload_obj) = payload.as_object() {
    if payload_obj.contains_key("image") {
      info!("Handling image payload for request_id {} / job {:?}", request_id, job.job_token);
      let token = handle_image_payload(payload_obj, &job, server_state).await?;
      maybe_media_token = Some(token);
    } else if payload_obj.contains_key("images") {
      (maybe_media_token, maybe_batch_token) = handle_images_payload(payload_obj, &job, server_state).await?;
    } else if payload_obj.contains_key("video") {
      info!("Handling video payload for request_id {} / job {:?}", request_id, job.job_token);
      let token = handle_video_payload(payload_obj, &job, server_state).await?;
      maybe_media_token = Some(token);
    } else if payload_obj.contains_key("model_glb") {
      info!("Handling model_glb payload for request_id {} / job {:?}", request_id, job.job_token);
      let token = handle_model_glb_payload(payload_obj, &job, server_state).await?;
      maybe_media_token = Some(token);
    } else if payload_obj.contains_key("model_mesh") {
      info!("Handling model_mesh payload for request_id {} / job {:?}", request_id, job.job_token);
      let token = handle_model_mesh_payload(payload_obj, &job, server_state).await?;
      maybe_media_token = Some(token);
    }
  }

  if let Some(media_token) = maybe_media_token {
    info!("Media file token for request_id {}: {:?}", request_id, media_token);
    mark_fal_generic_inference_job_successfully_done(MarkJobArgs {
      job_token: &job.job_token,
      media_file_token: &media_token,
      maybe_batch_token: maybe_batch_token.as_ref(),
      mysql_executor: &server_state.mysql_pool,
      phantom: Default::default(),
    }).await.map_err(|err| {
      warn!("Error marking job as successfully done for request_id {}: {:?}", request_id, err);
      FalWebhookError::ServerError
    })?;
  } else {
    warn!("No media token found in payload for request_id {} / job {:?}", request_id, job.job_token);
  }

  Ok(SimpleGenericJsonSuccess::wrapped(true))
}

use std::fmt;
use std::sync::Arc;

use crate::http_server::endpoints::webhooks::process_failure::handle_failed_fal_webhook::handle_failed_fal_webhook;
use crate::http_server::endpoints::webhooks::process_success::handle_successful_fal_webhook::handle_sucessful_fal_webhook;
use crate::state::server_state::ServerState;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::{web, HttpRequest, HttpResponse};
use anyhow::Error;
use http_server_common::response::response_success_helpers::SimpleGenericJsonSuccess;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use log::{error, info, warn};
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;
use serde_json::Value;
use utoipa::ToSchema;

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

  info!("FAL webhook request_id: {} (status: {:?})", request_id, request.status);

  // TODO(bt): Longer term, we should just use `fal_client` to parse webhooks and add lots of integration tests
  //  across dozens of real messages.
  let payload = request.payload
      .as_ref()
      .ok_or_else(|| {
        warn!("FAL webhook missing payload for request_id: {}", request_id);
        FalWebhookError::BadInput("Missing payload".to_string())
      })?;

  let result = match request.status {
    FalWebhookStatus::Ok => {
      handle_sucessful_fal_webhook(&server_state, request_id, payload).await
    }
    FalWebhookStatus::Error => {
      handle_failed_fal_webhook(
        &server_state,
        request_id,
        payload,
        request.error.as_deref(),
      ).await
    }
  };

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

use std::sync::Arc;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoints::webhooks::process_failure::handle_failed_fal_webhook::handle_failed_fal_webhook;
use crate::http_server::endpoints::webhooks::process_success::handle_successful_fal_webhook::handle_successful_fal_webhook;
use crate::state::server_state::ServerState;
use actix_web::web::Bytes;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use fal_client::webhook_api::parse_webhook_inner_payload::parse_webhook_inner_payload;
use fal_client::webhook_api::parse_webhook_payload::parse_webhook_payload;
use fal_client::webhook_api::payload::webhook_inner_payload::WebhookInnerPayload;
use http_server_common::response::response_success_helpers::SimpleGenericJsonSuccess;
use log::{error, info, warn};
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;

// =============== Handler ===============

// TODO(bt, 2025-06-03): Handle webhook crypto authentication
pub async fn fal_webhook_handler(
  http_request: HttpRequest,
  request_body_bytes: Bytes,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<SimpleGenericJsonSuccess>, AdvancedCommonWebError> {

  // Step 1: Parse bytes into a UTF-8 string and log it.
  let raw_body = String::from_utf8(request_body_bytes.to_vec())
      .map_err(|err| {
        error!("FAL webhook: could not decode request body to UTF-8: {:?}", err);
        enqueue_parse_error_alert(&server_state, &http_request, "UTF-8 decode failed", &err, None);
        // Ordinarily this is a user input error, but I want to know when this happens and see the error trace:
        // AdvancedCommonWebError::BadInputWithSimpleMessage("Could not decode request body to UTF-8".to_string())
        AdvancedCommonWebError::from_error(err)
      })?;

  info!("Received FAL webhook body: {}", raw_body);

  // Step 2: Parse into WebhookPayload.
  let webhook_payload = parse_webhook_payload(&raw_body)
      .map_err(|err| {
        error!("FAL webhook: could not parse webhook payload: {:?}", err);
        enqueue_parse_error_alert(&server_state, &http_request, "JSON parse failed", &err, Some(&raw_body));
        // Ordinarily this is a user input error, but I want to know when this happens and see the error trace:
        // AdvancedCommonWebError::BadInputWithSimpleMessage("Could not parse webhook payload".to_string())
        AdvancedCommonWebError::from_error(err)
      })?;

  let request_id = webhook_payload.request_id.as_str();

  info!("FAL webhook request_id: {} (status: {:?})", request_id, webhook_payload.status);

  // Step 3: Parse the inner payload.
  let inner_payload = parse_webhook_inner_payload(&webhook_payload);

  // Step 4 & 5: Branch on the inner payload type.
  let result = match inner_payload {
    WebhookInnerPayload::Success(success_data) => {
      handle_successful_fal_webhook(&server_state, request_id, &success_data.payload).await
    }
    WebhookInnerPayload::Error(error_data) => {
      handle_failed_fal_webhook(
        &server_state,
        request_id,
        &error_data,
        webhook_payload.error.as_deref(),
      ).await
    }
    WebhookInnerPayload::PayloadError(payload_error_data) => {
      warn!(
        "FAL webhook payload_error for request_id {}: {}",
        request_id, payload_error_data.payload_error,
      );
      Err(AdvancedCommonWebError::from_anyhow_error(
        anyhow::anyhow!("FAL payload_error: {}", payload_error_data.payload_error)
      ))
    }
  };

  if let Err(ref err) = result {
    if err.is_server_error() {
      error!("FAL webhook error for request_id {}: {:?}", request_id, err);

      let description = format!(
        "FAL webhook failed for request_id: {}\n\nError: {:?}\n\nWebhook JSON Payload: {}",
        request_id, err, raw_body,
      );

      let mut builder = if let Some(cause_arc) = err.clone_cause_arc() {
        NotificationDetailsBuilder::from_error(cause_arc)
            .set_title(format!("FAL webhook processing failed (request_id: {})", request_id))
      } else {
        NotificationDetailsBuilder::from_title(
          format!("FAL webhook processing failed (request_id: {})", request_id)
        )
      };

      builder = builder
          .set_description(Some(description))
          .set_third_party_id(Some(request_id.to_string()))
          .set_urgency(Some(NotificationUrgency::High))
          .set_http_method(Some(http_request.method().to_string()))
          .set_http_path(Some(http_request.path().to_string()));

      if let Err(pager_err) = server_state.pager.enqueue_page(builder.build()) {
        error!("Failed to enqueue FAL webhook pager alert: {:?}", pager_err);
      }
    }
  }

  result
}

// =============== Private helpers ===============

/// Send a pager alert for early parse failures (before we have a request_id).
fn enqueue_parse_error_alert<E: std::fmt::Debug>(
  server_state: &ServerState,
  http_request: &HttpRequest,
  context: &str,
  err: &E,
  maybe_raw_body: Option<&str>,
) {
  let description = match maybe_raw_body {
    Some(body) => format!("Error: {:?}\n\nWebhook JSON Payload: {}", err, body),
    None => format!("Error: {:?}", err),
  };

  let notification = NotificationDetailsBuilder::from_title(
        format!("FAL webhook parse failure: {}", context))
      .set_description(Some(description))
      .set_urgency(Some(NotificationUrgency::High))
      .set_http_method(Some(http_request.method().to_string()))
      .set_http_path(Some(http_request.path().to_string()))
      .build();

  if let Err(pager_err) = server_state.pager.enqueue_page(notification) {
    error!("Failed to enqueue FAL webhook parse error alert: {:?}", pager_err);
  }
}

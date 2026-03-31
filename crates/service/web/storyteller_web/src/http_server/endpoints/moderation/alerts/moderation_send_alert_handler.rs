use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::alerts::moderation_send_alert::{ModerationSendAlertRequest, ModerationSendAlertResponse, ModerationSendAlertUrgency};
use pager::client::pager::Pager;
use pager::notification::notification_details::NotificationDetails;
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{require_moderator, UseDatabase};
use crate::state::server_state::ServerState;

/// Send a test alert via the pager system. Moderators only.
#[utoipa::path(
  post,
  tag = "Moderation",
  path = "/v1/moderation/alerts/send",
  request_body = ModerationSendAlertRequest,
  responses(
    (status = 200, description = "Success", body = ModerationSendAlertResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn moderation_send_alert_handler(
  http_request: HttpRequest,
  request: Json<ModerationSendAlertRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModerationSendAlertResponse>, CommonWebError> {

  let user_session = require_moderator(&http_request, &server_state, UseDatabase::GrabNewConnection)
    .await
    .map_err(|_| CommonWebError::NotAuthorized)?;

  let title = request.title.clone()
    .unwrap_or_else(|| "Moderation Alert".to_string());

  let description = {
    let description = request.description.clone()
        .unwrap_or_else(|| "This moderation alert does not have a description.".to_string());

    let description = vec![
      description,
      format!("Sent by: {}", user_session.username),
    ];

    description.join("\n\n")
  };

  let urgency = request.urgency
      .map(|urgency| match urgency {
        ModerationSendAlertUrgency::High => NotificationUrgency::High,
        ModerationSendAlertUrgency::Medium => NotificationUrgency::Medium,
        ModerationSendAlertUrgency::Low => NotificationUrgency::Low,
      });

  let notification = NotificationDetailsBuilder::from_title(title)
      .set_description(Some(description))
      .set_http_method(Some(http_request.method().to_string()))
      .set_http_path(Some(http_request.path().to_string()))
      .set_urgency(urgency)
      .build();

  server_state.pager
    .enqueue_page(notification)
    .map_err(|err| {
      warn!("moderation_send_alert error: {:?}", err);
      CommonWebError::ServerError
    })?;

  Ok(Json(ModerationSendAlertResponse {
    success: true,
  }))
}

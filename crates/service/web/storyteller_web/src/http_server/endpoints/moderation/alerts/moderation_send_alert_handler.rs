use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::alerts::moderation_send_alert::{
  ModerationSendAlertRequest,
  ModerationSendAlertResponse,
};
use pager::client::pager::Pager;
use pager::notification::notification_details::NotificationDetails;

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

  let _user_session = require_moderator(&http_request, &server_state, UseDatabase::GrabNewConnection)
    .await
    .map_err(|_| CommonWebError::NotAuthorized)?;

  let title = request.title.clone()
    .unwrap_or_else(|| "Test Moderation Alert".to_string());

  let description = request.description.clone()
    .unwrap_or_else(|| "This is a test moderation alert.".to_string());

  let notification = NotificationDetails::with_summary_and_description(title, description);

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

use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::alerts::moderation_send_alert::{ModerationSendAlertRequest, ModerationSendAlertResponse, ModerationSendAlertUrgency};
use enums::by_table::staff_audit_logs::staff_audit_action::StaffAuditAction;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::staff_audit_logs::insert_staff_audit_log::{
  insert_staff_audit_log, InsertStaffAuditLogArgs,
};
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
    .map_err(|err| {
      warn!("Moderator check failed: {:?}", err);
      CommonWebError::NotAuthorized
    })?;

  let ip_address = get_request_ip(&http_request);

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
      CommonWebError::from_error(err)
    })?;

  // Insert staff audit log.
  let _audit_token = insert_staff_audit_log(InsertStaffAuditLogArgs {
    audit_action: StaffAuditAction::SendAlert,
    maybe_entity_type: None,
    maybe_entity_token: None,
    staff_user_token: &user_session.user_token,
    actor_ip_address: &ip_address,
    mysql_executor: &server_state.mysql_pool,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Failed to insert staff audit log: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  Ok(Json(ModerationSendAlertResponse {
    success: true,
  }))
}

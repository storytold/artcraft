use std::sync::Arc;
use std::time::Duration;

use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::{web, HttpRequest, HttpResponse, ResponseError};
use utoipa::ToSchema;

use crate::http_server::endpoints::app_state::components::get_status_alert::{get_status_alert, AppStateStatusAlertCategory};
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;

/// How often the client should poll
const REFRESH_INTERVAL: Duration = Duration::from_secs(60);

#[derive(Serialize, ToSchema)]
pub struct StatusAlertResponse {
  pub success: bool,

  /// If there's an alert, this will be set.
  /// The sub keys are optional, but at least one of them will be set.
  /// i.e. we can have an alert with no message or no predefined category.
  pub maybe_alert: Option<StatusAlertInfo>,

  /// Tell the frontend client how fast to refresh their view of this list.
  /// During an attack, we may want this to go extremely slow.
  pub refresh_interval_millis: u128,
}

#[derive(Serialize, ToSchema)]
pub struct StatusAlertInfo {
  /// If an alert is set, this might be a key for a common i18n message to show.
  pub maybe_category: Option<StatusAlertCategory>,

  /// We can set an optional message to show to the frontend.
  ///
  /// This field may or may not be set. If it's set, this is custom text that should
  /// be displayed to the user. For example, we might tell the user when we'll be
  /// back online, etc. Both this field and `maybe_category` are optional.
  ///
  /// If `maybe_category` is present, it should be a key for a predefined and
  /// internationalized (i18n) message stored on the frontend.
  ///
  /// Either or both of these fields may be set.
  pub maybe_message: Option<String>,
}

#[derive(Serialize, ToSchema, Copy, Clone)]
#[serde(rename_all = "snake_case")]
pub enum StatusAlertCategory {
  /// System is down for maintenance
  DownForMaintenance,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
#[utoipa::path(
  get,
  tag = "Misc",
  path = "/v1/status_alert_check",
  responses(
    (
      status = 200,
      description = "Check service status for frontend alert messages",
      body = StatusAlertResponse,
    ),
    (status = 500, description = "Server error", body = CommonWebError)
  ),
)]
pub async fn status_alert_handler(
  _http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<StatusAlertResponse>, CommonWebError> {

  let maybe_alert = get_status_alert(&server_state);

  let maybe_category = maybe_alert
      .as_ref()
      .map(|alert| alert.maybe_category)
      .flatten()
      .map(|category| match category {
        AppStateStatusAlertCategory::DownForMaintenance => StatusAlertCategory::DownForMaintenance,
      });

  let maybe_message = maybe_alert
      .map(|alert| alert.maybe_message)
      .flatten();

  let maybe_alert = match (maybe_category, maybe_message) {
    (None, None) => None,
    (category, message) => Some(StatusAlertInfo {
      maybe_category: category,
      maybe_message: message,
    }),
  };

  Ok(Json(StatusAlertResponse {
    success: true,
    maybe_alert,
    refresh_interval_millis: REFRESH_INTERVAL.as_millis(),
  }))
}

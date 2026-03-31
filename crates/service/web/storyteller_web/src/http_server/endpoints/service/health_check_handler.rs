use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use actix_web::web::Json;
use chrono::{DateTime, NaiveDateTime, Utc};
use log::error;

use http_server_common::response::serialize_as_json_error::serialize_as_json_error;

use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;

use crate::state::server_state::ServerState;

// =============== Success Response ===============

#[derive(Serialize)]
pub struct HealthCheckResponse {
  pub success: bool,
  pub is_healthy: bool,
  pub last_db_time: Option<NaiveDateTime>,
  pub healthy_check_consecutive_count: Option<u64>,
  pub unhealthy_check_consecutive_count: Option<u64>,
  pub server_build_sha: String,
  pub server_hostname: String,
  pub startup_time: DateTime<Utc>,
  pub seconds_since_startup: u64,
}


// =============== Error Response ===============

#[derive(Debug, Serialize)]
pub enum HealthCheckError {
  ServerError,
}

impl ResponseError for HealthCheckError {
  fn status_code(&self) -> StatusCode {
    match *self {
      HealthCheckError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for HealthCheckError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn get_health_check_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, HealthCheckError> {
  let health_check_status = server_state.health_check_status.get_health_check_status()
      .map_err(|e| {
        error!("Error serving health check status: {:?}", e);
        HealthCheckError::ServerError
      })?;

  let is_healthy = health_check_status.is_healthy;

  let now = Utc::now();
  let seconds_since_startup = now.signed_duration_since(server_state.startup_time)
      .num_seconds()
      .unsigned_abs();

  if !is_healthy {
    let notification = NotificationDetailsBuilder::from_title(
          format!("Health check unhealthy on {}", server_state.hostname))
        .set_description(Some(format!(
          "Health check returned unhealthy.\n\n\
             Hostname: {}\n\
             Build SHA: {}\n\
             Seconds since startup: {}\n\
             Unhealthy consecutive count: {:?}\n\
             Last DB time: {:?}",
          server_state.hostname,
          server_state.server_info.build_sha,
          seconds_since_startup,
          health_check_status.unhealthy_check_consecutive_count,
          health_check_status.last_db_time,
        )))
        .set_urgency(Some(NotificationUrgency::High))
        .set_http_method(Some(http_request.method().to_string()))
        .set_http_path(Some(http_request.path().to_string()))
        .build();

    if let Err(err) = server_state.pager.enqueue_page(notification) {
      error!("Failed to enqueue health check alert: {:?}", err);
    }
  }

  let response = HealthCheckResponse {
    success: true,
    is_healthy: health_check_status.is_healthy,
    last_db_time: health_check_status.last_db_time,
    healthy_check_consecutive_count: health_check_status.healthy_check_consecutive_count,
    unhealthy_check_consecutive_count: health_check_status.unhealthy_check_consecutive_count,
    server_build_sha: server_state.server_info.build_sha.clone(),
    server_hostname: server_state.hostname.clone(),
    startup_time: server_state.startup_time,
    seconds_since_startup,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| HealthCheckError::ServerError)?;

  if is_healthy {
    Ok(HttpResponse::Ok()
        .content_type("application/json")
        .body(body))
  } else {
    Ok(HttpResponse::InternalServerError()
        .content_type("application/json")
        .body(body))
  }
}

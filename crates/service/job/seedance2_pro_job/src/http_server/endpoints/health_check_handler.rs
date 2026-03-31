use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::header::ContentType;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::error;

use actix_helpers::response_serializers::error_to_json_http_response::error_to_json_http_response;
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;

use crate::http_server::http_server_shared_state::HttpServerSharedState;

#[derive(Serialize)]
pub struct HealthCheckResponse {
  pub success: bool,
  pub is_healthy: bool,
  pub consecutive_failure_count: u64,
  pub consecutive_success_count: u64,
  pub total_failure_count: u64,
  pub total_success_count: u64,
  pub total_failure_ratio: f32,
  pub total_success_ratio: f32,
}

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
    error_to_json_http_response(self)
  }
}

impl std::fmt::Display for HealthCheckError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn get_health_check_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<HttpServerSharedState>>,
) -> Result<HttpResponse, HealthCheckError> {
  let job_stats = server_state
    .job_stats
    .get_status()
    .map_err(|e| {
      error!("Error serving health check status: {:?}", e);
      HealthCheckError::ServerError
    })?;

  let total_tries = job_stats
    .total_failure_count
    .saturating_add(job_stats.total_success_count);

  let total_success_ratio = if total_tries > 0 {
    (job_stats.total_success_count as f32) / (total_tries as f32)
  } else {
    0.0
  };

  let total_failure_ratio = if total_tries > 0 {
    1.0 - total_success_ratio
  } else {
    0.0
  };

  let is_healthy =
    job_stats.consecutive_failure_count < server_state.consecutive_failure_unhealthy_threshold;

  if !is_healthy {
    let notification = NotificationDetailsBuilder::from_title(
          format!("Health check unhealthy on {}", server_state.hostname))
        .set_description(Some(format!(
          "Health check returned unhealthy.\n\n\
             Hostname: {}\n\
             Consecutive failure count: {}\n\
             Total failure count: {}\n\
             Total success count: {}",
          server_state.hostname,
          job_stats.consecutive_failure_count,
          job_stats.total_failure_count,
          job_stats.total_success_count,
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
    is_healthy,
    consecutive_failure_count: job_stats.consecutive_failure_count,
    consecutive_success_count: job_stats.consecutive_success_count,
    total_failure_count: job_stats.total_failure_count,
    total_success_count: job_stats.total_success_count,
    total_failure_ratio,
    total_success_ratio,
  };

  let body = serde_json::to_string(&response).map_err(|_e| HealthCheckError::ServerError)?;

  if is_healthy {
    Ok(HttpResponse::Ok()
      .content_type(ContentType::json())
      .body(body))
  } else {
    Ok(HttpResponse::InternalServerError()
      .content_type(ContentType::json())
      .body(body))
  }
}

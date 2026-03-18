use std::sync::Arc;

use actix_web::{HttpRequest, HttpResponse, web};
use actix_web::error::ResponseError;
use actix_web::http::header::ContentType;
use actix_web::http::StatusCode;
use log::error;

use actix_helpers::response_serializers::error_to_json_http_response::error_to_json_http_response;

use crate::http_server::http_server_shared_state::HttpServerSharedState;

// =============== Success Response ===============

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
    error_to_json_http_response(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl std::fmt::Display for HealthCheckError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

pub async fn get_health_check_handler(
  _http_request: HttpRequest,
  server_state: web::Data<Arc<HttpServerSharedState>>
) -> Result<HttpResponse, HealthCheckError> {
  let job_stats = server_state.job_stats.get_status()
      .map_err(|e| {
        error!("Error serving health check status: {:?}", e);
        HealthCheckError::ServerError
      })?;

  let total_tries = job_stats.total_failure_count.saturating_add(job_stats.total_success_count);

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

  let body = serde_json::to_string(&response)
      .map_err(|_e| HealthCheckError::ServerError)?;

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

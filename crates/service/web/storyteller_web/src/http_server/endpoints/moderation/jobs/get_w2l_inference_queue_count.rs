use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{error, warn};

use mysql_queries::queries::w2l::w2l_inference_jobs::get_pending_w2l_inference_job_detailed_stats::{get_pending_w2l_inference_job_detailed_stats, PendingCountResult};

use crate::http_server::web_utils::serialize_as_json_error::serialize_as_json_error;
use crate::state::server_state::ServerState;

#[derive(Serialize)]
pub struct GetW2lInferenceQueueCountResponse {
  pub success: bool,
  pub pending_count: i64,
  pub seconds_since_first: i64,
}

#[derive(Debug, Serialize)]
pub enum GetW2lInferenceQueueCountError {
  ServerError,
  Unauthorized,
}

impl ResponseError for GetW2lInferenceQueueCountError {
  fn status_code(&self) -> StatusCode {
    match *self {
      GetW2lInferenceQueueCountError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      GetW2lInferenceQueueCountError::Unauthorized => StatusCode::UNAUTHORIZED,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using DeriveMore since Clion doesn't understand it.
impl fmt::Display for GetW2lInferenceQueueCountError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

pub async fn get_w2l_inference_queue_count_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<GetW2lInferenceQueueCountResponse>, GetW2lInferenceQueueCountError> {

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        GetW2lInferenceQueueCountError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(GetW2lInferenceQueueCountError::Unauthorized);
    }
  };

  // TODO: Not a good fit for this permission.
  if !user_session.can_ban_users {
    warn!("user is not allowed to view bans: {:?}", user_session.user_token);
    return Err(GetW2lInferenceQueueCountError::Unauthorized);
  }

  let result = get_pending_w2l_inference_job_detailed_stats(&server_state.mysql_pool)
      .await
      .map_err(|err| {
        error!("get w2l pending count error: {:?}", err);
        GetW2lInferenceQueueCountError::ServerError
      })?
      .unwrap_or(
        // NB: Not Found for null results means nothing is pending in the queue
        PendingCountResult {
          pending_count: None,
          seconds_since_first: 0,
        }
      );

  let response = GetW2lInferenceQueueCountResponse {
    success: true,
    pending_count: result.pending_count.unwrap_or(0),
    seconds_since_first: result.seconds_since_first,
  };

  Ok(Json(response))
}

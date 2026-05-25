use std::sync::Arc;

use actix_web::{web, HttpMessage, HttpRequest};
use actix_web::web::Json;
use log::error;
use utoipa::ToSchema;

use mysql_queries::queries::generic_inference::web::dismiss_finished_jobs_for_user::dismiss_finished_jobs_for_user;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::web_utils::user_session::require_user_session_using_connection::require_user_session_using_connection;
use crate::state::server_state::ServerState;

#[derive(Serialize, ToSchema)]
pub struct DismissFinishedSessionJobsSuccessResponse {
  pub success: bool,
}

/// Mark all jobs that are finished (or that failed completely and will not retry) as dismissed.
///
/// This will prevent these jobs from being returned in the "list session jobs" endpoint.
#[utoipa::path(
  post,
  tag = "Jobs",
  path = "/v1/jobs/session/dismiss_finished",
  responses(
    (status = 200, body = DismissFinishedSessionJobsSuccessResponse),
    (status = 401, body = AdvancedCommonWebError),
    (status = 500, body = AdvancedCommonWebError),
  ),
)]
pub async fn dismiss_finished_session_jobs_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>) -> Result<Json<DismissFinishedSessionJobsSuccessResponse>, AdvancedCommonWebError>
{
  let mut mysql_connection = server_state.mysql_pool.acquire()
      .await
      .map_err(|e| {
        error!("Could not acquire DB pool: {:?}", e);
        AdvancedCommonWebError::from_error(e)
      })?;

  let user_session = require_user_session_using_connection(
      &http_request, &server_state.session_checker, &mut mysql_connection)
      .await?;

  dismiss_finished_jobs_for_user(&mut mysql_connection, &user_session.user_token)
      .await
      .map_err(|err| {
        error!("tts job query error: {:?}", err);
        AdvancedCommonWebError::from_anyhow_error(err)
      })?;

  Ok(Json(DismissFinishedSessionJobsSuccessResponse {
    success: true,
  }))
}

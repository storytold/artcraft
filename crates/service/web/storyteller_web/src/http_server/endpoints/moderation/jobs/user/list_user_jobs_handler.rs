use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::jobs::user::list_user_jobs::{
  ListUserJobsEntry,
  ListUserJobsPathInfo,
  ListUserJobsResponse,
};
use mysql_queries::queries::generic_inference::web::list_user_jobs_for_moderation::list_user_jobs_for_moderation;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{require_moderator, UseDatabase};
use crate::state::server_state::ServerState;

/// List jobs for a user (moderation)
#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/jobs/user/{user_token}/list",
  responses(
    (status = 200, description = "Success", body = ListUserJobsResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
  params(
    ("user_token" = UserToken, Path, description = "User token to look up jobs for"),
  )
)]
pub async fn list_user_jobs_handler(
  http_request: HttpRequest,
  path: Path<ListUserJobsPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListUserJobsResponse>, CommonWebError> {

  let _user_session = require_moderator(&http_request, &server_state, UseDatabase::GrabNewConnection)
    .await
    .map_err(|_| CommonWebError::NotAuthorized)?;

  let results = list_user_jobs_for_moderation(&path.user_token, &server_state.mysql_pool)
    .await
    .map_err(|err| {
      warn!("list_user_jobs error: {:?}", err);
      CommonWebError::ServerError
    })?;

  let jobs = results.into_iter().map(|row| ListUserJobsEntry {
    job_status: row.job_status,
    job_failure_reason: row.job_failure_reason,
    credits_delta: row.credits_delta,
    maybe_linked_refund_ledger_token: row.maybe_linked_refund_ledger_token,
    on_success_result_media_token: row.on_success_result_media_token,
    job_token: row.job_token,
    wallet_ledger_entry_token: row.wallet_ledger_entry_token,
    wallet_ledger_entry_type: row.wallet_ledger_entry_type,
  }).collect();

  Ok(Json(ListUserJobsResponse {
    success: true,
    jobs,
  }))
}

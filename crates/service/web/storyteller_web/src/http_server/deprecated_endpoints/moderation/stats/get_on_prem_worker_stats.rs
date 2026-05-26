use std::sync::Arc;

use actix_web::web::Query;
use actix_web::{http::StatusCode, web, HttpRequest, HttpResponse, ResponseError};
use log::warn;

use mysql_queries::queries::stats::get_on_prem_worker_stats::get_on_prem_worker_stats;

use crate::http_server::web_utils::serialize_as_json_error::serialize_as_json_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

const MIN_SAMPLE_SIZE : u32 = 100;
const MAX_SAMPLE_SIZE : u32 = 10_000;
const DEFAULT_SAMPLE_SIZE : u32 = 1000;

#[derive(Deserialize)]
pub struct QueryFields {
  sample_size: Option<u32>,
}

#[derive(Serialize)]
pub struct GetOnPremWorkerStatsResponse {
  pub success: bool,
  pub worker_mix_stats: WorkerMixStats,
}

#[derive(Serialize)]
pub struct WorkerMixStats {
  // NB: Numbers are negative when sample could not be queried.
  pub total_records_sampled: i64,
  pub on_prem_count: i64,
  pub cloud_count: i64,
}
// NB: Not using DeriveMore since Clion doesn't understand it.
pub async fn get_on_prem_worker_stats_handler(
  http_request: HttpRequest,
  query: Query<QueryFields>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<HttpResponse, CommonWebError> {

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(CommonWebError::NotAuthorized);
    }
  };

  // TODO: Not a good fit for this permission.
  if !user_session.can_edit_other_users_tts_models {
    warn!("user is not allowed to edit user tts: {:?}", user_session.user_token);
    return Err(CommonWebError::NotAuthorized);
  }

  let sample_size = query.sample_size
      .unwrap_or(DEFAULT_SAMPLE_SIZE)
      .max(MIN_SAMPLE_SIZE)
      .min(MAX_SAMPLE_SIZE);

  let result = get_on_prem_worker_stats(
    &server_state.mysql_pool, sample_size
  )
      .await
      .map_err(|e| {
        CommonWebError::from_anyhow_error(e)
      })?;

  let response = GetOnPremWorkerStatsResponse {
    success: true,
    worker_mix_stats: WorkerMixStats {
      total_records_sampled: result.total_records_sampled,
      on_prem_count: result.on_prem_count,
      cloud_count: result.cloud_count,
    }
  };

  let body = serde_json::to_string(&response)
      .map_err(CommonWebError::from_error)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}


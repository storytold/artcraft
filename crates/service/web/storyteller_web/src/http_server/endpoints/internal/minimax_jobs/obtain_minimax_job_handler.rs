use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::{error, info};
use sqlx::Acquire;

use artcraft_api_defs::internal::minimax_jobs::minimax_worker_model::MinimaxWorkerModel;
use artcraft_api_defs::internal::minimax_jobs::obtain_minimax_job::{
  ObtainMinimaxJobRequest, ObtainMinimaxJobResponse, ObtainedMinimaxJob,
};
use mysql_queries::queries::generic_inference::first_party::minimax_h3::insert_generic_inference_job_for_first_party_minimax_h3_with_apriori_job_token::FirstPartyMinimaxH3Model;
use mysql_queries::queries::generic_inference::first_party::minimax_h3::mark_first_party_minimax_h3_job_started::{
  mark_first_party_minimax_h3_job_started, MarkFirstPartyMinimaxH3JobStartedArgs,
};
use mysql_queries::queries::generic_inference::first_party::minimax_h3::select_pending_first_party_minimax_h3_job_for_update::{
  select_pending_first_party_minimax_h3_job_for_update, SelectPendingFirstPartyMinimaxH3JobForUpdateArgs,
};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::require_internal_api_key::require_internal_api_key;
use crate::state::server_state::ServerState;

/// Internal (worker-facing): obtain a lock on a pending first-party Minimax
/// job by atomically moving it from `pending` to `started`.
#[utoipa::path(
  post,
  tag = "Internal (Minimax Jobs)",
  path = "/v1/internal/minimax_jobs/obtain_job",
  request_body = ObtainMinimaxJobRequest,
  responses(
    (status = 200, description = "Success (maybe_job is null when no pending job exists)", body = ObtainMinimaxJobResponse),
    (status = 401, description = "Missing or invalid internal API key"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn obtain_minimax_job_handler(
  http_request: HttpRequest,
  request: Json<ObtainMinimaxJobRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ObtainMinimaxJobResponse>, CommonWebError> {

  require_internal_api_key(&http_request, &server_state)?;

  let minimax_model = match request.model {
    MinimaxWorkerModel::MinimaxH3Turbo => FirstPartyMinimaxH3Model::Turbo,
    MinimaxWorkerModel::MinimaxH3Ultra => FirstPartyMinimaxH3Model::Ultra,
  };

  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

  // The select-then-mark pair runs in one transaction: `FOR UPDATE SKIP
  // LOCKED` guarantees two workers can never obtain the same job.
  let mut transaction = mysql_connection.begin().await.map_err(|err| {
    error!("Error starting MySQL transaction: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let maybe_job_token = select_pending_first_party_minimax_h3_job_for_update(
    SelectPendingFirstPartyMinimaxH3JobForUpdateArgs {
      minimax_model,
      mysql_executor: &mut *transaction,
      phantom: Default::default(),
    }
  ).await.map_err(|err| {
    error!("Error selecting pending minimax job: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let Some(job_token) = maybe_job_token else {
    return Ok(Json(ObtainMinimaxJobResponse {
      success: true,
      maybe_job: None,
    }));
  };

  mark_first_party_minimax_h3_job_started(MarkFirstPartyMinimaxH3JobStartedArgs {
    job_token: &job_token,
    worker_hostname: &request.worker_hostname,
    cluster_name: &request.cluster_name,
    mysql_executor: &mut *transaction,
    phantom: Default::default(),
  }).await.map_err(|err| {
    error!("Error marking minimax job {} started: {:?}", job_token, err);
    CommonWebError::from_error(err)
  })?;

  transaction.commit().await.map_err(|err| {
    error!("Error committing transaction: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  info!("Worker {:?} (cluster {:?}) obtained minimax job {}",
    request.worker_hostname, request.cluster_name, job_token);

  Ok(Json(ObtainMinimaxJobResponse {
    success: true,
    maybe_job: Some(ObtainedMinimaxJob {
      job_token,
      model: request.model,
    }),
  }))
}

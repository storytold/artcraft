use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::{error, info, warn};
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, MySql};

use artcraft_api_defs::internal::minimax_jobs::minimax_worker_model::MinimaxWorkerModel;
use artcraft_api_defs::internal::minimax_jobs::obtain_minimax_job::{
  MinimaxJobMediaReference, MinimaxJobPromptDetails, ObtainMinimaxJobRequest, ObtainMinimaxJobResponse,
  ObtainedMinimaxJob,
};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use mysql_queries::queries::generic_inference::first_party::minimax_h3::first_party_minimax_h3_model::FirstPartyMinimaxH3Model;
use mysql_queries::queries::generic_inference::first_party::minimax_h3::mark_first_party_minimax_h3_job_started::{
  mark_first_party_minimax_h3_job_started, MarkFirstPartyMinimaxH3JobStartedArgs,
};
use mysql_queries::queries::generic_inference::first_party::minimax_h3::select_pending_first_party_minimax_h3_job_for_update::{
  select_pending_first_party_minimax_h3_job_for_update, PendingFirstPartyMinimaxH3Job,
  SelectPendingFirstPartyMinimaxH3JobForUpdateArgs,
};
use mysql_queries::queries::prompt_context_items::list_prompt_context_items::list_prompt_context_items;
use mysql_queries::queries::prompts::get_prompt::get_prompt_from_connection;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::web_utils::require_internal_api_key::require_internal_api_key;
use crate::state::server_state::ServerState;

/// Internal (worker-facing): obtain a lock on a pending first-party Minimax
/// job by atomically moving it from `pending` to `started`. The response
/// carries everything the worker needs to run inference: the text prompt,
/// generation settings, and full CDN links to every media reference.
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

  let maybe_pending_job = select_pending_first_party_minimax_h3_job_for_update(
    SelectPendingFirstPartyMinimaxH3JobForUpdateArgs {
      minimax_model,
      transaction: &mut transaction,
    }
  ).await.map_err(|err| {
    error!("Error selecting pending minimax job: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let Some(pending_job) = maybe_pending_job else {
    return Ok(Json(ObtainMinimaxJobResponse {
      success: true,
      maybe_job: None,
    }));
  };

  mark_first_party_minimax_h3_job_started(MarkFirstPartyMinimaxH3JobStartedArgs {
    job_token: &pending_job.job_token,
    maybe_worker_hostname: request.worker_hostname.as_deref(),
    maybe_cluster_name: request.cluster_name.as_deref(),
    transaction: &mut transaction,
  }).await.map_err(|err| {
    error!("Error marking minimax job {} started: {:?}", pending_job.job_token, err);
    CommonWebError::from_error(err)
  })?;

  transaction.commit().await.map_err(|err| {
    error!("Error committing transaction: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  info!("Worker {:?} (cluster {:?}) obtained minimax job {}",
    request.worker_hostname, request.cluster_name, pending_job.job_token);

  // Hydrate the prompt + media references the worker needs. Best-effort: the
  // job is already locked, so a hydration failure yields `maybe_prompt: None`
  // and the worker should report the job failed rather than us wedging it.
  let maybe_prompt = build_prompt_details(
    &http_request,
    &server_state,
    &pending_job,
    &mut mysql_connection,
  ).await;

  Ok(Json(ObtainMinimaxJobResponse {
    success: true,
    maybe_job: Some(ObtainedMinimaxJob {
      job_token: pending_job.job_token,
      model: request.model,
      maybe_prompt,
    }),
  }))
}

/// Fetch the prompt record and its media references, resolving each media
/// file to full CDN links.
async fn build_prompt_details(
  http_request: &HttpRequest,
  server_state: &ServerState,
  pending_job: &PendingFirstPartyMinimaxH3Job,
  mysql_connection: &mut PoolConnection<MySql>,
) -> Option<MinimaxJobPromptDetails> {
  let Some(prompt_token) = pending_job.maybe_prompt_token.as_ref() else {
    warn!("Minimax job {} has no prompt token", pending_job.job_token);
    return None;
  };

  let prompt = match get_prompt_from_connection(prompt_token, mysql_connection).await {
    Ok(Some(prompt)) => prompt,
    Ok(None) => {
      warn!("Prompt {} for minimax job {} not found", prompt_token, pending_job.job_token);
      return None;
    }
    Err(err) => {
      error!("Error fetching prompt {} for minimax job {}: {:?}",
        prompt_token, pending_job.job_token, err);
      return None;
    }
  };

  let context_items = match list_prompt_context_items(prompt_token, mysql_connection).await {
    Ok(items) => items,
    Err(err) => {
      // Don't hand the worker a prompt with silently-missing references.
      error!("Error listing prompt context items for {} (minimax job {}): {:?}",
        prompt_token, pending_job.job_token, err);
      return None;
    }
  };

  let media_domain = get_media_domain(http_request);

  let media_references = context_items
    .into_iter()
    .map(|item| {
      let bucket_path = MediaFileBucketPath::from_object_hash(
        &item.public_bucket_directory_hash,
        item.maybe_public_bucket_prefix.as_deref(),
        item.maybe_public_bucket_extension.as_deref());

      let media_links = MediaLinksBuilder::from_media_path_and_env(
        media_domain,
        server_state.server_environment,
        &bucket_path);

      MinimaxJobMediaReference {
        media_file_token: item.media_token,
        semantic_type: item.context_semantic_type,
        media_links,
      }
    })
    .collect();

  Some(MinimaxJobPromptDetails {
    prompt_token: prompt.token,
    maybe_positive_prompt: prompt.maybe_positive_prompt,
    maybe_negative_prompt: prompt.maybe_negative_prompt,
    maybe_generation_mode: prompt.maybe_generation_mode,
    maybe_aspect_ratio: prompt.maybe_aspect_ratio,
    maybe_resolution: prompt.maybe_resolution,
    maybe_bitrate: prompt.maybe_bitrate,
    maybe_generate_audio: prompt.maybe_generate_audio,
    maybe_duration_seconds: prompt.maybe_duration_seconds,
    media_references,
  })
}

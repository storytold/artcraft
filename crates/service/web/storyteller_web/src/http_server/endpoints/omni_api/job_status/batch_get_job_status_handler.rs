use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use actix_web_lab::extract::Query;
use log::{error, warn};
use redis::Commands;

use artcraft_api_defs::omni_api::job_status::omni_api_batch_get_job_status::{OmniApiBatchGetJobStatusQueryParams, OmniApiBatchGetJobStatusSuccessResponse};
use mysql_queries::queries::generic_inference::web::batch_get_inference_job_status::batch_get_inference_job_status;
use mysql_queries::queries::generic_inference::web::job_status::GenericInferenceJobStatus;
use redis_common::redis_keys::RedisKeys;
use server_environment::ServerEnvironment;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_domain::MediaDomain;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::endpoints::omni_api::job_status::record_to_payload::record_to_payload;
use crate::http_server::user_lookup::api_keys::require_api_key_user::require_api_key_user;
use crate::state::server_state::ServerState;

/// For certain jobs or job classes (eg. non-premium), we kill the jobs if the user hasn't
/// maintained a keepalive. This prevents wasted work when users who are unlikely to return
/// navigate away. Premium users have accounts and can always return to the site, so they
/// typically do not require keepalive.
const JOB_KEEPALIVE_TTL_SECONDS: u64 = 60 * 3;

/// Get job statuses for a batch of multiple job tokens (Omni API, API-key authenticated).
///
/// Mirrors `/v1/jobs/batch` but reads the caller's identity from the
/// `Authorization` header API key instead of a session cookie.
#[utoipa::path(
  get,
  tag = "Omni API",
  path = "/v1/omni_api/job_status/batch",
  responses(
    (status = 200, body = OmniApiBatchGetJobStatusSuccessResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500),
  ),
  params(
    OmniApiBatchGetJobStatusQueryParams
  )
)]
pub async fn omni_api_batch_get_job_status_handler(
  http_request: HttpRequest,
  query: Query<OmniApiBatchGetJobStatusQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<OmniApiBatchGetJobStatusSuccessResponse>, CommonWebError> {
  // ==================== API KEY USER ==================== //

  // API-key authentication (Authorization header) instead of a session cookie. Never cached, and a
  // banned owner is rejected inside `require_api_key_user`. Drop the connection before the job
  // lookups below so we don't hold a pool slot idle.
  let mut mysql_connection = server_state.mysql_pool.acquire().await?;
  require_api_key_user(&http_request, &mut *mysql_connection).await?;
  drop(mysql_connection);

  let tokens = query.tokens.iter()
      .map(|token| token.trim())
      // NB: A bunch of Python clients use our API and can fail in this manner.
      .filter(|token| !token.is_empty() && *token != "None")
      .map(|token| InferenceJobToken::new_from_str(token))
      .collect::<Vec<_>>();

  if tokens.is_empty() {
    // NB: MediaDomain doesn't matter since it's an empty list.
    return Ok(records_to_response(
      Vec::new(),
      server_state.server_environment,
      MediaDomain::Storyteller,
    ));
  }

  let records = batch_get_inference_job_status(
    &tokens,
    &server_state.mysql_pool,
  ).await
      .map_err(|err| {
        warn!("Batch job query error: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?;

  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        warn!("Redis pool error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  // TODO(bt,2024-04-22): Look up the extra redis statuses per item.

  let keepalive_keys = records.iter()
      .filter(|record| record.is_keepalive_required)
      .map(|record| RedisKeys::generic_inference_keepalive(record.job_token.as_str()))
      .collect::<Vec<_>>();

  for key in keepalive_keys.iter() {
    // TODO(bt,2024-04-22): There is no msetex. We'll need to run a Redis pipeline here.
    let _: Option<String> = match redis.set_ex(key, "1", JOB_KEEPALIVE_TTL_SECONDS) {
      Ok(Some(status)) => Some(status),
      Ok(None) => None,
      Err(e) => {
        error!("redis error setting job keepalive: {:?}", e);
        None // Fail open (which in this case is bad! it will kill jobs if cluster has many jobs / is slow!)
      }
    };
  }

  let media_domain = get_media_domain(&http_request);

  Ok(records_to_response(records, server_state.server_environment, media_domain))
}

fn records_to_response(
  records: Vec<GenericInferenceJobStatus>,
  server_environment: ServerEnvironment,
  media_domain: MediaDomain,
) -> Json<OmniApiBatchGetJobStatusSuccessResponse> {
  Json(OmniApiBatchGetJobStatusSuccessResponse {
    success: true,
    job_states: records.into_iter()
        .map(|record| record_to_payload(record, server_environment, media_domain))
        .collect::<Vec<_>>(),
  })
}

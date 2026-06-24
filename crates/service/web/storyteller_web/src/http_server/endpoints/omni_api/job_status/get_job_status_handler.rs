use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::{error, warn};
use redis::Commands;

use artcraft_api_defs::omni_api::job_status::omni_api_get_job_status::{OmniApiGetJobStatusPathInfo, OmniApiGetJobStatusSuccessResponse};
use mysql_queries::queries::generic_inference::web::get_inference_job_status::get_inference_job_status;
use redis_common::redis_keys::RedisKeys;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::endpoints::omni_api::job_status::record_to_payload::record_to_payload;
use crate::http_server::user_lookup::api_keys::require_api_key_user::require_api_key_user;
use crate::state::server_state::ServerState;

/// For certain jobs or job classes (eg. non-premium), we kill the jobs if the user hasn't
/// maintained a keepalive. This prevents wasted work when users who are unlikely to return
/// navigate away. Premium users have accounts and can always return to the site, so they
/// typically do not require keepalive.
const JOB_KEEPALIVE_TTL_SECONDS: u64 = 60 * 3;

/// Get the status for a single job (Omni API, API-key authenticated).
///
/// Mirrors `/v1/jobs/job/{token}` but reads the caller's identity from the
/// `Authorization` header API key instead of a session cookie.
#[utoipa::path(
  get,
  tag = "Omni API",
  path = "/v1/omni_api/job_status/job/{token}",
  params(
    ("path" = OmniApiGetJobStatusPathInfo, description = "Path params for Request")
  ),
  responses(
    (status = 200, body = OmniApiGetJobStatusSuccessResponse),
    (status = 401, description = "Unauthorized"),
    (status = 404),
    (status = 500),
  ),
)]
pub async fn omni_api_get_job_status_handler(
  http_request: HttpRequest,
  path: Path<OmniApiGetJobStatusPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<OmniApiGetJobStatusSuccessResponse>, CommonWebError> {
  // ==================== API KEY USER ==================== //

  // API-key authentication (Authorization header) instead of a session cookie. Never cached, and a
  // banned owner is rejected inside `require_api_key_user`. Drop the connection before the job
  // lookups below so we don't hold a pool slot idle.
  let mut mysql_connection = server_state.mysql_pool.acquire().await?;
  require_api_key_user(&http_request, &mut *mysql_connection).await?;
  drop(mysql_connection);

  if path.token.as_str().trim() == "None" {
    // NB: A bunch of Python clients use our API and can fail in this manner.
    return Err(CommonWebError::NotFound);
  }

  let maybe_status = get_inference_job_status(
    &path.token,
    &server_state.mysql_pool,
  ).await;

  let record = match maybe_status {
    Ok(Some(record)) => record,
    Ok(None) => return Err(CommonWebError::NotFound),
    Err(err) => {
      warn!("Job query error for token {}: {:?}", path.token.as_str(), err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  let mut redis = server_state.redis_pool
      .get()
      .map_err(|e| {
        warn!("Redis pool error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  if record.is_keepalive_required {
    // TODO(bt,2023-05-21): Make async.
    let extra_status_key = RedisKeys::generic_inference_extra_status_info(path.token.as_str());
    let _: Option<String> = match redis.set_ex(&extra_status_key, "1", JOB_KEEPALIVE_TTL_SECONDS) {
      Ok(Some(status)) => Some(status),
      Ok(None) => None,
      Err(e) => {
        error!("redis error setting job keepalive: {:?}", e);
        None // Fail open (which in this case is bad! it will kill jobs if cluster has many jobs / is slow!)
      }
    };
  }

  let media_domain = get_media_domain(&http_request);

  let state = record_to_payload(
    record,
    server_state.server_environment,
    media_domain,
  );

  Ok(Json(OmniApiGetJobStatusSuccessResponse {
    success: true,
    state,
  }))
}

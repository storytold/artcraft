use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use log::{error, warn};
use utoipa::ToSchema;

use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::generic_inference::web::get_inference_job_status::get_inference_job_status_from_connection;
use mysql_queries::queries::generic_inference::web::mark_generic_inference_job_cancelled_by_user::mark_generic_inference_job_cancelled_by_user;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct TerminateInferenceJobPathInfo {
  token: InferenceJobToken,
}

#[derive(Serialize, ToSchema)]
pub struct TerminateInferenceJobSuccessResponse {
  pub success: bool,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
/// Terminate a job for the user.
///
/// The user must own the job. This works for logged in users as well as logged out users
/// If the user was logged out, we check the IP address.
#[utoipa::path(
  delete,
  tag = "Jobs",
  path = "/v1/jobs/job/{token}",
  params(
    ("path" = TerminateInferenceJobPathInfo, description = "Path params for Request")
  ),
  responses(
    (status = 200, body = TerminateInferenceJobSuccessResponse),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn terminate_inference_job_handler(
  http_request: HttpRequest,
  path: Path<TerminateInferenceJobPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CommonWebError>
{
  let mut mysql_connection = server_state.mysql_pool.acquire()
      .await
      .map_err(|e| {
        warn!("Could not acquire DB pool: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let maybe_status = get_inference_job_status_from_connection(
    &path.token, &mut mysql_connection).await;

  let job_status = match maybe_status {
    Ok(Some(record)) => record,
    Ok(None) => return Err(CommonWebError::NotFound),
    Err(err) => {
      error!("tts job query error: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  let maybe_user_tokens = maybe_user_session
      .as_ref()
      .and_then(|session| Some(session.user_token.clone()))
      .zip(job_status.user_details.maybe_creator_user_token.clone());

  if let Some((session_user_token, job_user_token)) = maybe_user_tokens {
    if session_user_token != job_user_token {
      return Err(CommonWebError::NotAuthorized);
    }
  } else {
    let ip_address = get_request_ip(&http_request);
    if ip_address != job_status.user_details.creator_ip_address {
      // TODO(bt,2023-10-24): Allow if anonymous visitor token cookie matches
      return Err(CommonWebError::NotAuthorized);
    }
  }

  mark_generic_inference_job_cancelled_by_user(&mut mysql_connection, &path.token)
      .await
      .map_err(|err| {
        error!("tts job query error: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?;

  let response = TerminateInferenceJobSuccessResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| {
        error!("error returning response: {:?}",  e);
        CommonWebError::from_error(e)
      })?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}

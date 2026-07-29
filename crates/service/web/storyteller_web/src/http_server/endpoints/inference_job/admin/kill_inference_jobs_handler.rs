use std::collections::HashSet;
use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::web::Json;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest};
use log::warn;

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::generic_inference::web::kill_generic_inference_jobs;
use mysql_queries::queries::generic_inference::web::kill_generic_inference_jobs::{kill_generic_inference_jobs, KillGenericInferenceJobsArgs};

use crate::state::server_state::ServerState;
use crate::http_server::common_responses::common_web_error::CommonWebError;

/// Only certain job statuses should be modified.
#[derive(Copy, Clone, PartialEq, Eq, Hash, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum KillableStatus {
  Failed,
  Pending,
  Started,
}

/// Target everything, by job category, or by model type.
#[derive(Clone, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum KillableTarget {
  AllJobs,
  Category(InferenceCategory),
  ModelType(InferenceModelType),
}

// NB: ONLY MODERATORS CAN EDIT CATEGORIES.
// These are not sparse updates!
#[derive(Deserialize)]
pub struct KillInferenceJobsRequest {
  pub job_statuses: HashSet<KillableStatus>,
  pub target: KillableTarget,
  pub maybe_priority_or_lower: Option<u8>,
}

#[derive(Serialize)]
pub struct KillInferenceJobsResponse {
  pub success: bool,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
// =============== Handler ===============

pub async fn kill_generic_inference_jobs_handler(
  http_request: HttpRequest,
  request: Json<KillInferenceJobsRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<Json<KillInferenceJobsResponse>, CommonWebError>
{
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

  // TODO: We don't have a permission for this, so use this as a proxy permission
  if !user_session.can_ban_users {
    warn!("no permission to edit categories");
    return Err(CommonWebError::NotAuthorized);
  }

  let job_statuses = request.job_statuses.iter()
      .map(|status| match status {
        KillableStatus::Failed => kill_generic_inference_jobs::KillableStatus::Failed,
        KillableStatus::Pending => kill_generic_inference_jobs::KillableStatus::Pending,
        KillableStatus::Started => kill_generic_inference_jobs::KillableStatus::Started,
      })
      .collect::<HashSet<_>>();

  let target = match request.target {
    KillableTarget::AllJobs => kill_generic_inference_jobs::KillableTarget::AllJobs,
    KillableTarget::Category(category) => kill_generic_inference_jobs::KillableTarget::Category(category),
    KillableTarget::ModelType(model_type) => kill_generic_inference_jobs::KillableTarget::ModelType(model_type),
  };

  kill_generic_inference_jobs(KillGenericInferenceJobsArgs {
    job_statuses,
    target,
    maybe_priority_or_lower: request.maybe_priority_or_lower,
    mysql_pool: &server_state.mysql_pool,
  }).await.map_err(|err| {
    warn!("Query Error: {:?}", err);
    CommonWebError::from_anyhow_error(err)
  })?;

  let response = KillInferenceJobsResponse {
    success: true,
  };

  Ok(Json(response))
}

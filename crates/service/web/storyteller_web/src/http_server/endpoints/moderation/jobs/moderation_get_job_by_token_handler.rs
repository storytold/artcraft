use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use chrono::{DateTime, Utc};
use log::warn;
use serde_derive::Serialize;
use utoipa::ToSchema;

use mysql_queries::queries::generic_inference::moderation::get_job_by_token_for_moderation::{
  get_job_by_token_for_moderation, GetJobByTokenForModerationArgs,
};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{
  require_moderator, UseDatabase,
};
use crate::state::server_state::ServerState;

// ── Path params ──

#[derive(serde_derive::Deserialize, ToSchema)]
pub struct GetJobByTokenPathInfo {
  pub token: InferenceJobToken,
}

// ── Response ──

#[derive(Serialize, ToSchema)]
pub struct GetJobByTokenSuccessResponse {
  pub success: bool,
  pub job: ModerationJobResponse,
}

#[derive(Serialize, ToSchema)]
pub struct ModerationJobResponse {
  pub token: InferenceJobToken,
  pub uuid_idempotency_token: String,
  pub maybe_job_type: Option<String>,
  pub maybe_product_category: Option<String>,
  pub inference_category: String,
  pub maybe_external_third_party: Option<String>,
  pub maybe_external_third_party_id: Option<String>,
  pub maybe_model_type: Option<String>,
  pub maybe_model_token: Option<String>,
  pub maybe_prompt_token: Option<PromptToken>,
  pub maybe_inference_args: Option<String>,
  pub maybe_download_url: Option<String>,
  pub on_success_result_entity_type: Option<String>,
  pub on_success_result_entity_token: Option<String>,
  pub on_success_result_batch_token: Option<String>,
  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_anonymous_visitor_token: Option<String>,
  pub creator_ip_address: String,
  pub creator_set_visibility: String,
  pub maybe_wallet_ledger_entry_token: Option<String>,
  pub maybe_debug_log_event_token: Option<DebugLogEventToken>,
  pub status: String,
  pub attempt_count: u16,
  pub failure_reason: Option<String>,
  pub internal_debugging_failure_reason: Option<String>,
  pub frontend_failure_category: Option<String>,
  pub maybe_routing_tag: Option<String>,
  pub assigned_worker: Option<String>,
  pub assigned_cluster: Option<String>,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

// ── Handler ──

#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/job/{token}",
  params(
    ("token" = String, Path, description = "Inference job token"),
  ),
  responses(
    (status = 200, description = "Success", body = GetJobByTokenSuccessResponse),
    (status = 401, description = "Unauthorized"),
    (status = 404, description = "Not found"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn moderation_get_job_by_token_handler(
  http_request: HttpRequest,
  path: web::Path<GetJobByTokenPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<GetJobByTokenSuccessResponse>, CommonWebError> {
  let _user_session = require_moderator(
    &http_request,
    &server_state,
    UseDatabase::GrabNewConnection,
  ).await.map_err(|err| {
    warn!("Moderator check failed: {:?}", err);
    CommonWebError::NotAuthorized
  })?;

  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

  let job = get_job_by_token_for_moderation(GetJobByTokenForModerationArgs {
    job_token: &path.token,
    mysql_executor: &mut *mysql_connection,
    phantom: Default::default(),
  }).await.map_err(|err| {
    warn!("Error fetching job by token {}: {:?}", path.token, err);
    CommonWebError::from_error(err)
  })?;

  let job = job.ok_or(CommonWebError::NotFound)?;

  Ok(Json(GetJobByTokenSuccessResponse {
    success: true,
    job: ModerationJobResponse {
      token: job.token,
      uuid_idempotency_token: job.uuid_idempotency_token,
      maybe_job_type: job.maybe_job_type,
      maybe_product_category: job.maybe_product_category,
      inference_category: job.inference_category,
      maybe_external_third_party: job.maybe_external_third_party,
      maybe_external_third_party_id: job.maybe_external_third_party_id,
      maybe_model_type: job.maybe_model_type,
      maybe_model_token: job.maybe_model_token,
      maybe_prompt_token: job.maybe_prompt_token,
      maybe_inference_args: job.maybe_inference_args,
      maybe_download_url: job.maybe_download_url,
      on_success_result_entity_type: job.on_success_result_entity_type,
      on_success_result_entity_token: job.on_success_result_entity_token,
      on_success_result_batch_token: job.on_success_result_batch_token,
      maybe_creator_user_token: job.maybe_creator_user_token,
      maybe_creator_anonymous_visitor_token: job.maybe_creator_anonymous_visitor_token,
      creator_ip_address: job.creator_ip_address,
      creator_set_visibility: job.creator_set_visibility,
      maybe_wallet_ledger_entry_token: job.maybe_wallet_ledger_entry_token,
      maybe_debug_log_event_token: job.maybe_debug_log_event_token,
      status: job.status,
      attempt_count: job.attempt_count,
      failure_reason: job.failure_reason,
      internal_debugging_failure_reason: job.internal_debugging_failure_reason,
      frontend_failure_category: job.frontend_failure_category,
      maybe_routing_tag: job.maybe_routing_tag,
      assigned_worker: job.assigned_worker,
      assigned_cluster: job.assigned_cluster,
      created_at: job.created_at,
      updated_at: job.updated_at,
    },
  }))
}

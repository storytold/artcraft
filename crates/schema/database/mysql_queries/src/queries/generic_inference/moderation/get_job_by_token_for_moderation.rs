use std::marker::PhantomData;

use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

pub struct GetJobByTokenForModerationArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub job_token: &'e InferenceJobToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

#[derive(Debug)]
pub struct ModerationJobDetails {
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

#[derive(Debug)]
struct RawRow {
  token: InferenceJobToken,
  uuid_idempotency_token: String,
  maybe_job_type: Option<String>,
  maybe_product_category: Option<String>,
  inference_category: String,
  maybe_external_third_party: Option<String>,
  maybe_external_third_party_id: Option<String>,
  maybe_model_type: Option<String>,
  maybe_model_token: Option<String>,
  maybe_prompt_token: Option<PromptToken>,
  maybe_inference_args: Option<String>,
  maybe_download_url: Option<String>,
  on_success_result_entity_type: Option<String>,
  on_success_result_entity_token: Option<String>,
  on_success_result_batch_token: Option<String>,
  maybe_creator_user_token: Option<UserToken>,
  maybe_creator_anonymous_visitor_token: Option<String>,
  creator_ip_address: String,
  creator_set_visibility: String,
  maybe_wallet_ledger_entry_token: Option<String>,
  maybe_debug_log_event_token: Option<DebugLogEventToken>,
  status: String,
  attempt_count: u16,
  failure_reason: Option<String>,
  internal_debugging_failure_reason: Option<String>,
  frontend_failure_category: Option<String>,
  maybe_routing_tag: Option<String>,
  assigned_worker: Option<String>,
  assigned_cluster: Option<String>,
  created_at: DateTime<Utc>,
  updated_at: DateTime<Utc>,
}

pub async fn get_job_by_token_for_moderation<'e, 'c: 'e, E>(
  args: GetJobByTokenForModerationArgs<'e, 'c, E>,
) -> Result<Option<ModerationJobDetails>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let maybe_row = sqlx::query_as!(
    RawRow,
    r#"
SELECT
  token as `token: tokens::tokens::generic_inference_jobs::InferenceJobToken`,
  uuid_idempotency_token,
  job_type as `maybe_job_type`,
  product_category as `maybe_product_category`,
  inference_category,
  maybe_external_third_party,
  maybe_external_third_party_id,
  maybe_model_type,
  maybe_model_token,
  maybe_prompt_token as `maybe_prompt_token: tokens::tokens::prompts::PromptToken`,
  maybe_inference_args,
  maybe_download_url,
  on_success_result_entity_type,
  on_success_result_entity_token,
  on_success_result_batch_token,
  maybe_creator_user_token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
  maybe_creator_anonymous_visitor_token,
  creator_ip_address,
  creator_set_visibility,
  maybe_wallet_ledger_entry_token,
  maybe_debug_log_event_token as `maybe_debug_log_event_token: tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken`,
  status,
  attempt_count as `attempt_count: u16`,
  failure_reason,
  internal_debugging_failure_reason,
  frontend_failure_category,
  maybe_routing_tag,
  assigned_worker,
  assigned_cluster,
  created_at,
  updated_at
FROM generic_inference_jobs
WHERE token = ?
    "#,
    args.job_token.as_str(),
  )
    .fetch_optional(args.mysql_executor)
    .await?;

  Ok(maybe_row.map(|row| ModerationJobDetails {
    token: row.token,
    uuid_idempotency_token: row.uuid_idempotency_token,
    maybe_job_type: row.maybe_job_type,
    maybe_product_category: row.maybe_product_category,
    inference_category: row.inference_category,
    maybe_external_third_party: row.maybe_external_third_party,
    maybe_external_third_party_id: row.maybe_external_third_party_id,
    maybe_model_type: row.maybe_model_type,
    maybe_model_token: row.maybe_model_token,
    maybe_prompt_token: row.maybe_prompt_token,
    maybe_inference_args: row.maybe_inference_args,
    maybe_download_url: row.maybe_download_url,
    on_success_result_entity_type: row.on_success_result_entity_type,
    on_success_result_entity_token: row.on_success_result_entity_token,
    on_success_result_batch_token: row.on_success_result_batch_token,
    maybe_creator_user_token: row.maybe_creator_user_token,
    maybe_creator_anonymous_visitor_token: row.maybe_creator_anonymous_visitor_token,
    creator_ip_address: row.creator_ip_address,
    creator_set_visibility: row.creator_set_visibility,
    maybe_wallet_ledger_entry_token: row.maybe_wallet_ledger_entry_token,
    maybe_debug_log_event_token: row.maybe_debug_log_event_token,
    status: row.status,
    attempt_count: row.attempt_count,
    failure_reason: row.failure_reason,
    internal_debugging_failure_reason: row.internal_debugging_failure_reason,
    frontend_failure_category: row.frontend_failure_category,
    maybe_routing_tag: row.maybe_routing_tag,
    assigned_worker: row.assigned_worker,
    assigned_cluster: row.assigned_cluster,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

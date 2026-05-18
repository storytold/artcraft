use log::info;
use sqlx::{Executor, MySql};
use std::marker::PhantomData;

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_external_third_party::InferenceJobExternalThirdParty;
use enums::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::common::job_status_plus::JobStatusPlus;
use enums::common::visibility::Visibility;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

use crate::errors::database_query_error::DatabaseQueryError;

pub struct InsertGmiCloudInferenceJobArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub apriori_job_token: &'e InferenceJobToken,
  pub uuid_idempotency_token: &'e str,
  pub external_request_id: &'e str,
  pub maybe_prompt_token: Option<&'e PromptToken>,
  pub maybe_creator_user_token: Option<&'e UserToken>,
  pub maybe_avt_token: Option<&'e AnonymousVisitorTrackingToken>,
  pub creator_ip_address: &'e str,
  pub maybe_debug_log_event_token: Option<&'e DebugLogEventToken>,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

pub async fn insert_generic_inference_job_for_gmicloud<'e, 'c: 'e, E>(
  args: InsertGmiCloudInferenceJobArgs<'e, 'c, E>,
) -> Result<InferenceJobToken, DatabaseQueryError>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let query = sqlx::query!(
    r#"
INSERT INTO generic_inference_jobs
SET
  token = ?,
  uuid_idempotency_token = ?,

  job_type = ?,

  maybe_external_third_party = ?,
  maybe_external_third_party_id = ?,

  product_category = ?,
  inference_category = ?,

  maybe_model_type = NULL,
  maybe_model_token = NULL,

  maybe_input_source_token = NULL,
  maybe_input_source_token_type = NULL,

  maybe_download_url = NULL,
  maybe_cover_image_media_file_token = NULL,

  maybe_prompt_token = ?,

  maybe_raw_inference_text = NULL,

  maybe_inference_args = NULL,

  maybe_creator_user_token = ?,
  maybe_creator_anonymous_visitor_token = ?,
  creator_ip_address = ?,
  creator_set_visibility = ?,

  priority_level = 0,
  is_keepalive_required = FALSE,
  max_duration_seconds = 0,

  is_debug_request = FALSE,
  maybe_routing_tag = NULL,

  maybe_debug_log_event_token = ?,

  frontend_failure_category = NULL,
  failure_reason = NULL,

  status = ?
    "#,
    args.apriori_job_token.as_str(),
    args.uuid_idempotency_token,
    InferenceJobType::GmiCloudQueue.to_str(),
    InferenceJobExternalThirdParty::GmiCloud.to_str(),
    args.external_request_id,
    InferenceJobProductCategory::GmiCloudVideo.to_str(),
    InferenceCategory::VideoGeneration.to_str(),
    args.maybe_prompt_token.map(|t| t.to_string()),
    args.maybe_creator_user_token.map(|t| t.to_string()),
    args.maybe_avt_token.map(|t| t.to_string()),
    args.creator_ip_address,
    Visibility::Public.to_str(),
    args.maybe_debug_log_event_token.map(|t| t.as_str()),
    JobStatusPlus::Pending.to_str(),
  );

  let query_result = query.execute(args.mysql_executor).await;

  let record_id = match query_result {
    Err(err) => return Err(DatabaseQueryError::from(err)),
    Ok(res) => res.last_insert_id(),
  };

  info!(
    "Insert generic inference job for GmiCloud: {} with record ID {}",
    args.apriori_job_token, record_id
  );

  Ok(args.apriori_job_token.clone())
}

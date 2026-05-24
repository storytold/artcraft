use log::info;
use sqlx::{Executor, MySql};
use std::marker::PhantomData;

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_external_third_party::InferenceJobExternalThirdParty;
use enums::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::job_status_plus::JobStatusPlus;
use enums::common::visibility::Visibility;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

use crate::errors::database_query_error::DatabaseQueryError;
use crate::queries::generic_inference::api_providers::common::insert_generic_inference_job_for_provider::{
  insert_generic_inference_job_for_provider,
  InsertGenericInferenceJobForProviderArgs,
};

pub struct InsertGrokApiInferenceJobArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub apriori_job_token: &'e InferenceJobToken,
  pub uuid_idempotency_token: &'e str,
  pub external_request_id: &'e str,
  pub maybe_model_type: Option<CommonModelType>,
  pub maybe_prompt_token: Option<&'e PromptToken>,
  pub maybe_creator_user_token: Option<&'e UserToken>,
  pub maybe_avt_token: Option<&'e AnonymousVisitorTrackingToken>,
  pub creator_ip_address: &'e str,
  pub maybe_debug_log_event_token: Option<&'e DebugLogEventToken>,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

pub async fn insert_generic_inference_job_for_grok_api<'e, 'c: 'e, E>(
  args: InsertGrokApiInferenceJobArgs<'e, 'c, E>,
) -> Result<InferenceJobToken, DatabaseQueryError>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let record_id = insert_generic_inference_job_for_provider(InsertGenericInferenceJobForProviderArgs {
    apriori_job_token: args.apriori_job_token,
    uuid_idempotency_token: args.uuid_idempotency_token,
    job_type: InferenceJobType::GrokApiQueue,
    external_third_party: InferenceJobExternalThirdParty::GrokApi,
    external_third_party_id: args.external_request_id,
    product_category: InferenceJobProductCategory::GrokApiVideo,
    inference_category: InferenceCategory::VideoGeneration,
    maybe_model_type: args.maybe_model_type,
    maybe_prompt_token: args.maybe_prompt_token,
    maybe_wallet_ledger_entry_token: None,
    maybe_inference_args: None,
    maybe_creator_user_token: args.maybe_creator_user_token,
    maybe_avt_token: args.maybe_avt_token,
    creator_ip_address: args.creator_ip_address,
    creator_set_visibility: Visibility::Public,
    maybe_debug_log_event_token: args.maybe_debug_log_event_token,
    maybe_frontend_failure_category: None,
    maybe_failure_reason: None,
    status: JobStatusPlus::Pending,
    mysql_executor: args.mysql_executor,
    phantom: args.phantom,
  }).await?;

  info!(
    "Insert generic inference job for Grok (xAI) API: {} with record ID {}",
    args.apriori_job_token, record_id
  );

  Ok(args.apriori_job_token.clone())
}

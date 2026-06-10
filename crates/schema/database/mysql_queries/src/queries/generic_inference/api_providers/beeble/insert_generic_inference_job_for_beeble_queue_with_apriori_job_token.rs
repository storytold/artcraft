use log::info;
use sqlx::{Executor, MySql};
use std::marker::PhantomData;

use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_external_third_party::InferenceJobExternalThirdParty;
use enums::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::job_status_plus::JobStatusPlus;
use enums::common::platform_type::PlatformType;
use enums::common::visibility::Visibility;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

use crate::errors::database_query_error::DatabaseQueryError;
use crate::payloads::generic_inference_args::generic_inference_args::GenericInferenceArgs;
use crate::queries::generic_inference::api_providers::common::insert_generic_inference_job_for_provider::{
  insert_generic_inference_job_for_provider,
  InsertGenericInferenceJobForProviderArgs,
};


pub struct InsertGenericInferenceForBeebleWithAprioriJobTokenArgs<'e, 'c, E>
  where E: 'e + Executor<'c, Database = MySql>
{
  pub uuid_idempotency_token: &'e str,

  // NOTE: We'll generate this ahead of time so we can save it with billing info!
  pub apriori_job_token: &'e InferenceJobToken,

  /// The external primary key identifier for the job.
  pub maybe_external_third_party_id: &'e str,

  pub maybe_model_type: Option<CommonModelType>,

  pub maybe_inference_args: Option<GenericInferenceArgs>,

  pub maybe_prompt_token: Option<&'e PromptToken>,

  pub maybe_creator_user_token: Option<&'e UserToken>,
  pub maybe_avt_token: Option<&'e AnonymousVisitorTrackingToken>,
  pub creator_ip_address: &'e str,
  pub creator_set_visibility: Visibility,

  /// The platform the enqueuing request came from, inferred from its User-Agent.
  pub maybe_platform_type: Option<PlatformType>,

  pub maybe_debug_log_event_token: Option<&'e DebugLogEventToken>,

  /// Override the initial job status. Defaults to `Pending` when `None`.
  /// Set to `Some(JobStatusPlus::CompleteFailure)` for mock/test failure jobs.
  pub starting_job_status_override: Option<JobStatusPlus>,

  pub maybe_frontend_failure_category: Option<FrontendFailureCategory>,
  pub maybe_failure_reason: Option<&'e str>,

  pub mysql_executor: E,

  // TODO: Not sure if this works to tell the compiler we need the lifetime annotation.
  //  See: https://doc.rust-lang.org/std/marker/struct.PhantomData.html#unused-lifetime-parameters
  pub phantom: PhantomData<&'c E>,
}

pub async fn insert_generic_inference_job_for_beeble_queue_with_apriori_job_token<'e, 'c : 'e, E>(
  args: InsertGenericInferenceForBeebleWithAprioriJobTokenArgs<'e, 'c, E>
) -> Result<InferenceJobToken, DatabaseQueryError>
  where E: 'e + Executor<'c, Database = MySql>
{
  let record_id = insert_generic_inference_job_for_provider(InsertGenericInferenceJobForProviderArgs {
    apriori_job_token: args.apriori_job_token,
    uuid_idempotency_token: args.uuid_idempotency_token,
    job_type: InferenceJobType::BeebleQueue,
    external_third_party: InferenceJobExternalThirdParty::Beeble,
    external_third_party_id: args.maybe_external_third_party_id,
    product_category: InferenceJobProductCategory::BeebleVideo,
    inference_category: InferenceCategory::VideoGeneration,
    maybe_model_type: args.maybe_model_type,
    maybe_prompt_token: args.maybe_prompt_token,
    maybe_wallet_ledger_entry_token: None,
    maybe_inference_args: args.maybe_inference_args,
    maybe_creator_user_token: args.maybe_creator_user_token,
    maybe_avt_token: args.maybe_avt_token,
    creator_ip_address: args.creator_ip_address,
    creator_set_visibility: args.creator_set_visibility,
    maybe_platform_type: args.maybe_platform_type,
    maybe_debug_log_event_token: args.maybe_debug_log_event_token,
    maybe_frontend_failure_category: args.maybe_frontend_failure_category,
    maybe_failure_reason: args.maybe_failure_reason,
    status: args.starting_job_status_override.unwrap_or(JobStatusPlus::Pending),
    mysql_executor: args.mysql_executor,
    phantom: args.phantom,
  }).await?;

  info!("Insert generic inference job for Beeble queue: {} with record ID {}", args.apriori_job_token, record_id);

  Ok(args.apriori_job_token.clone())
}

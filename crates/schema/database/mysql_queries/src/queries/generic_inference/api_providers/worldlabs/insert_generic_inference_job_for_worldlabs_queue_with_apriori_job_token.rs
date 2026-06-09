use log::info;
use sqlx::{Executor, MySql};
use std::marker::PhantomData;

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
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;

use crate::errors::database_query_error::DatabaseQueryError;
use crate::payloads::generic_inference_args::generic_inference_args::GenericInferenceArgs;
use crate::queries::generic_inference::api_providers::common::insert_generic_inference_job_for_provider::{
  insert_generic_inference_job_for_provider,
  InsertGenericInferenceJobForProviderArgs,
};

pub struct InsertGenericInferenceForWorldlabsWithAprioriJobTokenArgs<'e, 'c, E>
  where E: 'e + Executor<'c, Database = MySql>
{
  pub uuid_idempotency_token: &'e str,

  pub apriori_job_token: &'e InferenceJobToken,

  /// The external operation_id returned by World Labs generate_world call.
  pub maybe_external_third_party_id: &'e str,

  pub maybe_model_type: Option<CommonModelType>,

  pub maybe_inference_args: Option<GenericInferenceArgs>,

  pub maybe_prompt_token: Option<&'e PromptToken>,

  pub maybe_wallet_ledger_entry_token: Option<&'e WalletLedgerEntryToken>,

  pub maybe_creator_user_token: Option<&'e UserToken>,
  pub maybe_avt_token: Option<&'e AnonymousVisitorTrackingToken>,
  pub creator_ip_address: &'e str,
  pub creator_set_visibility: Visibility,

  /// The platform the enqueuing request came from, inferred from its User-Agent.
  pub maybe_platform_type: Option<PlatformType>,

  pub mysql_executor: E,

  pub phantom: PhantomData<&'c E>,
}

pub async fn insert_generic_inference_job_for_worldlabs_queue_with_apriori_job_token<'e, 'c : 'e, E>(
  args: InsertGenericInferenceForWorldlabsWithAprioriJobTokenArgs<'e, 'c, E>
) -> Result<InferenceJobToken, DatabaseQueryError>
  where E: 'e + Executor<'c, Database = MySql>
{
  let record_id = insert_generic_inference_job_for_provider(InsertGenericInferenceJobForProviderArgs {
    apriori_job_token: args.apriori_job_token,
    uuid_idempotency_token: args.uuid_idempotency_token,
    job_type: InferenceJobType::WorldlabsQueue,
    external_third_party: InferenceJobExternalThirdParty::Worldlabs,
    external_third_party_id: args.maybe_external_third_party_id,
    product_category: InferenceJobProductCategory::WorldlabsSplat,
    inference_category: InferenceCategory::SplatGeneration,
    maybe_model_type: args.maybe_model_type,
    maybe_prompt_token: args.maybe_prompt_token,
    maybe_wallet_ledger_entry_token: args.maybe_wallet_ledger_entry_token,
    maybe_inference_args: args.maybe_inference_args,
    maybe_creator_user_token: args.maybe_creator_user_token,
    maybe_avt_token: args.maybe_avt_token,
    creator_ip_address: args.creator_ip_address,
    creator_set_visibility: args.creator_set_visibility,
    maybe_platform_type: args.maybe_platform_type,
    maybe_debug_log_event_token: None,
    maybe_frontend_failure_category: None,
    maybe_failure_reason: None,
    status: JobStatusPlus::Pending,
    mysql_executor: args.mysql_executor,
    phantom: args.phantom,
  }).await?;

  info!("Insert generic inference job for World Labs queue: {} with record ID {}", args.apriori_job_token, record_id);

  Ok(args.apriori_job_token.clone())
}

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
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;

use crate::errors::database_query_error::DatabaseQueryError;
use crate::payloads::generic_inference_args::generic_inference_args::GenericInferenceArgs;
use crate::queries::generic_inference::api_providers::common::insert_generic_inference_job_for_provider::{
  insert_generic_inference_job_for_provider,
  InsertGenericInferenceJobForProviderArgs,
};

pub struct InsertGenericInferenceForSeedance2ProWithAprioriJobTokenArgs<'e, 'c, E>
  where E: 'e + Executor<'c, Database = MySql>
{
  /// Which kinovi queue to use
  pub kinovi_version: KinoviVersion,

  pub uuid_idempotency_token: &'e str,

  // NOTE: We'll generate this ahead of time so we can save it with billing info!
  pub apriori_job_token: &'e InferenceJobToken,

  /// The external order_id returned by the seedance2pro generate_video call.
  pub maybe_external_third_party_id: &'e str,

  pub maybe_model_type: Option<CommonModelType>,

  pub maybe_inference_args: Option<GenericInferenceArgs>,

  pub maybe_prompt_token: Option<&'e PromptToken>,

  pub maybe_wallet_ledger_entry_token: Option<&'e WalletLedgerEntryToken>,

  pub maybe_creator_user_token: Option<&'e UserToken>,
  pub maybe_avt_token: Option<&'e AnonymousVisitorTrackingToken>,
  pub creator_ip_address: &'e str,
  pub creator_set_visibility: Visibility,

  pub maybe_debug_log_event_token: Option<&'e DebugLogEventToken>,

  pub mysql_executor: E,

  pub phantom: PhantomData<&'c E>,
}

#[derive(Debug, Clone, Copy)]
pub enum KinoviVersion {
  Volcengine,
  BytePlus,
  BytePlusUltra,
}


pub async fn insert_generic_inference_job_for_seedance2pro_queue_with_apriori_job_token<'e, 'c : 'e, E>(
  args: InsertGenericInferenceForSeedance2ProWithAprioriJobTokenArgs<'e, 'c, E>
) -> Result<InferenceJobToken, DatabaseQueryError>
  where E: 'e + Executor<'c, Database = MySql>
{
  let (
    job_type,
    external_third_party,
    product_category
  ) = match args.kinovi_version {
    KinoviVersion::Volcengine => (
      InferenceJobType::Seedance2ProQueue,
      InferenceJobExternalThirdParty::Seedance2Pro,
      InferenceJobProductCategory::Seedance2ProVideo,
    ),
    KinoviVersion::BytePlus => (
      InferenceJobType::Seedance2ProAltQueue,
      InferenceJobExternalThirdParty::Seedance2ProAlt,
      InferenceJobProductCategory::Seedance2ProVideoAlt,
    ),
    KinoviVersion::BytePlusUltra => (
      InferenceJobType::Seedance2ProBytePlusUltraQueue,
      InferenceJobExternalThirdParty::Seedance2ProBytePlusUltra,
      InferenceJobProductCategory::Seedance2ProVideoBytePlusUltra,
    ),
  };

  let record_id = insert_generic_inference_job_for_provider(InsertGenericInferenceJobForProviderArgs {
    apriori_job_token: args.apriori_job_token,
    uuid_idempotency_token: args.uuid_idempotency_token,
    job_type,
    external_third_party,
    external_third_party_id: args.maybe_external_third_party_id,
    product_category,
    inference_category: InferenceCategory::VideoGeneration,
    maybe_model_type: args.maybe_model_type,
    maybe_prompt_token: args.maybe_prompt_token,
    maybe_wallet_ledger_entry_token: args.maybe_wallet_ledger_entry_token,
    maybe_inference_args: args.maybe_inference_args,
    maybe_creator_user_token: args.maybe_creator_user_token,
    maybe_avt_token: args.maybe_avt_token,
    creator_ip_address: args.creator_ip_address,
    creator_set_visibility: args.creator_set_visibility,
    maybe_debug_log_event_token: args.maybe_debug_log_event_token,
    maybe_frontend_failure_category: None,
    maybe_failure_reason: None,
    status: JobStatusPlus::Pending,
    mysql_executor: args.mysql_executor,
    phantom: args.phantom,
  }).await?;

  info!("Insert generic inference job for Seedance 2 Pro queue: {} with record ID {}", args.apriori_job_token, record_id);

  Ok(args.apriori_job_token.clone())
}

//! Insert a first-party Minimax H3 (Turbo or Ultra) inference job.
//!
//! Unlike the provider-flavored inserts (Fal, KinoviWeb, …), these jobs run
//! on our own GPU inference, so there is no external third party and no
//! external third party id — those columns are left NULL. A scheduler picks
//! the pending rows up later.

use log::info;
use sqlx::{Executor, MySql};
use std::marker::PhantomData;

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory;
use enums::common::job_status_plus::JobStatusPlus;
use enums::common::platform_type::PlatformType;
use enums::common::visibility::Visibility;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;

use crate::errors::database_query_error::DatabaseQueryError;
use crate::payloads::generic_inference_args::generic_inference_args::GenericInferenceArgs;
use crate::queries::generic_inference::common::job_cost_estimates::JobCostEstimates;
use crate::queries::generic_inference::first_party::minimax_h3::first_party_minimax_h3_model::FirstPartyMinimaxH3Model;
use crate::queries::generic_inference::common::insert_full_generic_inference_job_record::{
  insert_full_generic_inference_job_record,
  InsertFullGenericInferenceJobRecordArgs,
};

pub struct InsertGenericInferenceForFirstPartyMinimaxH3WithAprioriJobTokenArgs<'e, 'c, E>
  where E: 'e + Executor<'c, Database = MySql>
{
  /// Which first-party Minimax H3 model to enqueue.
  pub minimax_model: FirstPartyMinimaxH3Model,

  pub uuid_idempotency_token: &'e str,

  // NOTE: We'll generate this ahead of time so we can save it with billing info!
  pub apriori_job_token: &'e InferenceJobToken,

  pub maybe_inference_args: Option<GenericInferenceArgs>,

  pub maybe_prompt_token: Option<&'e PromptToken>,

  pub maybe_wallet_ledger_entry_token: Option<&'e WalletLedgerEntryToken>,

  /// User-facing cost in our own credits. None for the free Turbo tier.
  pub maybe_system_cost_credits: Option<u32>,

  /// User-facing cost in USD cents. None for the free Turbo tier.
  pub maybe_system_cost_usd_cents: Option<u32>,

  pub maybe_creator_user_token: Option<&'e UserToken>,
  pub maybe_avt_token: Option<&'e AnonymousVisitorTrackingToken>,
  pub creator_ip_address: &'e str,
  pub creator_set_visibility: Visibility,

  /// The platform the enqueuing request came from, inferred from its User-Agent.
  pub maybe_platform_type: Option<PlatformType>,

  pub maybe_debug_log_event_token: Option<&'e DebugLogEventToken>,

  pub mysql_executor: E,

  pub phantom: PhantomData<&'c E>,
}

pub async fn insert_generic_inference_job_for_first_party_minimax_h3_with_apriori_job_token<'e, 'c : 'e, E>(
  args: InsertGenericInferenceForFirstPartyMinimaxH3WithAprioriJobTokenArgs<'e, 'c, E>
) -> Result<InferenceJobToken, DatabaseQueryError>
  where E: 'e + Executor<'c, Database = MySql>
{
  let job_type = args.minimax_model.inference_job_type();
  let model_type = args.minimax_model.inference_model_type();

  let cost_estimates = JobCostEstimates {
    // First-party jobs have no external provider, so no provider-side costs.
    maybe_external_third_party_cost_credits: None,
    maybe_external_third_party_cost_usd_cents: None,
    maybe_system_cost_credits: args.maybe_system_cost_credits,
    maybe_system_cost_usd_cents: args.maybe_system_cost_usd_cents,
  };

  let record_id = insert_full_generic_inference_job_record(InsertFullGenericInferenceJobRecordArgs {
    token: args.apriori_job_token,
    uuid_idempotency_token: args.uuid_idempotency_token,

    job_type,

    // No external provider: a scheduler will run these on our own GPUs.
    maybe_external_third_party: None,
    maybe_external_third_party_id: None,

    maybe_product_category: Some(InferenceJobProductCategory::ArtcraftMinimaxH3),
    inference_category: InferenceCategory::VideoGeneration,

    maybe_model_type: Some(model_type),

    maybe_prompt_token: args.maybe_prompt_token,
    maybe_wallet_ledger_entry_token: args.maybe_wallet_ledger_entry_token,

    maybe_inference_args: args.maybe_inference_args,

    maybe_creator_user_token: args.maybe_creator_user_token,
    maybe_avt_token: args.maybe_avt_token,
    creator_ip_address: args.creator_ip_address,
    creator_set_visibility: args.creator_set_visibility,

    maybe_platform_type: args.maybe_platform_type,

    maybe_cost_estimates: Some(cost_estimates),

    maybe_debug_log_event_token: args.maybe_debug_log_event_token,

    maybe_frontend_failure_category: None,
    maybe_failure_reason: None,

    status: JobStatusPlus::Pending,

    mysql_executor: args.mysql_executor,
    phantom: args.phantom,

    // Web-only fields — first-party enqueues never set these.
    maybe_model_token: None,
    maybe_input_source_token: None,
    maybe_input_source_token_type: None,
    maybe_download_url: None,
    maybe_cover_image_media_file_token: None,
    maybe_raw_inference_text: None,
    maybe_routing_tag: None,
    priority_level: 0,
    requires_keepalive: false,
    max_duration_seconds: 0,
    is_debug_request: false,

  }).await?;

  info!("Insert generic inference job for first-party Minimax H3 ({:?}): {} with record ID {}",
    args.minimax_model, args.apriori_job_token, record_id);

  Ok(args.apriori_job_token.clone())
}

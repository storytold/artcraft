//! Provider-flavored wrapper around the inner-most record insert.
//!
//! All provider-side inserts (Fal, Beeble, GmiCloud, Seedance2Pro,
//! Worldlabs, …) share the same shape:
//!
//! - `maybe_external_third_party*` is always present (the external API was
//!   called and gave us back an id).
//! - Web-only fields (`maybe_model_type`, `maybe_input_source_token`,
//!   `maybe_download_url`, `maybe_cover_image_media_file_token`,
//!   `maybe_raw_inference_text`, `maybe_routing_tag`, `priority_level`,
//!   `requires_keepalive`, `max_duration_seconds`, `is_debug_request`) are
//!   hard-coded to None / 0 / false here.
//! - `maybe_inference_args` is passed as-is and serialized in the root.
//!   `None` writes DB `NULL`.
//!
//! Visibility is `pub(crate)`: external callers must use a leaf function.

use sqlx::{Executor, MySql};
use std::marker::PhantomData;

use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_external_third_party::InferenceJobExternalThirdParty;
use enums::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use enums::common::generation::common_model_type::CommonModelType;
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
use crate::queries::generic_inference::common::insert_full_generic_inference_job_record::{
  insert_full_generic_inference_job_record,
  InsertFullGenericInferenceJobRecordArgs,
};

pub(crate) struct InsertGenericInferenceJobForProviderArgs<'e, 'c, E>
  where E: 'e + Executor<'c, Database = MySql>
{
  pub apriori_job_token: &'e InferenceJobToken,
  pub uuid_idempotency_token: &'e str,

  pub job_type: InferenceJobType,

  pub external_third_party: InferenceJobExternalThirdParty,
  pub external_third_party_id: &'e str,

  pub product_category: InferenceJobProductCategory,
  pub inference_category: InferenceCategory,

  /// Optional model identifier. Converted to the legacy
  /// [`InferenceModelType`] (which is a superset of `CommonModelType`) at
  /// the call site of the root insert.
  pub maybe_model_type: Option<CommonModelType>,

  pub maybe_prompt_token: Option<&'e PromptToken>,
  pub maybe_wallet_ledger_entry_token: Option<&'e WalletLedgerEntryToken>,

  /// Forwarded to the root, which serializes to JSON. `None` writes DB NULL.
  pub maybe_inference_args: Option<GenericInferenceArgs>,

  pub maybe_creator_user_token: Option<&'e UserToken>,
  pub maybe_avt_token: Option<&'e AnonymousVisitorTrackingToken>,
  pub creator_ip_address: &'e str,
  pub creator_set_visibility: Visibility,

  /// The platform the enqueuing request came from, inferred from its User-Agent.
  pub maybe_platform_type: Option<PlatformType>,

  pub maybe_debug_log_event_token: Option<&'e DebugLogEventToken>,

  pub maybe_frontend_failure_category: Option<FrontendFailureCategory>,
  pub maybe_failure_reason: Option<&'e str>,

  pub status: JobStatusPlus,

  pub mysql_executor: E,

  pub phantom: PhantomData<&'c E>,
}

pub(crate) async fn insert_generic_inference_job_for_provider<'e, 'c: 'e, E>(
  args: InsertGenericInferenceJobForProviderArgs<'e, 'c, E>,
) -> Result<u64, DatabaseQueryError>
  where E: 'e + Executor<'c, Database = MySql>
{
  insert_full_generic_inference_job_record(InsertFullGenericInferenceJobRecordArgs {
    token: args.apriori_job_token,
    uuid_idempotency_token: args.uuid_idempotency_token,

    job_type: args.job_type,

    maybe_external_third_party: Some(args.external_third_party),
    maybe_external_third_party_id: Some(args.external_third_party_id),

    maybe_product_category: Some(args.product_category),
    inference_category: args.inference_category,

    // Convert from the canonical CommonModelType to the table-scoped
    // InferenceModelType so the database column gets the right value.
    maybe_model_type: args.maybe_model_type.map(InferenceModelType::from_common_model_type),

    maybe_prompt_token: args.maybe_prompt_token,
    maybe_wallet_ledger_entry_token: args.maybe_wallet_ledger_entry_token,

    maybe_inference_args: args.maybe_inference_args,

    maybe_creator_user_token: args.maybe_creator_user_token,
    maybe_avt_token: args.maybe_avt_token,
    creator_ip_address: args.creator_ip_address,
    creator_set_visibility: args.creator_set_visibility,

    maybe_platform_type: args.maybe_platform_type,

    maybe_debug_log_event_token: args.maybe_debug_log_event_token,

    maybe_frontend_failure_category: args.maybe_frontend_failure_category,
    maybe_failure_reason: args.maybe_failure_reason,

    status: args.status,

    mysql_executor: args.mysql_executor,
    phantom: args.phantom,

    // Web-only fields — providers never set these.
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

  }).await
}

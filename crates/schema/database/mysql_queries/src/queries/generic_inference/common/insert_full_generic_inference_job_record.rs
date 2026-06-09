//! Inner-most insert for the `generic_inference_jobs` table.
//!
//! This is the *only* place in the crate that owns the raw `INSERT` query.
//! Every other "insert" function — provider-specific leaves and the
//! web-flavored convenience function — must funnel through here so that
//! the column list and all the marshaling logic (inference_args JSON,
//! routing_tag trim/truncate, failure_reason 255-char clamp) lives in
//! exactly one place.
//!
//! The args struct is a superset: web fields (model/input/download/etc.) and
//! provider fields (external_third_party, wallet_ledger_entry, debug log
//! event, failure category/reason) are all here as `Option`. Leaves pass
//! `None` for fields that don't apply, and `None` writes DB `NULL`.
//!
//! Visibility is `pub(crate)`: external callers must use a leaf function,
//! never this directly.

use anyhow::anyhow;
use sqlx::{Executor, MySql};
use std::marker::PhantomData;

use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_input_source_token_type::InferenceInputSourceTokenType;
use enums::by_table::generic_inference_jobs::inference_job_external_third_party::InferenceJobExternalThirdParty;
use enums::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use enums::common::job_status_plus::JobStatusPlus;
use enums::common::platform_type::PlatformType;
use enums::common::visibility::Visibility;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;

use crate::errors::database_query_error::DatabaseQueryError;
use crate::payloads::generic_inference_args::generic_inference_args::GenericInferenceArgs;

pub(crate) struct InsertFullGenericInferenceJobRecordArgs<'e, 'c, E>
  where E: 'e + Executor<'c, Database = MySql>
{
  pub token: &'e InferenceJobToken,
  pub uuid_idempotency_token: &'e str,

  pub job_type: InferenceJobType,

  pub maybe_external_third_party: Option<InferenceJobExternalThirdParty>,
  pub maybe_external_third_party_id: Option<&'e str>,

  pub maybe_product_category: Option<InferenceJobProductCategory>,
  pub inference_category: InferenceCategory,

  pub maybe_model_type: Option<InferenceModelType>,
  pub maybe_model_token: Option<&'e str>,

  pub maybe_input_source_token: Option<&'e str>,
  pub maybe_input_source_token_type: Option<InferenceInputSourceTokenType>,

  pub maybe_download_url: Option<&'e str>,
  pub maybe_cover_image_media_file_token: Option<&'e MediaFileToken>,

  pub maybe_prompt_token: Option<&'e PromptToken>,
  pub maybe_wallet_ledger_entry_token: Option<&'e WalletLedgerEntryToken>,

  pub maybe_raw_inference_text: Option<&'e str>,

  /// Serialized to JSON here and written to `maybe_inference_args`. `None`
  /// writes DB `NULL` (never the four-character `"null"` literal).
  pub maybe_inference_args: Option<GenericInferenceArgs>,

  pub maybe_creator_user_token: Option<&'e UserToken>,
  pub maybe_avt_token: Option<&'e AnonymousVisitorTrackingToken>,
  pub creator_ip_address: &'e str,
  pub creator_set_visibility: Visibility,

  /// The platform the enqueuing request came from, inferred from its User-Agent.
  pub maybe_platform_type: Option<PlatformType>,

  pub priority_level: u8,
  pub requires_keepalive: bool,
  pub max_duration_seconds: i32,
  pub is_debug_request: bool,

  pub maybe_routing_tag: Option<&'e str>,

  pub maybe_debug_log_event_token: Option<&'e DebugLogEventToken>,

  pub maybe_frontend_failure_category: Option<FrontendFailureCategory>,
  pub maybe_failure_reason: Option<&'e str>,

  pub status: JobStatusPlus,

  pub mysql_executor: E,

  pub phantom: PhantomData<&'c E>,
}

pub(crate) async fn insert_full_generic_inference_job_record<'e, 'c: 'e, E>(
  args: InsertFullGenericInferenceJobRecordArgs<'e, 'c, E>,
) -> Result<u64, DatabaseQueryError>
  where E: 'e + Executor<'c, Database = MySql>
{
  // VARCHAR(32) historically, but the web insert was truncating to 64 and
  // trimming — preserve exactly so the refactor is behavior-neutral.
  let maybe_routing_tag = args.maybe_routing_tag
      .map(|tag| {
        let mut tag = tag.trim().to_string();
        tag.truncate(64);
        tag
      });

  let maybe_truncated_failure_reason = args.maybe_failure_reason
      .map(|s| if s.len() > 255 { &s[..255] } else { s });

  // Serialize Some(args) → JSON string; None → DB NULL.
  let maybe_inference_args_json = match args.maybe_inference_args.as_ref() {
    Some(payload) => Some(
      serde_json::ser::to_string(payload)
          .map_err(|_e| anyhow!("could not encode inference args"))?
    ),
    None => None,
  };

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

  maybe_model_type = ?,
  maybe_model_token = ?,

  maybe_input_source_token = ?,
  maybe_input_source_token_type = ?,

  maybe_download_url = ?,
  maybe_cover_image_media_file_token = ?,

  maybe_prompt_token = ?,
  maybe_wallet_ledger_entry_token = ?,

  maybe_raw_inference_text = ?,

  maybe_inference_args = ?,

  maybe_creator_user_token = ?,
  maybe_creator_anonymous_visitor_token = ?,
  creator_ip_address = ?,
  creator_set_visibility = ?,

  platform_type = ?,

  priority_level = ?,
  is_keepalive_required = ?,
  max_duration_seconds = ?,
  is_debug_request = ?,

  maybe_routing_tag = ?,

  maybe_debug_log_event_token = ?,

  frontend_failure_category = ?,
  failure_reason = ?,

  status = ?
        "#,
        args.token.as_str(),
        args.uuid_idempotency_token,

        args.job_type.to_str(),

        args.maybe_external_third_party.map(|e| e.to_str()),
        args.maybe_external_third_party_id,

        args.maybe_product_category.map(|c| c.to_str()),
        args.inference_category.to_str(),

        args.maybe_model_type.map(|t| t.to_str()),
        args.maybe_model_token,

        args.maybe_input_source_token,
        args.maybe_input_source_token_type.map(|t| t.to_str()),

        args.maybe_download_url,
        args.maybe_cover_image_media_file_token.map(|t| t.as_str()),

        args.maybe_prompt_token.map(|t| t.to_string()),
        args.maybe_wallet_ledger_entry_token.map(|t| t.to_string()),

        args.maybe_raw_inference_text,

        maybe_inference_args_json,

        args.maybe_creator_user_token.map(|t| t.to_string()),
        args.maybe_avt_token.map(|t| t.to_string()),
        args.creator_ip_address,
        args.creator_set_visibility.to_str(),

        args.maybe_platform_type.map(|p| p.to_str()),

        args.priority_level,
        args.requires_keepalive,
        args.max_duration_seconds,
        args.is_debug_request,

        maybe_routing_tag,

        args.maybe_debug_log_event_token.map(|t| t.as_str()),

        args.maybe_frontend_failure_category.map(|c| c.to_str()),
        maybe_truncated_failure_reason,

        args.status.to_str(),
    );

  let record_id = query.execute(args.mysql_executor)
      .await?
      .last_insert_id();

  Ok(record_id)
}

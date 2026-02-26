use anyhow::anyhow;
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
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;

use crate::errors::database_query_error::DatabaseQueryError;
use crate::payloads::generic_inference_args::generic_inference_args::GenericInferenceArgs;

pub struct InsertGenericInferenceForSeedance2ProWithAprioriJobTokenArgs<'e, 'c, E>
  where E: 'e + Executor<'c, Database = MySql>
{
  pub uuid_idempotency_token: &'e str,

  // NOTE: We'll generate this ahead of time so we can save it with billing info!
  pub apriori_job_token: &'e InferenceJobToken,

  /// The external order_id returned by the seedance2pro generate_video call.
  pub maybe_external_third_party_id: &'e str,

  pub maybe_inference_args: Option<GenericInferenceArgs>,

  pub maybe_prompt_token: Option<&'e PromptToken>,

  pub maybe_wallet_ledger_entry_token: Option<&'e WalletLedgerEntryToken>,

  pub maybe_creator_user_token: Option<&'e UserToken>,
  pub maybe_avt_token: Option<&'e AnonymousVisitorTrackingToken>,
  pub creator_ip_address: &'e str,
  pub creator_set_visibility: Visibility,

  pub mysql_executor: E,

  pub phantom: PhantomData<&'c E>,
}

pub async fn insert_generic_inference_job_for_seedance2pro_queue_with_apriori_job_token<'e, 'c : 'e, E>(
  args: InsertGenericInferenceForSeedance2ProWithAprioriJobTokenArgs<'e, 'c, E>
) -> Result<InferenceJobToken, DatabaseQueryError>
  where E: 'e + Executor<'c, Database = MySql>
{
  let serialized_args_payload = serde_json::ser::to_string(&args.maybe_inference_args)
      .map_err(|_e| anyhow!("could not encode inference args"))?;

  const JOB_TYPE: InferenceJobType = InferenceJobType::Seedance2ProQueue;
  const INFERENCE_CATEGORY: InferenceCategory = InferenceCategory::VideoGeneration;
  const PRODUCT_CATEGORY: InferenceJobProductCategory = InferenceJobProductCategory::Seedance2ProVideo;
  const EXTERNAL_THIRD_PARTY: InferenceJobExternalThirdParty = InferenceJobExternalThirdParty::Seedance2Pro;
  const STATUS: JobStatusPlus = JobStatusPlus::Pending;

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

  maybe_wallet_ledger_entry_token = ?,

  maybe_raw_inference_text = NULL,

  maybe_inference_args = ?,

  maybe_creator_user_token = ?,
  maybe_creator_anonymous_visitor_token = ?,
  creator_ip_address = ?,
  creator_set_visibility = ?,

  priority_level = 0,
  is_keepalive_required = FALSE,
  max_duration_seconds = 0,

  is_debug_request = FALSE,
  maybe_routing_tag = NULL,

  status = ?
        "#,
        args.apriori_job_token.as_str(),
        args.uuid_idempotency_token,

        JOB_TYPE.to_str(),

        EXTERNAL_THIRD_PARTY.to_str(),
        args.maybe_external_third_party_id,

        PRODUCT_CATEGORY.to_str(),
        INFERENCE_CATEGORY.to_str(),

        args.maybe_prompt_token.map(|t| t.to_string()),

        args.maybe_wallet_ledger_entry_token.map(|t| t.to_string()),

        serialized_args_payload,

        args.maybe_creator_user_token.map(|t| t.to_string()),
        args.maybe_avt_token.map(|t| t.to_string()),
        args.creator_ip_address,
        args.creator_set_visibility.to_str(),

        STATUS.to_str(),
    );

  let query_result = query.execute(args.mysql_executor)
      .await;

  let record_id = match query_result {
    Err(err) => return Err(DatabaseQueryError::from(err)),
    Ok(res) => res.last_insert_id(),
  };

  info!("Insert generic inference job for Seedance 2 Pro queue: {} with record ID {}", args.apriori_job_token, record_id);

  Ok(args.apriori_job_token.clone())
}

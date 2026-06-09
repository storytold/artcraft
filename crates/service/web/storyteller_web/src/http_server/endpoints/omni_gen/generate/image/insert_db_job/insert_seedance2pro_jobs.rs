use log::{error, warn};

use enums::common::visibility::Visibility;
use mysql_queries::queries::generic_inference::api_providers::seedance2pro::insert_generic_inference_job_for_seedance2pro_queue_with_apriori_job_token::{
  insert_generic_inference_job_for_seedance2pro_queue_with_apriori_job_token,
  InsertGenericInferenceForSeedance2ProWithAprioriJobTokenArgs, KinoviVersion,
};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;
use uuid_utils::uuid::generate_random_uuid;

use crate::http_server::common_responses::common_web_error::CommonWebError;

use super::shared_job_args::SharedJobArgs;

pub struct InsertSeedance2proJobsArgs<'a, 'tx> {
  /// The order_id for the primary job (always inserted first).
  pub primary_order_id: &'a str,

  /// Additional order_ids returned by Kinovi when batch_count > 1. Each
  /// becomes its own inference job row.
  pub maybe_additional_order_ids: Option<&'a [String]>,

  /// Wallet ledger entry from the up-front deduction. Stamped on each
  /// inserted row so the worker can issue a refund on failure.
  pub maybe_wallet_ledger_entry_token: Option<&'a WalletLedgerEntryToken>,

  /// Which Kinovi account fulfilled the request — Volcengine, BytePlus,
  /// or BytePlusUltra. For Midjourney image generation today this is
  /// always Volcengine, but the helper stays version-agnostic so a future
  /// account-picking layer can use it unchanged.
  pub kinovi_version: KinoviVersion,

  pub shared: SharedJobArgs<'a, 'tx>,
}

pub struct InsertSeedance2proJobsResult {
  pub primary_job_token: InferenceJobToken,
  pub all_job_tokens: Vec<InferenceJobToken>,
}

/// Insert one Seedance2Pro/Kinovi inference job per returned order_id.
/// Mirrors the video-side helper at
/// `omni_gen::generate::video::insert_db_job::insert_seedance2pro_jobs`.
pub async fn insert_seedance2pro_jobs(args: InsertSeedance2proJobsArgs<'_, '_>) -> Result<InsertSeedance2proJobsResult, CommonWebError> {
  let InsertSeedance2proJobsArgs {
    primary_order_id,
    maybe_additional_order_ids,
    maybe_wallet_ledger_entry_token,
    kinovi_version,
    mut shared,
  } = args;

  // Build a deduplicated list with primary_order_id first.
  let mut all_order_ids = vec![primary_order_id.to_string()];

  if let Some(additional) = maybe_additional_order_ids {
    for id in additional {
      if id != primary_order_id {
        all_order_ids.push(id.clone());
      }
    }
  }

  let mut all_job_tokens: Vec<InferenceJobToken> = Vec::with_capacity(all_order_ids.len());

  for (i, order_id) in all_order_ids.iter().enumerate() {
    let job_token = if i == 0 { shared.apriori_job_token.clone() } else { InferenceJobToken::generate() };

    // The idempotency_token column has a max length too tight for the
    // `{idempotency}-batch-{i}` suffix pattern used elsewhere; mint a
    // fresh UUID for each additional row instead. The primary row still
    // wants a deterministic value, but historic behavior on the video
    // side has been to mint UUIDs for all rows, which we mirror here.
    let idempotency_str = generate_random_uuid();

    let db_result = insert_generic_inference_job_for_seedance2pro_queue_with_apriori_job_token(
      InsertGenericInferenceForSeedance2ProWithAprioriJobTokenArgs {
        kinovi_version,
        apriori_job_token: &job_token,
        uuid_idempotency_token: &idempotency_str,
        maybe_external_third_party_id: order_id,
        maybe_model_type: shared.maybe_model_type,
        maybe_prompt_token: shared.maybe_prompt_token,
        maybe_wallet_ledger_entry_token,
        maybe_creator_user_token: Some(shared.user_token),
        maybe_avt_token: shared.maybe_avt_token,
        creator_ip_address: shared.ip_address,
        creator_set_visibility: Visibility::Public,
        maybe_platform_type: shared.maybe_platform_type,
        maybe_debug_log_event_token: shared.maybe_debug_log_event_token,
        mysql_executor: &mut **shared.transaction,
        maybe_inference_args: None,
        phantom: Default::default(),
      }
    ).await;

    match db_result {
      Ok(token) => all_job_tokens.push(token),
      Err(err) => {
        warn!("Error inserting seedance2pro inference job (image, order_id={}): {:?}", order_id, err);
        if i == 0 { return Err(CommonWebError::from_error(err)); }
      }
    }
  }

  let primary_job_token = all_job_tokens.first().cloned().ok_or_else(|| {
    error!("No inference job token was created");
    CommonWebError::server_error_with_message("No inference job token was created")
  })?;

  Ok(InsertSeedance2proJobsResult {
    primary_job_token,
    all_job_tokens,
  })
}

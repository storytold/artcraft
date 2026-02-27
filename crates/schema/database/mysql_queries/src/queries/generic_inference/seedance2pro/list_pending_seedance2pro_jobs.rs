use anyhow::anyhow;
use log::warn;
use sqlx::MySqlPool;

use enums::by_table::generic_inference_jobs::inference_job_external_third_party::InferenceJobExternalThirdParty;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;

/// A Seedance2Pro job that is waiting for a result from the external API.
#[derive(Debug)]
pub struct PendingSeedance2ProJob {
  pub job_token: InferenceJobToken,

  /// The external order_id from seedance2-pro.com.
  pub order_id: String,

  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_anonymous_visitor_token: Option<AnonymousVisitorTrackingToken>,
  pub creator_ip_address: String,
  pub creator_set_visibility: Visibility,

  pub maybe_prompt_token: Option<PromptToken>,

  pub maybe_wallet_ledger_entry_token: Option<WalletLedgerEntryToken>,
}

#[derive(Debug, Default)]
struct RawRecord {
  job_token: InferenceJobToken,
  order_id: Option<String>,
  maybe_creator_user_token: Option<UserToken>,
  maybe_creator_anonymous_visitor_token: Option<AnonymousVisitorTrackingToken>,
  creator_ip_address: String,
  creator_set_visibility: Visibility,
  maybe_prompt_token: Option<PromptToken>,
  maybe_wallet_ledger_entry_token: Option<WalletLedgerEntryToken>,
}

/// Returns all non-terminal Seedance2Pro jobs that have an associated order_id.
pub async fn list_pending_seedance2pro_jobs(pool: &MySqlPool) -> AnyhowResult<Vec<PendingSeedance2ProJob>> {
  let records = sqlx::query_as!(
    RawRecord,
    r#"
SELECT
    jobs.token as `job_token: tokens::tokens::generic_inference_jobs::InferenceJobToken`,
    jobs.maybe_external_third_party_id as `order_id`,
    jobs.maybe_creator_user_token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
    jobs.maybe_creator_anonymous_visitor_token as `maybe_creator_anonymous_visitor_token: tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken`,
    jobs.creator_ip_address,
    jobs.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,
    jobs.maybe_prompt_token as `maybe_prompt_token: tokens::tokens::prompts::PromptToken`,
    jobs.maybe_wallet_ledger_entry_token as `maybe_wallet_ledger_entry_token: tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken`

FROM generic_inference_jobs as jobs

WHERE jobs.maybe_external_third_party = ?
  AND jobs.status NOT IN ('complete_success', 'complete_failure')
  AND jobs.maybe_external_third_party_id IS NOT NULL

LIMIT 25000
    "#,
    InferenceJobExternalThirdParty::Seedance2Pro.to_str(),
  )
    .fetch_all(pool)
    .await
    .map_err(|err| anyhow!("error querying pending seedance2pro jobs: {:?}", err))?;

  let jobs = records
    .into_iter()
    .filter_map(|record| {
      let order_id = match record.order_id {
        Some(id) => id,
        None => {
          warn!("PendingSeedance2ProJob has no order_id, skipping");
          return None;
        }
      };

      Some(PendingSeedance2ProJob {
        job_token: record.job_token,
        order_id,
        maybe_creator_user_token: record.maybe_creator_user_token,
        maybe_creator_anonymous_visitor_token: record.maybe_creator_anonymous_visitor_token,
        creator_ip_address: record.creator_ip_address,
        creator_set_visibility: record.creator_set_visibility,
        maybe_prompt_token: record.maybe_prompt_token,
        maybe_wallet_ledger_entry_token: record.maybe_wallet_ledger_entry_token,
      })
    })
    .collect();

  Ok(jobs)
}

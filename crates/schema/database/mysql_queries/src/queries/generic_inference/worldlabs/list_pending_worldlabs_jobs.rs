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

/// A WorldLabs job that is waiting for a result from the external API.
#[derive(Debug)]
pub struct PendingWorldlabsJob {
  pub job_token: InferenceJobToken,

  /// The external operation_id from World Labs.
  pub operation_id: String,

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
  operation_id: Option<String>,
  maybe_creator_user_token: Option<UserToken>,
  maybe_creator_anonymous_visitor_token: Option<AnonymousVisitorTrackingToken>,
  creator_ip_address: String,
  creator_set_visibility: Visibility,
  maybe_prompt_token: Option<PromptToken>,
  maybe_wallet_ledger_entry_token: Option<WalletLedgerEntryToken>,
}

/// Returns all non-terminal WorldLabs jobs that have an associated operation_id.
pub async fn list_pending_worldlabs_jobs(pool: &MySqlPool) -> AnyhowResult<Vec<PendingWorldlabsJob>> {
  let records = sqlx::query_as!(
    RawRecord,
    r#"
SELECT
    jobs.token as `job_token: tokens::tokens::generic_inference_jobs::InferenceJobToken`,
    jobs.maybe_external_third_party_id as `operation_id`,
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
    InferenceJobExternalThirdParty::Worldlabs.to_str(),
  )
    .fetch_all(pool)
    .await
    .map_err(|err| anyhow!("error querying pending worldlabs jobs: {:?}", err))?;

  let jobs = records
    .into_iter()
    .filter_map(|record| {
      let operation_id = match record.operation_id {
        Some(id) => id,
        None => {
          warn!("PendingWorldlabsJob has no operation_id, skipping");
          return None;
        }
      };

      Some(PendingWorldlabsJob {
        job_token: record.job_token,
        operation_id,
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

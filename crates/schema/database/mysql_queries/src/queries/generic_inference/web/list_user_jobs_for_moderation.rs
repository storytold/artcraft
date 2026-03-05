use anyhow::anyhow;
use log::warn;
use sqlx::MySqlPool;

use enums::by_table::wallet_ledger_entries::wallet_ledger_entry_type::WalletLedgerEntryType;
use enums::common::job_status_plus::JobStatusPlus;
use errors::AnyhowResult;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;

pub struct UserJobForModerationResult {
  pub job_status: JobStatusPlus,
  pub job_failure_reason: Option<String>,
  pub credits_delta: Option<i32>,
  pub maybe_linked_refund_ledger_token: Option<WalletLedgerEntryToken>,
  pub on_success_result_media_token: Option<MediaFileToken>,
  pub job_token: InferenceJobToken,
  pub wallet_ledger_entry_token: Option<WalletLedgerEntryToken>,
  pub wallet_ledger_entry_type: Option<WalletLedgerEntryType>,
}

pub async fn list_user_jobs_for_moderation(
  user_token: &UserToken,
  mysql_pool: &MySqlPool,
) -> AnyhowResult<Vec<UserJobForModerationResult>> {
  let results = sqlx::query_as!(
    UserJobForModerationResult,
    r#"
SELECT
    j.status as `job_status: enums::common::job_status_plus::JobStatusPlus`,
    j.failure_reason as job_failure_reason,
    wle.credits_delta,
    wle.maybe_linked_refund_ledger_token as `maybe_linked_refund_ledger_token: tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken`,
    j.on_success_result_entity_token as `on_success_result_media_token: tokens::tokens::media_files::MediaFileToken`,
    j.token as `job_token: tokens::tokens::generic_inference_jobs::InferenceJobToken`,
    wle.token as `wallet_ledger_entry_token: tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken`,
    wle.entry_type as `wallet_ledger_entry_type: enums::by_table::wallet_ledger_entries::wallet_ledger_entry_type::WalletLedgerEntryType`
FROM generic_inference_jobs as j
LEFT OUTER JOIN users as u
    ON j.maybe_creator_user_token = u.token
LEFT OUTER JOIN wallet_ledger_entries as wle
    ON wle.maybe_entity_ref = j.token
WHERE u.token = ?
ORDER BY j.id DESC
    "#,
    user_token,
  )
    .fetch_all(mysql_pool)
    .await;

  match results {
    Ok(records) => Ok(records),
    Err(err) => {
      warn!("list_user_jobs_for_moderation query error: {:?}", err);
      Err(anyhow!("query error"))
    }
  }
}

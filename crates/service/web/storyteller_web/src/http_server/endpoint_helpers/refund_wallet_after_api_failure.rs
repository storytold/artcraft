use crate::http_server::common_responses::common_web_error::CommonWebError;
use log::{error, info};
use mysql_queries::queries::wallets::refund::try_to_refund_ledger_entry::{try_to_refund_ledger_entry, WalletRefundOutcome};
use sqlx::Acquire;
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;

pub async fn refund_wallet_after_api_failure(
  ledger_entry_token: &WalletLedgerEntryToken,
  connection: &mut sqlx::pool::PoolConnection<sqlx::MySql>,
) -> Result<(), CommonWebError> {
  let mut transaction = connection.begin().await.map_err(|err| {
    error!(
      "Failed to begin refund transaction after API failure (ledger {}): {:?}",
      ledger_entry_token.as_str(), err
    );
    CommonWebError::ServerError
  })?;

  match try_to_refund_ledger_entry(ledger_entry_token, &mut transaction).await {
    Ok(WalletRefundOutcome::Refunded(summary)) => {
      info!(
        "Refunded {} credits after API failure (ledger {} → refund ledger {}).",
        summary.refund_amount,
        ledger_entry_token.as_str(),
        summary.refund_ledger_entry_token.as_str(),
      );
      transaction.commit().await.map_err(|err| {
        error!(
          "Failed to commit refund after API failure (ledger {}): {:?}",
          ledger_entry_token.as_str(), err
        );
        CommonWebError::ServerError
      })?;
    }
    Ok(WalletRefundOutcome::AlreadyRefunded) => {
      info!(
        "Ledger entry {} was already refunded; no action needed.",
        ledger_entry_token.as_str()
      );
      let _ = transaction.rollback().await;
    }
    Err(err) => {
      error!(
        "Failed to refund ledger entry {} after API failure: {:?}",
        ledger_entry_token.as_str(), err
      );
      let _ = transaction.rollback().await;
      return Err(CommonWebError::ServerError);
    }
  }

  Ok(())
}

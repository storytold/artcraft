//! Shared wallet billing logic for both video generation pipelines.

use log::info;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;

use crate::billing::wallets::attempt_wallet_deduction::attempt_wallet_deduction_else_common_web_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;

pub struct BillWalletResult {
  pub apriori_job_token: InferenceJobToken,
  pub maybe_wallet_ledger_entry_token: Option<WalletLedgerEntryToken>,
}

/// Generate an apriori job token and bill the user's wallet for the given cost.
///
/// If cost is 0, no wallet deduction is made but the apriori token is still generated.
pub async fn bill_wallet(
  user_token: &UserToken,
  cost: u64,
  mysql_connection: &mut sqlx::pool::PoolConnection<sqlx::MySql>,
) -> Result<BillWalletResult, CommonWebError> {
  let apriori_job_token = InferenceJobToken::generate();

  info!("Charging wallet: {} credits", cost);

  let maybe_wallet_ledger_entry_token = if cost > 0 {
    let deduction_result = attempt_wallet_deduction_else_common_web_error(
      user_token,
      Some(apriori_job_token.as_str()),
      cost,
      mysql_connection,
    ).await?;
    Some(deduction_result.ledger_entry_token)
  } else {
    None
  };

  Ok(BillWalletResult {
    apriori_job_token,
    maybe_wallet_ledger_entry_token,
  })
}

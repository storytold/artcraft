use crate::http_server::common_responses::common_web_error::CommonWebError;
use enums::common::payments_namespace::PaymentsNamespace;
use errors::AnyhowResult;
use log::{error, info};
use mysql_queries::queries::wallets::create_new_artcraft_wallet_for_owner_user::create_new_artcraft_wallet_for_owner_user;
use mysql_queries::queries::wallets::find_primary_wallet_token_for_owner::find_primary_wallet_token_for_owner_using_connection;
use mysql_queries::queries::wallets::spend::try_to_spend_wallet_balance::try_to_spend_wallet_balance;
use mysql_queries::queries::wallets::spend::wallet_spend_error::WalletSpendError;
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, MySql};
use tokens::tokens::users::UserToken;
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;
use tokens::tokens::wallets::WalletToken;

pub struct WalletDeductionResult {
  pub wallet_token: WalletToken,
  pub ledger_entry_token: WalletLedgerEntryToken,
}

pub async fn attempt_wallet_deduction_else_common_web_error(
  user_token: &UserToken,
  maybe_reference_token: Option<&str>,
  amount_to_deduct: u64,
  connection: &mut PoolConnection<MySql>
) -> Result<WalletDeductionResult, CommonWebError> {

  let result = try_wallet_deduction(
    user_token,
    maybe_reference_token,
    amount_to_deduct,
    connection
  ).await;

  // Infallible for now.
  match result {
    Ok(deduction_result) => Ok(deduction_result),
    Err(err) => Err(match err {
      WalletSpendError::InvalidAmountToSpend => {
        log::error!("invalid spend amount charged");
        CommonWebError::PaymentRequired
      }
      WalletSpendError::InsufficientBalance { requested_to_spend_amount, available_amount } => {
        log::error!("payment is required - requested: {}, available: {}", requested_to_spend_amount, available_amount);
        CommonWebError::PaymentRequired
      }
      WalletSpendError::SelectError(err) => {
        log::error!("SQL error (select) in attempt_wallet_deduction: {:?}", err);
        CommonWebError::ServerError
      }
      WalletSpendError::SelectOptionalError(err) => {
        log::error!("SQL error (select optional) in attempt_wallet_deduction: {:?}", err);
        CommonWebError::ServerError
      }
      WalletSpendError::SqlxError(err) => {
        log::error!("SQL error (sqlx) in attempt_wallet_deduction: {:?}", err);
        CommonWebError::ServerError
      }
    }),
  }
}

async fn try_wallet_deduction(
  owner_user_token: &UserToken,
  maybe_reference_token: Option<&str>,
  amount_to_deduct: u64,
  connection: &mut PoolConnection<MySql>
) -> Result<WalletDeductionResult, WalletSpendError>
{
  let maybe_wallet_token = find_primary_wallet_token_for_owner_using_connection(
    owner_user_token,
    PaymentsNamespace::Artcraft,
    connection
  ).await?;

  let mut transaction = connection.begin().await?;

  let result = try_wallet_deduction_with_transaction(
    owner_user_token,
    maybe_wallet_token,
    maybe_reference_token,
    amount_to_deduct,
    &mut transaction
  ).await;

  match result {
    Ok(deduction_result) => {
      transaction.commit().await?;
      Ok(deduction_result)
    },
    Err(err) => {
      error!("Error handling temporary wallet deduction for user {:?} : {:?}",
        owner_user_token, err);

      transaction.rollback().await?;

      Err(err)
    }
  }
}

async fn try_wallet_deduction_with_transaction(
  owner_user_token: &UserToken,
  maybe_wallet_token: Option<WalletToken>,
  maybe_reference_token: Option<&str>,
  amount_to_deduct: u64,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> Result<WalletDeductionResult, WalletSpendError>
{
  let wallet_token = match maybe_wallet_token {
    Some(token) => token,
    None => {
      info!("No wallet found for user: {} ; creating a new one...", owner_user_token.as_str());
      create_new_artcraft_wallet_for_owner_user(owner_user_token, transaction).await?
    }
  };

  let summary = try_to_spend_wallet_balance(
    &wallet_token,
    amount_to_deduct,
    maybe_reference_token,
    transaction
  ).await
    .map_err(|err| {
      error!("Failed to deduct {} credits from wallet {} for user {} : {:?}",
        amount_to_deduct,
        wallet_token.as_str(),
        owner_user_token.as_str(),
        err);
      err
    })?;

  Ok(WalletDeductionResult {
    wallet_token: summary.wallet_token,
    ledger_entry_token: summary.wallet_ledger_entry_token,
  })
}

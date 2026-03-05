use crate::billing_action_fulfillment::artcraft_billing_action::UserCustomerLink;
use crate::configs::credits_packs::stripe_artcraft_credits_pack_info::StripeArtcraftCreditsPackInfo;
use enums::common::payments_namespace::PaymentsNamespace;
use log::info;
use mysql_queries::queries::users::user_stripe_customer_links::find_user_stripe_customer_link::find_user_stripe_customer_link_using_transaction;
use mysql_queries::queries::users::user_stripe_customer_links::upsert_user_stripe_customer_link::UpsertUserStripeCustomerLink;
use mysql_queries::queries::wallets::add_durable_banked_balance_to_wallet::add_durable_banked_balance_to_wallet;
use mysql_queries::queries::wallets::create_new_artcraft_wallet_for_owner_user::create_new_artcraft_wallet_for_owner_user;
use mysql_queries::queries::wallets::find_primary_wallet_token_for_owner::find_primary_wallet_token_for_owner_using_transaction;
use tokens::tokens::users::UserToken;

/// Record the credits pack purchase
pub async fn complete_credits_pack_purchase(
  owner_user_token: &UserToken,
  pack: &StripeArtcraftCreditsPackInfo,
  quantity: u64,
  maybe_ledger_ref: Option<&str>,
  maybe_stripe_customer_id: Option<&str>,
  transaction: &mut sqlx::Transaction<'_, sqlx::MySql>,
) -> anyhow::Result<()> {

  let maybe_wallet_token = find_primary_wallet_token_for_owner_using_transaction(
    owner_user_token, 
    PaymentsNamespace::Artcraft,
    transaction
  ).await?;
  
  let wallet_token = match maybe_wallet_token {
    Some(token) => token,
    None => {
      info!("No wallet found for user: {} ; creating a new one...", owner_user_token.as_str());
      create_new_artcraft_wallet_for_owner_user(owner_user_token, transaction).await?
    }
  };
  
  let credits_purchased = pack.purchase_credits_amount.saturating_mul(quantity);
  
  info!("Adding {} credits to wallet: {}", credits_purchased, wallet_token.as_str());
  
  let _result = add_durable_banked_balance_to_wallet(
    &wallet_token,
    credits_purchased,
    maybe_ledger_ref,
    None,
    transaction,
  ).await?;

  if let Some(stripe_customer_id) = maybe_stripe_customer_id {
    optionally_link_user_to_stripe_customer(
      owner_user_token,
      stripe_customer_id,
      transaction,
    ).await?;
  }

  Ok(())
}

/// Linking the payment customer to the local user is optional, but it helps us reuse
/// the card details and not create spurious duplicate customers in Stripe. We use this
/// linkage in all future portal and checkout sessions once it's established.
async fn optionally_link_user_to_stripe_customer(
  user_token: &UserToken,
  stripe_customer_id: &str,
  transaction: &mut sqlx::Transaction<'_, sqlx::MySql>,
) -> anyhow::Result<()> {

  let maybe_record = find_user_stripe_customer_link_using_transaction(
    user_token,
    PaymentsNamespace::Artcraft,
    transaction
  ).await?;

  if maybe_record.is_some() {
    return Ok(());
  }

  info!("User is not already linked to a Stripe customer; linking ...");

  let upsert = UpsertUserStripeCustomerLink {
    user_token,
    stripe_customer_id,
    payments_namespace: PaymentsNamespace::Artcraft,
  };

  upsert.upsert_with_transaction(transaction).await?;

  Ok(())
}

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
use std::marker::PhantomData;
use chrono::{DateTime, Utc};
use enums::by_table::user_spend_events::payment_event_type::PaymentEventType;
use enums::by_table::user_spend_events::payment_source::PaymentSource;
use mysql_queries::queries::user_spend_events::insert_user_spend_event::{insert_user_spend_event, InsertUserSpendEventArgs};

/// Record the credits pack purchase
pub async fn complete_credits_pack_purchase(
  owner_user_token: &UserToken,
  pack: &StripeArtcraftCreditsPackInfo,
  quantity: u64,
  maybe_ledger_ref: Option<&str>,
  maybe_stripe_customer_id: Option<&str>,
  maybe_stripe_charge_id: Option<&str>,
  maybe_stripe_event_id: Option<&str>,
  amount_usd_cents: i64,
  is_production: bool,
  payment_occurred_at: DateTime<Utc>,
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
  
  let wallet_update = add_durable_banked_balance_to_wallet(
    &wallet_token,
    credits_purchased,
    maybe_ledger_ref,
    None,
    transaction,
  ).await?;

  // Record the money movement in the spend-events ledger, in this SAME
  // transaction. Idempotent on (payment_source, source_object_id), so a replayed
  // `payment_intent.succeeded` webhook is a no-op.
  insert_user_spend_event(InsertUserSpendEventArgs {
    payments_namespace: PaymentsNamespace::Artcraft,
    maybe_user_token: Some(owner_user_token),
    event_type: PaymentEventType::CreditPackPurchase,
    amount_usd_cents,
    // NULL rather than a clamped/garbage value if it somehow doesn't fit u32.
    maybe_credits_granted: u32::try_from(credits_purchased).ok(),
    maybe_user_subscription_token: None,
    maybe_wallet_ledger_entry_token: Some(&wallet_update.wallet_ledger_entry_token),
    payment_source: PaymentSource::Stripe,
    maybe_source_object_id: maybe_ledger_ref,
    maybe_stripe_customer_id,
    maybe_stripe_invoice_id: None,
    maybe_stripe_payment_intent_id: maybe_ledger_ref,
    maybe_stripe_charge_id,
    maybe_stripe_event_id,
    is_production,
    payment_occurred_at,
    mysql_executor: &mut **transaction,
    phantom: PhantomData,
  }).await?;

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

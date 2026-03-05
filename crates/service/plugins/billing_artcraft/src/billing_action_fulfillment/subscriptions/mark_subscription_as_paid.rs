use crate::billing_action_fulfillment::artcraft_billing_action::SubscriptionPaidEvent;
use enums::common::payments_namespace::PaymentsNamespace;
use log::{info, warn};
use mysql_queries::queries::users::user_subscriptions::get_user_subscription_by_stripe_subscription_id::get_user_subscription_by_stripe_subscription_id_transactional;
use mysql_queries::queries::users::user_subscriptions::upsert_user_subscription_with_invoice_paid_status_by_stripe_id::UpsertUserSubscriptionWithInvoicePaidStatus;
use mysql_queries::queries::wallets::create_new_artcraft_wallet_for_owner_user::create_new_artcraft_wallet_for_owner_user;
use mysql_queries::queries::wallets::find_primary_wallet_token_for_owner::find_primary_wallet_token_for_owner_using_transaction;
use mysql_queries::queries::wallets::refill_monthly_credits_balance_on_wallet::refill_monthly_credits_balance_on_wallet;
use reusable_types::stripe::stripe_subscription_status::StripeSubscriptionStatus;

pub async fn mark_subscription_as_paid(
  details: &SubscriptionPaidEvent,
  transaction: &mut sqlx::Transaction<'_, sqlx::MySql>,
) -> anyhow::Result<()> {

  let maybe_existing_subscription = get_user_subscription_by_stripe_subscription_id_transactional(
    &details.stripe_subscription_id,
    transaction,
  ).await?;

  // NB: It's possible to receive events out of order.
  // Entirely possible that the subscription object doesn't exist yet.
  if let Some(existing_sub) = maybe_existing_subscription {
    match existing_sub.maybe_stripe_subscription_status {
      Some(StripeSubscriptionStatus::Canceled) => {
        warn!("Existing subscription record already in terminal state...");

        // TODO: We have to mark paid, but this is tricky...

        return Ok(()); // Turn this into a no-op. This is stale info.
      }
      _ => {} // Fall-through
    }
  }

  let upsert = UpsertUserSubscriptionWithInvoicePaidStatus {
    // This is the primary key
    stripe_subscription_id: &details.stripe_subscription_id,

    // Invoice is paid
    invoice_is_paid: true,

    // Artcraft product foreign keys
    user_token: details.owner_user_token.as_str(),
    subscription_namespace: PaymentsNamespace::Artcraft,
    subscription_product_slug: details.artcraft_subscription.slug.to_str(),

    // Stripe object foreign keys
    maybe_stripe_customer_id: Some(&details.stripe_customer_id),
    maybe_stripe_product_id: Some(&details.stripe_product_id),
    maybe_stripe_price_id: Some(&details.stripe_price_id),

    // Core subscription metadata
    maybe_stripe_recurring_interval: Some(details.stripe_recurring_interval),
    maybe_stripe_subscription_status: Some(details.stripe_subscription_status),
    maybe_stripe_is_production: Some(details.stripe_is_production),

    // Timing data
    maybe_stripe_billing_cycle_anchor: Some(details.stripe_billing_cycle_anchor),
    subscription_start_at: details.subscription_start_at,
    current_billing_period_start_at: details.current_billing_period_start_at,
    current_billing_period_end_at: details.current_billing_period_end_at,
    subscription_expires_at: details.calculated_subscription_expires_at,
    maybe_cancel_at: details.maybe_cancel_at,
    maybe_canceled_at: details.maybe_canceled_at,
  };

  upsert.upsert_with_transaction(transaction).await?;

  let maybe_wallet_token = find_primary_wallet_token_for_owner_using_transaction(
    &details.owner_user_token, 
    PaymentsNamespace::Artcraft,
    transaction
  ).await?;

  let wallet_token = match maybe_wallet_token {
    Some(token) => token,
    None => {
      info!("No wallet found for user: {} ; creating a new one...", &details.owner_user_token.as_str());
      create_new_artcraft_wallet_for_owner_user(&details.owner_user_token, transaction).await?
    }
  };

  let monthly_credits = details.artcraft_subscription.monthly_credits_amount;
  
  let maybe_ledger_ref = details.ledger_event_ref.as_deref();

  info!("Adding {} monthly credits to wallet: {}", monthly_credits , wallet_token.as_str());

  let _result = refill_monthly_credits_balance_on_wallet(
    &wallet_token, 
    monthly_credits, 
    maybe_ledger_ref,
    transaction
  ).await?;

  Ok(())
}

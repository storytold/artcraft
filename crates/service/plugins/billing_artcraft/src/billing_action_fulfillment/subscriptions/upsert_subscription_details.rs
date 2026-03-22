use crate::billing_action_fulfillment::artcraft_billing_action::UpsertableSubscriptionDetails;
use enums_db::common::payments_namespace::PaymentsNamespace;
use log::info;
use mysql_queries::queries::users::user_subscriptions::get_user_subscription_by_stripe_subscription_id::get_user_subscription_by_stripe_subscription_id_transactional;
use mysql_queries::queries::users::user_subscriptions::upsert_user_subscription_by_stripe_id::UpsertUserSubscription;
use reusable_types::stripe::stripe_subscription_status::StripeSubscriptionStatus;

#[derive(Copy, Clone)]
pub enum CrudType {
  Create,
  Update,
  Delete,
}

/// Record the credits pack purchase
pub async fn upsert_subscription_details(
  details: &UpsertableSubscriptionDetails,
  crud_type: CrudType,
  transaction: &mut sqlx::Transaction<'_, sqlx::MySql>,
) -> anyhow::Result<()> {

  let maybe_existing_subscription = get_user_subscription_by_stripe_subscription_id_transactional(
    &details.stripe_subscription_id,
    transaction,
  ).await?;

  // NB: It's possible to receive events out of order.
  // We can get an 'update' after a 'create', etc.
  if let Some(existing_sub) = maybe_existing_subscription {
    match crud_type {
      CrudType::Create => {
        // We won't want to play a `create` event on top of something already existing.
        info!("Subscription record already exists. Skipping insert.");
        return Ok(()); // Turn this into a no-op. This is stale info.
      }
      CrudType::Update | CrudType::Delete => {
        match existing_sub.maybe_stripe_subscription_status {
          Some(StripeSubscriptionStatus::Canceled) => {
            // NB: The stored subscription already had a terminal status and the subscription cannot be updated any further.
            info!("Existing subscription record already in terminal state. Skipping updates.");
            return Ok(()); // Turn this into a no-op. This is stale info.
          }
          _ => {} // Fall-through
        }
      }
    }
  }

  let upsert = UpsertUserSubscription {
    // This is the primary key
    stripe_subscription_id: &details.stripe_subscription_id,

    // Artcraft product foreign keys
    user_token: details.owner_user_token.as_str(),
    subscription_namespace: PaymentsNamespace::Artcraft,
    subscription_product_slug: details.subscription.slug.to_str(),

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

  Ok(())
}

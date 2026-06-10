use sqlx::pool::PoolConnection;
use sqlx::MySql;

use enums::common::payments_namespace::PaymentsNamespace;
use tokens::tokens::users::UserToken;

/// A distinct stripe customer id attached to one of the user's subscriptions.
pub struct UserSubscriptionStripeCustomerId {
  pub subscription_namespace: PaymentsNamespace,
  pub stripe_customer_id: String,
}

/// List the distinct stripe customer ids across all of a user's subscriptions
/// (current and historical), across all payments namespaces.
pub async fn list_stripe_customer_ids_for_user_subscriptions(
  user_token: &UserToken,
  connection: &mut PoolConnection<MySql>,
) -> Result<Vec<UserSubscriptionStripeCustomerId>, sqlx::Error> {
  let records = sqlx::query_as!(
    UserSubscriptionStripeCustomerId,
    r#"
SELECT DISTINCT
  subscription_namespace as `subscription_namespace: enums::common::payments_namespace::PaymentsNamespace`,
  maybe_stripe_customer_id as `stripe_customer_id!`

FROM user_subscriptions

WHERE
  user_token = ?
  AND maybe_stripe_customer_id IS NOT NULL
  AND deleted_at IS NULL
ORDER BY subscription_namespace ASC, maybe_stripe_customer_id ASC
    "#,
    user_token.as_str(),
  )
      .fetch_all(&mut **connection)
      .await?;

  Ok(records)
}

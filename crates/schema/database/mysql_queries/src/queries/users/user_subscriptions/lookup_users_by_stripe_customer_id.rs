use anyhow::anyhow;
use log::warn;
use sqlx::MySqlPool;

use enums::common::payments_namespace::PaymentsNamespace;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;

pub struct UserByStripeCustomerIdResult {
  pub subscription_namespace: PaymentsNamespace,
  pub maybe_stripe_subscription_id: Option<String>,
  pub user_token: UserToken,
  pub email_address: String,
  pub username: String,
  pub display_name: String,
}

pub async fn lookup_users_by_stripe_customer_id(
  stripe_customer_id: &str,
  mysql_pool: &MySqlPool,
) -> AnyhowResult<Vec<UserByStripeCustomerIdResult>> {
  let results = sqlx::query_as!(
    UserByStripeCustomerIdResult,
    r#"
SELECT
    user_subscriptions.subscription_namespace as `subscription_namespace: enums::common::payments_namespace::PaymentsNamespace`,
    user_subscriptions.maybe_stripe_subscription_id,
    users.token as `user_token: tokens::tokens::users::UserToken`,
    users.email_address,
    users.username,
    users.display_name
FROM user_subscriptions
INNER JOIN users ON users.token = user_subscriptions.user_token
WHERE
    user_subscriptions.maybe_stripe_customer_id = ?
    AND user_subscriptions.deleted_at IS NULL
    AND users.user_deleted_at IS NULL
    AND users.mod_deleted_at IS NULL
ORDER BY user_subscriptions.created_at DESC
    "#,
    stripe_customer_id,
  )
    .fetch_all(mysql_pool)
    .await;

  match results {
    Ok(records) => Ok(records),
    Err(err) => {
      warn!("lookup_users_by_stripe_customer_id query error: {:?}", err);
      Err(anyhow!("query error"))
    }
  }
}

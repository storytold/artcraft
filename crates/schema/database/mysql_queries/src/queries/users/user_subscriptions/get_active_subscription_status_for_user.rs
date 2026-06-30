use std::marker::PhantomData;

use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use enums::common::payments_namespace::PaymentsNamespace;
use tokens::tokens::users::UserToken;

/// The user's most-relevant subscription (latest-expiring), for deriving
/// `is_active_subscriber` and `maybe_subscription_interval` in the analytics job.
pub struct UserSubscriptionStatusRow {
  pub maybe_stripe_subscription_status: Option<String>,
  pub maybe_stripe_recurring_interval: Option<String>,
  pub subscription_expires_at: DateTime<Utc>,
}

pub struct GetActiveSubscriptionStatusArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub user_token: &'e UserToken,
  pub subscription_namespace: PaymentsNamespace,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Returns the latest-expiring subscription row for the user (or `None`). The
/// caller decides active-ness from the status + expiry.
pub async fn get_active_subscription_status_for_user<'e, 'c: 'e, E>(
  args: GetActiveSubscriptionStatusArgs<'e, 'c, E>,
) -> Result<Option<UserSubscriptionStatusRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let row = sqlx::query_as!(
    UserSubscriptionStatusRow,
    r#"
SELECT
  maybe_stripe_subscription_status,
  maybe_stripe_recurring_interval,
  subscription_expires_at AS `subscription_expires_at!: DateTime<Utc>`
FROM user_subscriptions
WHERE user_token = ?
  AND subscription_namespace = ?
ORDER BY subscription_expires_at DESC
LIMIT 1
    "#,
    args.user_token.as_str(),
    args.subscription_namespace.to_str(),
  )
    .fetch_optional(args.mysql_executor)
    .await?;

  Ok(row)
}

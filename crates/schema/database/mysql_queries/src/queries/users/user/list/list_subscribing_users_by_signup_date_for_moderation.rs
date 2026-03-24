use chrono::{DateTime, Utc};
use log::warn;
use sqlx::MySqlPool;

use enums::by_table::users::user_signup_method::UserSignupMethod;
use enums::by_table::users::user_signup_source::UserSignupSource;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;

pub struct ListSubscribingUsersBySignupDateRow {
  pub id: u64,
  pub token: UserToken,
  pub username: String,
  pub display_name: String,
  pub username_is_not_customized: bool,
  pub email_address: String,
  pub email_confirmed: bool,
  pub is_without_password: bool,
  pub ip_address_creation: String,
  pub maybe_source: Option<UserSignupSource>,
  pub maybe_signup_method: Option<UserSignupMethod>,
  pub created_at: DateTime<Utc>,
  pub maybe_referral_url: Option<String>,
  pub is_temporary: bool,

  // Subscription fields
  pub subscription_namespace: String,
  pub subscription_product_slug: String,
  pub maybe_stripe_subscription_id: Option<String>,
  pub maybe_stripe_customer_id: Option<String>,
  pub maybe_stripe_product_id: Option<String>,
  pub maybe_stripe_price_id: Option<String>,
  pub maybe_stripe_subscription_status: Option<String>,
  pub maybe_stripe_recurring_interval: Option<String>,
  pub maybe_stripe_invoice_is_paid: Option<bool>,
  pub maybe_cancel_at: Option<DateTime<Utc>>,
  pub maybe_canceled_at: Option<DateTime<Utc>>,
}

pub struct ListSubscribingUsersBySignupDateArgs {
  pub maybe_id_cursor: Option<u64>,
  pub limit: u32,
}

pub struct ListSubscribingUsersBySignupDateResult {
  pub users: Vec<ListSubscribingUsersBySignupDateRow>,
  pub next_cursor: Option<u64>,
}

pub async fn list_subscribing_users_by_signup_date_for_moderation(
  args: ListSubscribingUsersBySignupDateArgs,
  mysql_pool: &MySqlPool,
) -> AnyhowResult<ListSubscribingUsersBySignupDateResult> {
  // Fetch limit + 1 so we can detect whether there's a next page.
  let fetch_limit = (args.limit + 1) as i64;

  // Use i64::MAX when no cursor so all rows are included.
  let id_cursor = args.maybe_id_cursor
    .map(|c| c as i64)
    .unwrap_or(i64::MAX);

  let rows = sqlx::query_as!(
    ListSubscribingUsersBySignupDateRow,
    r#"
SELECT
    u.id as `id: u64`,
    u.token as `token: tokens::tokens::users::UserToken`,
    u.username,
    u.display_name,
    u.username_is_not_customized as `username_is_not_customized: bool`,
    u.email_address,
    u.email_confirmed as `email_confirmed: bool`,
    u.is_without_password as `is_without_password: bool`,
    u.ip_address_creation,
    u.maybe_source as `maybe_source: enums::by_table::users::user_signup_source::UserSignupSource`,
    u.maybe_signup_method as `maybe_signup_method: enums::by_table::users::user_signup_method::UserSignupMethod`,
    u.created_at,
    u.maybe_referral_url,
    u.is_temporary as `is_temporary: bool`,
    us.subscription_namespace,
    us.subscription_product_slug,
    us.maybe_stripe_subscription_id,
    us.maybe_stripe_customer_id,
    us.maybe_stripe_product_id,
    us.maybe_stripe_price_id,
    us.maybe_stripe_subscription_status,
    us.maybe_stripe_recurring_interval,
    us.maybe_stripe_invoice_is_paid as `maybe_stripe_invoice_is_paid: bool`,
    us.maybe_cancel_at,
    us.maybe_canceled_at
FROM users AS u
INNER JOIN user_subscriptions AS us ON u.token = us.user_token
WHERE
    u.id < ?
    AND u.user_deleted_at IS NULL
    AND u.mod_deleted_at IS NULL
ORDER BY u.id DESC
LIMIT ?
    "#,
    id_cursor,
    fetch_limit,
  )
    .fetch_all(mysql_pool)
    .await
    .map_err(|err| {
      warn!("list_subscribing_users_by_signup_date_for_moderation query error: {:?}", err);
      anyhow::anyhow!("query error")
    })?;

  let has_next = rows.len() as u32 > args.limit;
  let users: Vec<ListSubscribingUsersBySignupDateRow> = rows.into_iter().take(args.limit as usize).collect();
  let next_cursor = if has_next {
    users.last().map(|u| u.id)
  } else {
    None
  };

  Ok(ListSubscribingUsersBySignupDateResult {
    users,
    next_cursor,
  })
}

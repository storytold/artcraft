use sqlx::pool::PoolConnection;
use sqlx::MySql;

use enums::common::payments_namespace::PaymentsNamespace;
use tokens::tokens::users::UserToken;

use crate::queries::users::user_stripe_customer_links::find_user_stripe_customer_link::UserStripeCustomerLink;

/// List every stripe customer link for a user, across all payments namespaces.
/// Users have at most one link per namespace.
pub async fn list_user_stripe_customer_links_for_user(
  user_token: &UserToken,
  connection: &mut PoolConnection<MySql>,
) -> Result<Vec<UserStripeCustomerLink>, sqlx::Error> {
  let records = sqlx::query_as!(
    RawUserStripeCustomerLink,
    r#"
SELECT
  user_token as `user_token: tokens::tokens::users::UserToken`,
  payments_namespace as `payments_namespace: enums::common::payments_namespace::PaymentsNamespace`,
  stripe_customer_id

FROM user_stripe_customer_links

WHERE user_token = ?
ORDER BY id ASC
    "#,
    user_token.as_str(),
  )
      .fetch_all(&mut **connection)
      .await?;

  let links = records
      .into_iter()
      .map(|record| UserStripeCustomerLink {
        user_token: record.user_token,
        payments_namespace: record.payments_namespace,
        stripe_customer_id: record.stripe_customer_id,
      })
      .collect();

  Ok(links)
}

#[derive(sqlx::FromRow)]
struct RawUserStripeCustomerLink {
  user_token: UserToken,
  payments_namespace: PaymentsNamespace,
  stripe_customer_id: String,
}

use crate::errors::select_optional_record_error::SelectOptionalRecordError;
use crate::types::query_map::QueryMap;
use enums_db::common::payments_namespace::PaymentsNamespace;
use sqlx;
use sqlx::mysql::MySqlRow;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use tokens::tokens::users::UserToken;

// NB: We only store one stripe customer ID per user per namespace.
// And each stripe customer ID only exists in the database once.
// If users need a new stripe customer ID, we need to hard delete the existing record.
// This should not be used for critical functions, but rather convenience of
// linking customer records.
pub struct UserStripeCustomerLink {
  pub user_token: UserToken,

  pub payments_namespace: PaymentsNamespace,

  pub stripe_customer_id: String,
}

pub async fn find_user_stripe_customer_link_using_connection(
  user_token: &UserToken,
  namespace: PaymentsNamespace,
  connection: &mut PoolConnection<MySql>,
) -> Result<Option<UserStripeCustomerLink>, SelectOptionalRecordError> {

  let query = query(user_token, namespace);

  let result = query
      .fetch_optional(&mut **connection)
      .await;

  map_result(result)
}


pub async fn find_user_stripe_customer_link_using_transaction(
  user_token: &UserToken,
  namespace: PaymentsNamespace,
  transaction: &mut sqlx::Transaction<'_, MySql>,
) -> Result<Option<UserStripeCustomerLink>, SelectOptionalRecordError> {

  let query = query(user_token, namespace);

  let result = query
      .fetch_optional(&mut **transaction)
      .await;

  map_result(result)
}

fn map_result(result: Result<Option<RawUserStripeCustomerLink>, sqlx::Error>) -> Result<Option<UserStripeCustomerLink>, SelectOptionalRecordError> {
  match result {
    Ok(Some(record)) => Ok(Some(UserStripeCustomerLink {
      user_token: record.user_token,
      payments_namespace: record.payments_namespace,
      stripe_customer_id: record.stripe_customer_id,
    })),
    Ok(None) => Ok(None),
    Err(e) => Err(e.into()),
  }
}

fn query(user_token: &UserToken, namespace: PaymentsNamespace)
  -> QueryMap<impl Send + FnMut(MySqlRow) -> Result<RawUserStripeCustomerLink, sqlx::Error>>
{
  sqlx::query_as!(
    RawUserStripeCustomerLink,
    r#"
SELECT
  user_token as `user_token: tokens::tokens::users::UserToken`,
  payments_namespace as `payments_namespace: enums_db::common::payments_namespace::PaymentsNamespace`,
  stripe_customer_id

FROM user_stripe_customer_links

WHERE
  user_token = ?
  AND payments_namespace = ?
  ORDER BY id ASC
  LIMIT 1
    "#,
    user_token.as_str(),
    namespace.to_str(),
  )
}


#[derive(sqlx::FromRow)]
struct RawUserStripeCustomerLink {
  user_token: UserToken,
  payments_namespace: PaymentsNamespace,
  stripe_customer_id: String,
}

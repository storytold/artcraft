use crate::errors::database_insert_error::DatabaseInsertError;
use enums_db::common::payments_namespace::PaymentsNamespace;
use sqlx::mysql::MySqlArguments;
use sqlx::pool::PoolConnection;
use sqlx::query::Query;
use sqlx::{MySql, MySqlPool, Transaction};
use tokens::tokens::users::UserToken;

// TODO: Make a trait with default impls to handle common query concerns.

pub struct UpsertUserStripeCustomerLink<'a> {
  pub user_token: &'a UserToken,

  /// The platform key, eg. "artcraft", "fakeyou", etc.
  pub payments_namespace: PaymentsNamespace,

  /// Stripe's assigned ID for the subscription
  /// This acts as an externally-provided unique key for records in this table.
  pub stripe_customer_id: &'a str,
}

impl <'a> UpsertUserStripeCustomerLink<'a> {

  pub async fn upsert(&'a self, mysql_pool: &MySqlPool) -> Result<(), DatabaseInsertError> {
    let mut conn = mysql_pool.acquire().await?;
    self.upsert_with_connection(&mut conn).await
  }
  
  pub async fn upsert_with_connection(&'a self, mysql_connection: &mut PoolConnection<MySql>) -> Result<(), DatabaseInsertError> {
    let query = self.query();
    let _result = query.execute(&mut **mysql_connection).await?;
    Ok(())
  }

  pub async fn upsert_with_transaction(&'a self, transaction: &mut Transaction<'_, MySql>) -> Result<(), DatabaseInsertError> {
    let query = self.query();
    let _result = query.execute(&mut **transaction).await?;
    Ok(())
  }

  fn query(&self) -> Query<MySql, MySqlArguments> {
    sqlx::query!(
        r#"
INSERT INTO user_stripe_customer_links
SET
  user_token = ?,
  payments_namespace = ?,
  stripe_customer_id = ?

ON DUPLICATE KEY UPDATE
  updated_at = CURRENT_TIMESTAMP
        "#,
      // Insert
      self.user_token,
      self.payments_namespace.to_str(),
      self.stripe_customer_id,
    )
  }
}

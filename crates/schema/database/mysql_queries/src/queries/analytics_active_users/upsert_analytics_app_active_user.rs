use crate::errors::mysql_error::MysqlError;
use crate::errors::subtypes::upsert_error::UpsertError;
use enums_db::common::payments_namespace::PaymentsNamespace;
use sqlx::mysql::MySqlArguments;
use sqlx::pool::PoolConnection;
use sqlx::query::Query;
use sqlx::MySql;
use tokens::tokens::users::UserToken;

pub struct UpsertAnalyticsAppActiveUser<'a> {
  // TODO: Swap PaymentsNamespace (artcraft,fakeyou,etc.) for an AnalyticsNamespace enum.
  pub namespace: PaymentsNamespace,
  pub user_token: &'a UserToken,
  pub ip_address: &'a str,
  pub app_version: Option<&'a str>,
  pub os_platform: Option<&'a str>,
  pub os_version: Option<&'a str>,
  pub session_duration_seconds: Option<u64>,
}

impl <'a> UpsertAnalyticsAppActiveUser<'a> {
  fn query(&self) -> Query<MySql, MySqlArguments> {
    sqlx::query!(
        r#"
INSERT INTO analytics_app_active_users
SET
  app_namespace = ?,
  user_token = ?,
  app_version = ?,
  os_platform = ?,
  os_version = ?,
  session_duration_seconds = ?,
  ip_address = ?,
  measurement_count = measurement_count + 1,
  first_active_at = NOW(),
  last_active_at = NOW()
ON DUPLICATE KEY UPDATE
  app_version = ?,
  os_platform = ?,
  os_version = ?,
  session_duration_seconds = ?,
  ip_address = ?,
  measurement_count = measurement_count + 1,
  last_active_at = NOW()
        "#,
      // Insert case
      self.namespace.to_str(),
      self.user_token.as_str(),
      self.app_version,
      self.os_platform,
      self.os_version,
      self.session_duration_seconds,
      self.ip_address,
      // Update case
      self.app_version,
      self.os_platform,
      self.os_version,
      self.session_duration_seconds,
      self.ip_address,
    )
  }

  pub async fn upsert_with_connection(
    &self,
    mysql_connection: &mut PoolConnection<MySql>
  ) -> Result<(), MysqlError<UpsertError>> {
    let _query_result = self.query()
        .execute(&mut **mysql_connection)
        .await?;
    Ok(())
  }
}

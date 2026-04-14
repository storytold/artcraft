use std::marker::PhantomData;

use sqlx::{Executor, MySql};

pub struct MarkImpersonationTokenAsRedeemedArgs<'a, 'c: 'a, E>
  where E: 'a + Executor<'c, Database = MySql>
{
  pub public_impersonation_token: &'a str,
  pub ip_address_redemption: &'a str,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

pub async fn mark_impersonation_token_as_redeemed<'a, 'c, E>(
  args: MarkImpersonationTokenAsRedeemedArgs<'a, 'c, E>,
) -> Result<(), sqlx::Error>
  where E: 'a + Executor<'c, Database = MySql>
{
  sqlx::query!(
    r#"
UPDATE user_impersonation_requests
SET
  is_redeemed = TRUE,
  ip_address_redemption = ?
WHERE public_impersonation_token = ?
    "#,
    args.ip_address_redemption,
    args.public_impersonation_token,
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(())
}

use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::users::UserToken;

/// Look up a user token by exact email address — the last-resort deep-attribution
/// fallback used by the spend-events backfill when a Stripe payment can't be
/// linked any other way (Stripe metadata / wallet ledger / customer links).
/// `email_address` is a unique key, so at most one row matches.
pub struct BackfillGetUserTokenByEmailArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub email_address: &'e str,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

pub async fn backfill_get_user_token_by_email<'e, 'c: 'e, E>(
  args: BackfillGetUserTokenByEmailArgs<'e, 'c, E>,
) -> Result<Option<UserToken>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let row = sqlx::query!(
    r#"
SELECT token AS `token: UserToken`
FROM users
WHERE email_address = ?
LIMIT 1
    "#,
    args.email_address,
  )
    .fetch_optional(args.mysql_executor)
    .await?;

  Ok(row.map(|r| r.token))
}

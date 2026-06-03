use std::marker::PhantomData;

use chrono::{DateTime, NaiveDateTime, Utc};
use sqlx::{Executor, MySql};

use tokens::tokens::users::UserToken;

pub struct ListUserEmailChangesForUserArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  /// The user whose email-change history is being listed.
  pub user_token: &'e UserToken,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

#[derive(Debug)]
pub struct UserEmailChangeRow {
  pub id: u64,
  pub user_token: UserToken,
  pub old_email: String,
  pub new_email: String,
  pub ip_address: String,
  pub maybe_changed_by_user_token: Option<UserToken>,
  pub created_at: DateTime<Utc>,
}

#[derive(Debug)]
struct RawUserEmailChangeRow {
  id: u64,
  user_token: UserToken,
  old_email: String,
  new_email: String,
  ip_address: String,
  maybe_changed_by_user_token: Option<UserToken>,
  created_at: NaiveDateTime,
}

/// Return all `user_email_changes` rows for the given user, newest first.
pub async fn list_user_email_changes_for_user<'e, 'c: 'e, E>(
  args: ListUserEmailChangesForUserArgs<'e, 'c, E>,
) -> Result<Vec<UserEmailChangeRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let rows = sqlx::query_as!(
    RawUserEmailChangeRow,
    r#"
SELECT
  id as `id: u64`,
  user_token as `user_token: tokens::tokens::users::UserToken`,
  old_email,
  new_email,
  ip_address,
  maybe_changed_by_user_token as `maybe_changed_by_user_token: tokens::tokens::users::UserToken`,
  created_at
FROM user_email_changes
WHERE user_token = ?
ORDER BY id DESC
    "#,
    args.user_token.as_str(),
  )
    .fetch_all(args.mysql_executor)
    .await?;

  let results = rows.into_iter().map(|row| {
    UserEmailChangeRow {
      id: row.id,
      user_token: row.user_token,
      old_email: row.old_email,
      new_email: row.new_email,
      ip_address: row.ip_address,
      maybe_changed_by_user_token: row.maybe_changed_by_user_token,
      created_at: row.created_at.and_utc(),
    }
  }).collect();

  Ok(results)
}

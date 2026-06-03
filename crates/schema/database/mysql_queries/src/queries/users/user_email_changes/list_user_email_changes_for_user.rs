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

  // Denormalized display fields for the user whose email was changed.
  pub user_username: String,
  pub user_display_name: String,
  pub user_gravatar_hash: String,

  // Denormalized display fields for the user who performed the change, if
  // there was one. NULL when `maybe_changed_by_user_token` is NULL or when
  // the referenced row has been hard-deleted.
  pub maybe_changed_by_user_username: Option<String>,
  pub maybe_changed_by_user_display_name: Option<String>,
  pub maybe_changed_by_user_gravatar_hash: Option<String>,
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

  user_username: String,
  user_display_name: String,
  user_gravatar_hash: String,

  maybe_changed_by_user_username: Option<String>,
  maybe_changed_by_user_display_name: Option<String>,
  maybe_changed_by_user_gravatar_hash: Option<String>,
}

/// Return all `user_email_changes` rows for the given user, newest first.
///
/// Joins `users` twice to denormalize the username, display name, and
/// gravatar hash for both the subject (`user_token`) and the acting user
/// (`maybe_changed_by_user_token`). The actor join is a LEFT JOIN so rows
/// where there is no acting user (e.g. self-service changes) still come
/// back.
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
  uec.id as `id: u64`,
  uec.user_token as `user_token: tokens::tokens::users::UserToken`,
  uec.old_email,
  uec.new_email,
  uec.ip_address,
  uec.maybe_changed_by_user_token as `maybe_changed_by_user_token: tokens::tokens::users::UserToken`,
  uec.created_at,

  u_subject.username as user_username,
  u_subject.display_name as user_display_name,
  u_subject.email_gravatar_hash as user_gravatar_hash,

  u_changer.username as `maybe_changed_by_user_username?`,
  u_changer.display_name as `maybe_changed_by_user_display_name?`,
  u_changer.email_gravatar_hash as `maybe_changed_by_user_gravatar_hash?`

FROM user_email_changes AS uec
JOIN users AS u_subject
  ON uec.user_token = u_subject.token
LEFT JOIN users AS u_changer
  ON uec.maybe_changed_by_user_token = u_changer.token
WHERE uec.user_token = ?
ORDER BY uec.id DESC
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

      user_username: row.user_username,
      user_display_name: row.user_display_name,
      user_gravatar_hash: row.user_gravatar_hash,

      maybe_changed_by_user_username: row.maybe_changed_by_user_username,
      maybe_changed_by_user_display_name: row.maybe_changed_by_user_display_name,
      maybe_changed_by_user_gravatar_hash: row.maybe_changed_by_user_gravatar_hash,
    }
  }).collect();

  Ok(results)
}

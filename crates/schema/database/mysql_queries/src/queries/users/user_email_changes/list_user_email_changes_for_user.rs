use std::marker::PhantomData;

use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use tokens::tokens::users::UserToken;

pub struct ListUserEmailChangesForUserArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  /// The user whose email-change history is being listed.
  pub user_token: &'e UserToken,

  /// When `Some`, only return rows with `id < maybe_cursor_id`. Used to
  /// page backward through the descending-by-id list.
  pub maybe_cursor_id: Option<u64>,

  /// Maximum number of rows to return.
  pub limit: u32,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

#[derive(Debug)]
pub struct UserEmailChangeRow {
  pub id: u64,
  pub old_email: String,
  pub new_email: String,
  pub ip_address: String,
  pub created_at: DateTime<Utc>,

  /// The user whose email was changed (the subject of the audit row).
  pub user: UserDisplay,

  /// The user who performed the change. `None` for self-service changes
  /// (where `user_email_changes.maybe_changed_by_user_token` is `NULL`) or
  /// when the referenced user row has been hard-deleted.
  pub maybe_changed_by_user: Option<UserDisplay>,
}

/// Denormalized display fields for a `users` row, joined into a query result.
#[derive(Debug)]
pub struct UserDisplay {
  pub token: UserToken,
  pub username: String,
  pub display_name: String,
  pub gravatar_hash: String,
}

#[derive(Debug)]
struct RawUserEmailChangeRow {
  id: u64,
  old_email: String,
  new_email: String,
  ip_address: String,
  created_at: DateTime<Utc>,

  user_token: UserToken,
  user_username: String,
  user_display_name: String,
  user_gravatar_hash: String,

  maybe_changed_by_user_token: Option<UserToken>,
  maybe_changed_by_user_username: Option<String>,
  maybe_changed_by_user_display_name: Option<String>,
  maybe_changed_by_user_gravatar_hash: Option<String>,
}

/// Return `user_email_changes` rows for the given user, newest first,
/// capped at `limit`. When `maybe_cursor_id` is set, only rows with `id`
/// strictly less than the cursor are returned — pass the last id from the
/// previous page to walk backwards through history.
///
/// Joins `users` twice to denormalize the token, username, display name,
/// and gravatar hash for both the subject (`user_token`) and the acting
/// user (`maybe_changed_by_user_token`). The actor join is a LEFT JOIN so
/// rows where there is no acting user (e.g. self-service changes) still
/// come back.
pub async fn list_user_email_changes_for_user<'e, 'c: 'e, E>(
  args: ListUserEmailChangesForUserArgs<'e, 'c, E>,
) -> Result<Vec<UserEmailChangeRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let limit = args.limit as i64;

  // Two query branches because sqlx::query_as! can't accept conditional
  // WHERE clauses at the macro level. `args.mysql_executor` is moved into
  // exactly one arm at runtime — Rust permits this since the arms are
  // mutually exclusive.
  let rows = match args.maybe_cursor_id {
    Some(cursor_id) => {
      sqlx::query_as!(
        RawUserEmailChangeRow,
        r#"
SELECT
  uec.id as `id: u64`,
  uec.old_email,
  uec.new_email,
  uec.ip_address,
  uec.created_at,

  u_subject.token as `user_token: tokens::tokens::users::UserToken`,
  u_subject.username as user_username,
  u_subject.display_name as user_display_name,
  u_subject.email_gravatar_hash as user_gravatar_hash,

  u_changer.token as `maybe_changed_by_user_token?: tokens::tokens::users::UserToken`,
  u_changer.username as `maybe_changed_by_user_username?`,
  u_changer.display_name as `maybe_changed_by_user_display_name?`,
  u_changer.email_gravatar_hash as `maybe_changed_by_user_gravatar_hash?`

FROM user_email_changes AS uec
JOIN users AS u_subject
  ON uec.user_token = u_subject.token
LEFT JOIN users AS u_changer
  ON uec.maybe_changed_by_user_token = u_changer.token
WHERE uec.user_token = ?
  AND uec.id < ?
ORDER BY uec.id DESC
LIMIT ?
        "#,
        args.user_token.as_str(),
        cursor_id,
        limit,
      )
        .fetch_all(args.mysql_executor)
        .await?
    }
    None => {
      sqlx::query_as!(
        RawUserEmailChangeRow,
        r#"
SELECT
  uec.id as `id: u64`,
  uec.old_email,
  uec.new_email,
  uec.ip_address,
  uec.created_at,

  u_subject.token as `user_token: tokens::tokens::users::UserToken`,
  u_subject.username as user_username,
  u_subject.display_name as user_display_name,
  u_subject.email_gravatar_hash as user_gravatar_hash,

  u_changer.token as `maybe_changed_by_user_token?: tokens::tokens::users::UserToken`,
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
LIMIT ?
        "#,
        args.user_token.as_str(),
        limit,
      )
        .fetch_all(args.mysql_executor)
        .await?
    }
  };

  let results = rows.into_iter().map(|row| {
    let user = UserDisplay {
      token: row.user_token,
      username: row.user_username,
      display_name: row.user_display_name,
      gravatar_hash: row.user_gravatar_hash,
    };

    // The four actor columns come from the same LEFT JOIN row, so they are
    // either all `Some` (matched user row) or all `None` (no actor token or
    // the user row was hard-deleted) together.
    let maybe_changed_by_user = match (
      row.maybe_changed_by_user_token,
      row.maybe_changed_by_user_username,
      row.maybe_changed_by_user_display_name,
      row.maybe_changed_by_user_gravatar_hash,
    ) {
      (Some(token), Some(username), Some(display_name), Some(gravatar_hash)) => Some(UserDisplay {
        token,
        username,
        display_name,
        gravatar_hash,
      }),
      _ => None,
    };

    UserEmailChangeRow {
      id: row.id,
      old_email: row.old_email,
      new_email: row.new_email,
      ip_address: row.ip_address,
      created_at: row.created_at,
      user,
      maybe_changed_by_user,
    }
  }).collect();

  Ok(results)
}

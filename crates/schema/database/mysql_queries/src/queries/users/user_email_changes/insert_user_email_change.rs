use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::users::UserToken;

pub struct InsertUserEmailChangeArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  /// The user whose email was changed.
  pub user_token: &'e UserToken,

  /// The email address before the change.
  pub old_email: &'e str,

  /// The email address after the change.
  pub new_email: &'e str,

  /// The IP address the change was made from.
  pub ip_address: &'e str,

  /// The user that performed the change, if known. `None` when the change
  /// was performed by the user themselves, by an automated process, or in
  /// any other context where there is no acting user.
  pub maybe_changed_by_user_token: Option<&'e UserToken>,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Insert a single `user_email_changes` row recording an email-address change.
pub async fn insert_user_email_change<'e, 'c: 'e, E>(
  args: InsertUserEmailChangeArgs<'e, 'c, E>,
) -> Result<(), sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  sqlx::query!(
    r#"
INSERT INTO user_email_changes
SET
  user_token = ?,
  old_email = ?,
  new_email = ?,
  ip_address = ?,
  maybe_changed_by_user_token = ?
    "#,
    args.user_token.as_str(),
    args.old_email,
    args.new_email,
    args.ip_address,
    args.maybe_changed_by_user_token.map(|t| t.as_str()),
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(())
}

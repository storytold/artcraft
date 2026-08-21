use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::tags::TagToken;
use tokens::tokens::users::UserToken;

pub struct RenameTagArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub tag_token: &'e TagToken,
  pub creator_user_token: &'e UserToken,
  pub new_tag_value: &'e str,
  pub new_tag_value_lowercase: &'e str,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Rename a tag, scoped to its creator. Handles both case-only changes
/// (same lowercase) and wholesale renames with the one UPDATE. If the
/// user already has a different tag with the same
/// `tag_value_lowercase`, the unique key rejects the rename — callers
/// should map that duplicate-key `sqlx::Error` to a 400. Returns the
/// number of rows updated (0 = not found / not owned / already deleted).
pub async fn rename_tag<'e, 'c: 'e, E>(
  args: RenameTagArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
UPDATE tags
SET tag_value = ?,
  tag_value_lowercase = ?
WHERE token = ?
  AND creator_user_token = ?
  AND maybe_deleted_at IS NULL
    "#,
    args.new_tag_value,
    args.new_tag_value_lowercase,
    args.tag_token.as_str(),
    args.creator_user_token.as_str(),
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(result.rows_affected())
}

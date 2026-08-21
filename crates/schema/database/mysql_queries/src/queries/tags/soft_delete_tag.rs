use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::tags::TagToken;
use tokens::tokens::users::UserToken;

pub struct SoftDeleteTagArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub tag_token: &'e TagToken,
  pub creator_user_token: &'e UserToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Soft-delete a tag, scoped to its creator. The caller is expected to
/// have already hard-deleted the tag's media-file links
/// (`delete_media_file_tags_for_tag`), so `use_count` is zeroed here.
/// Returns the number of rows updated (0 = not found / not owned /
/// already deleted).
pub async fn soft_delete_tag<'e, 'c: 'e, E>(
  args: SoftDeleteTagArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
UPDATE tags
SET maybe_deleted_at = NOW(),
  use_count = 0
WHERE token = ?
  AND creator_user_token = ?
  AND maybe_deleted_at IS NULL
    "#,
    args.tag_token.as_str(),
    args.creator_user_token.as_str(),
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(result.rows_affected())
}

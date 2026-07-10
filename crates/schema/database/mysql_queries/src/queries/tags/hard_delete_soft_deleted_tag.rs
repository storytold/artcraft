use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::tags::TagToken;
use tokens::tokens::users::UserToken;

pub struct HardDeleteSoftDeletedTagArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub tag_token: &'e TagToken,
  pub creator_user_token: &'e UserToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Hard-delete a tag row that is ALREADY soft-deleted, freeing its
/// `(tag_value_lowercase, creator_user_token)` unique-key slot so a
/// rename can take the value over. Refuses to touch live tags — the
/// `maybe_deleted_at IS NOT NULL` predicate makes a stale token a
/// no-op. Callers should remove the tag's `media_file_tags` links first
/// (`delete_media_file_tags_for_tag`).
pub async fn hard_delete_soft_deleted_tag<'e, 'c: 'e, E>(
  args: HardDeleteSoftDeletedTagArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
DELETE FROM tags
WHERE token = ?
  AND creator_user_token = ?
  AND maybe_deleted_at IS NOT NULL
    "#,
    args.tag_token.as_str(),
    args.creator_user_token.as_str(),
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(result.rows_affected())
}

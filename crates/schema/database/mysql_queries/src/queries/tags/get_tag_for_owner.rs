use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::tags::TagToken;
use tokens::tokens::users::UserToken;

use crate::queries::tags::tag_row::TagRow;

pub struct GetTagForOwnerArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub tag_token: &'e TagToken,
  pub creator_user_token: &'e UserToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Fetch a single (live) tag by token, scoped to its creator. Returns
/// `Ok(None)` if the tag doesn't exist, is soft-deleted, or belongs to a
/// different user (don't leak existence of others' tags).
pub async fn get_tag_for_owner<'e, 'c: 'e, E>(
  args: GetTagForOwnerArgs<'e, 'c, E>,
) -> Result<Option<TagRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
SELECT
  id as `id: u64`,
  token as `token: TagToken`,
  tag_value,
  tag_value_lowercase,
  use_count as `use_count: u32`
FROM tags
WHERE token = ?
  AND creator_user_token = ?
  AND maybe_deleted_at IS NULL
LIMIT 1
    "#,
    args.tag_token.as_str(),
    args.creator_user_token.as_str(),
  )
    .fetch_optional(args.mysql_executor)
    .await?;

  Ok(result.map(|r| TagRow {
    id: r.id,
    token: r.token,
    tag_value: r.tag_value,
    tag_value_lowercase: r.tag_value_lowercase,
    use_count: r.use_count,
  }))
}

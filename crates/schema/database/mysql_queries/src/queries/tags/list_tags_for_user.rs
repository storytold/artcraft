use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::tags::TagToken;
use tokens::tokens::users::UserToken;

use crate::queries::tags::tag_row::TagRow;

pub struct ListTagsForUserArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub creator_user_token: &'e UserToken,
  pub maybe_cursor_id: Option<u64>,
  pub limit: u32,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Paginated list of the user's (live) tags, newest first
/// (`tags.id` descending; the id doubles as the cursor).
pub async fn list_tags_for_user<'e, 'c: 'e, E>(
  args: ListTagsForUserArgs<'e, 'c, E>,
) -> Result<Vec<TagRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  // No-cursor requests use a sentinel of u64::MAX — every id matches,
  // which keeps this to a single static query.
  let cursor_id = args.maybe_cursor_id.unwrap_or(u64::MAX);
  let limit = args.limit as i64;

  let rows = sqlx::query!(
    r#"
SELECT
  id as `id: u64`,
  token as `token: TagToken`,
  tag_value,
  tag_value_lowercase,
  use_count as `use_count: u32`
FROM tags
WHERE creator_user_token = ?
  AND maybe_deleted_at IS NULL
  AND id < ?
ORDER BY id DESC
LIMIT ?
    "#,
    args.creator_user_token.as_str(),
    cursor_id,
    limit,
  )
    .fetch_all(args.mysql_executor)
    .await?;

  Ok(rows.into_iter()
    .map(|r| TagRow {
      id: r.id,
      token: r.token,
      tag_value: r.tag_value,
      tag_value_lowercase: r.tag_value_lowercase,
      use_count: r.use_count,
    })
    .collect())
}

use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::tags::TagToken;

use crate::queries::tags::tag_row::TagRow;

pub struct ListTagsForMediaFileArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub media_file_token: &'e MediaFileToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// All (live) tags on a media file, sorted by tag value. Not paginated —
/// tag counts per file are small. Not scoped to any user: per-file tags
/// are publicly visible.
pub async fn list_tags_for_media_file<'e, 'c: 'e, E>(
  args: ListTagsForMediaFileArgs<'e, 'c, E>,
) -> Result<Vec<TagRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let rows = sqlx::query!(
    r#"
SELECT
  t.id as `id: u64`,
  t.token as `token: TagToken`,
  t.tag_value,
  t.tag_value_lowercase,
  t.use_count as `use_count: u32`
FROM media_file_tags mft
JOIN tags t
  ON t.token = mft.tag_token
WHERE mft.media_file_token = ?
  AND t.maybe_deleted_at IS NULL
ORDER BY t.tag_value_lowercase ASC
    "#,
    args.media_file_token.as_str(),
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

use std::marker::PhantomData;

use sqlx::{Executor, MySql, QueryBuilder, Row};

use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::tags::TagToken;

/// One (media file, tag) pairing from the bulk lookup. The same tag can
/// appear under many media files.
#[derive(Debug, Clone)]
pub struct MediaFileTagPairRow {
  pub media_file_token: MediaFileToken,
  pub tag_token: TagToken,
  pub tag_value: String,
  pub tag_value_lowercase: String,
  pub use_count: u32,
}

pub struct BulkListTagsForMediaFilesArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub media_file_tokens: &'e [MediaFileToken],
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// All (live) tags on each of the given media files, in one round-trip.
/// Media files with no tags simply produce no rows. Not scoped to any
/// user: per-file tags are publicly visible.
pub async fn bulk_list_tags_for_media_files<'e, 'c: 'e, E>(
  args: BulkListTagsForMediaFilesArgs<'e, 'c, E>,
) -> Result<Vec<MediaFileTagPairRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  if args.media_file_tokens.is_empty() {
    return Ok(Vec::new());
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "SELECT mft.media_file_token, t.token, t.tag_value, t.tag_value_lowercase, t.use_count \
     FROM media_file_tags mft \
     JOIN tags t ON t.token = mft.tag_token \
     WHERE t.maybe_deleted_at IS NULL AND mft.media_file_token IN (",
  );

  let mut separated = builder.separated(", ");
  for token in args.media_file_tokens {
    separated.push_bind(token.as_str());
  }
  separated.push_unseparated(")");

  let rows = builder.build().fetch_all(args.mysql_executor).await?;

  Ok(rows.into_iter()
    .map(|row| MediaFileTagPairRow {
      media_file_token: MediaFileToken::new(row.get::<String, _>(0)),
      tag_token: TagToken::new(row.get::<String, _>(1)),
      tag_value: row.get::<String, _>(2),
      tag_value_lowercase: row.get::<String, _>(3),
      use_count: row.get::<u32, _>(4),
    })
    .collect())
}

use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::tags::TagToken;

pub struct ListTagTokensForMediaFileArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub media_file_token: &'e MediaFileToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// The distinct tag tokens linked to a media file, across ALL users
/// (unlike `list_linked_tag_tokens_for_media_files`, which is scoped to
/// one user's links). Used by media-file delete/undelete to know which
/// tags need their `use_count` recounted.
pub async fn list_tag_tokens_for_media_file<'e, 'c: 'e, E>(
  args: ListTagTokensForMediaFileArgs<'e, 'c, E>,
) -> Result<Vec<TagToken>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let rows = sqlx::query!(
    r#"
SELECT DISTINCT tag_token as `tag_token: TagToken`
FROM media_file_tags
WHERE media_file_token = ?
    "#,
    args.media_file_token.as_str(),
  )
    .fetch_all(args.mysql_executor)
    .await?;

  Ok(rows.into_iter().map(|r| r.tag_token).collect())
}

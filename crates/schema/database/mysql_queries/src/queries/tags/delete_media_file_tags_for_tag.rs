use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::tags::TagToken;

pub struct DeleteMediaFileTagsForTagArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub tag_token: &'e TagToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Hard-delete every media-file link for a tag, across all media files.
/// Used when the tag itself is being deleted. Returns the number of
/// links deleted.
pub async fn delete_media_file_tags_for_tag<'e, 'c: 'e, E>(
  args: DeleteMediaFileTagsForTagArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"DELETE FROM media_file_tags WHERE tag_token = ?"#,
    args.tag_token.as_str(),
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(result.rows_affected())
}

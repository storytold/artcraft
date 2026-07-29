use std::marker::PhantomData;

use sqlx::{Executor, MySql, QueryBuilder};

use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::tags::TagToken;
use tokens::tokens::users::UserToken;

pub struct DeleteMediaFileTagsNotInSetArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub media_file_tokens: &'e [MediaFileToken],
  pub keep_tag_tokens: &'e [TagToken],
  pub user_token: &'e UserToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Hard-delete the user's tag links on the given media files, EXCEPT
/// links whose tag is in `keep_tag_tokens`. This is the "remove what
/// wasn't mentioned" half of the set-tags endpoints. Returns the number
/// of links deleted. (Tags orphaned by this are not deleted.)
///
/// `keep_tag_tokens` must be non-empty — to remove everything, use
/// `clear_media_file_tags` instead (an empty NOT IN list is invalid SQL).
pub async fn delete_media_file_tags_not_in_set<'e, 'c: 'e, E>(
  args: DeleteMediaFileTagsNotInSetArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  if args.media_file_tokens.is_empty() || args.keep_tag_tokens.is_empty() {
    return Ok(0);
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "DELETE FROM media_file_tags WHERE user_token = ",
  );
  builder.push_bind(args.user_token.as_str());

  builder.push(" AND media_file_token IN (");
  let mut separated = builder.separated(", ");
  for token in args.media_file_tokens {
    separated.push_bind(token.as_str());
  }
  separated.push_unseparated(")");

  builder.push(" AND tag_token NOT IN (");
  let mut separated = builder.separated(", ");
  for token in args.keep_tag_tokens {
    separated.push_bind(token.as_str());
  }
  separated.push_unseparated(")");

  let result = builder.build().execute(args.mysql_executor).await?;
  Ok(result.rows_affected())
}

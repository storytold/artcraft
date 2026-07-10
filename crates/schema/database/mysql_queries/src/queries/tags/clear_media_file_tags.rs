use std::marker::PhantomData;

use sqlx::{Executor, MySql, QueryBuilder};

use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

pub struct ClearMediaFileTagsArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub media_file_tokens: &'e [MediaFileToken],
  pub user_token: &'e UserToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Hard-delete ALL of the user's tag links on the given media files.
/// Backs the clear endpoint, and the set endpoints when the requested
/// tag set is empty. Returns the number of links deleted. (Tags orphaned
/// by this are not deleted.)
pub async fn clear_media_file_tags<'e, 'c: 'e, E>(
  args: ClearMediaFileTagsArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  if args.media_file_tokens.is_empty() {
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

  let result = builder.build().execute(args.mysql_executor).await?;
  Ok(result.rows_affected())
}

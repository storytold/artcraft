use std::marker::PhantomData;

use sqlx::{Executor, MySql, QueryBuilder, Row};

use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::tags::TagToken;
use tokens::tokens::users::UserToken;

pub struct ListLinkedTagTokensForMediaFilesArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub media_file_tokens: &'e [MediaFileToken],
  pub user_token: &'e UserToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// The distinct tag tokens the user currently has linked to the given
/// media files. Called before a destructive set/clear so we know which
/// tags need their `use_count` recounted afterwards.
pub async fn list_linked_tag_tokens_for_media_files<'e, 'c: 'e, E>(
  args: ListLinkedTagTokensForMediaFilesArgs<'e, 'c, E>,
) -> Result<Vec<TagToken>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  if args.media_file_tokens.is_empty() {
    return Ok(Vec::new());
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "SELECT DISTINCT tag_token FROM media_file_tags WHERE user_token = ",
  );
  builder.push_bind(args.user_token.as_str());

  builder.push(" AND media_file_token IN (");
  let mut separated = builder.separated(", ");
  for token in args.media_file_tokens {
    separated.push_bind(token.as_str());
  }
  separated.push_unseparated(")");

  let rows = builder.build().fetch_all(args.mysql_executor).await?;

  Ok(rows.into_iter()
    .map(|row| TagToken::new(row.get::<String, _>(0)))
    .collect())
}

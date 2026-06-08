use std::marker::PhantomData;

use sqlx::{Executor, MySql, QueryBuilder, Row};

use tokens::tokens::media_files::MediaFileToken;

pub struct FilterExistingMediaFileTokensArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub candidate_tokens: &'e [MediaFileToken],
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Return only the input tokens that currently exist and aren't
/// soft-deleted (no user_deleted_at or mod_deleted_at).
pub async fn filter_existing_media_file_tokens<'e, 'c: 'e, E>(
  args: FilterExistingMediaFileTokensArgs<'e, 'c, E>,
) -> Result<Vec<MediaFileToken>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  if args.candidate_tokens.is_empty() {
    return Ok(Vec::new());
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "SELECT token FROM media_files WHERE user_deleted_at IS NULL \
       AND mod_deleted_at IS NULL AND token IN (",
  );

  let mut separated = builder.separated(", ");
  for token in args.candidate_tokens {
    separated.push_bind(token.as_str());
  }
  separated.push_unseparated(")");

  let rows = builder.build().fetch_all(args.mysql_executor).await?;

  Ok(rows.into_iter()
    .map(|row| MediaFileToken::new(row.get::<String, _>(0)))
    .collect())
}

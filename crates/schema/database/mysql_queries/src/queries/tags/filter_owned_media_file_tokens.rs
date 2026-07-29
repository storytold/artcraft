use std::marker::PhantomData;

use sqlx::{Executor, MySql, QueryBuilder, Row};

use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

pub struct FilterOwnedMediaFileTokensArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub candidate_tokens: &'e [MediaFileToken],
  pub owner_user_token: &'e UserToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Return only the input tokens that exist, aren't soft-deleted, and are
/// owned (created) by the given user. Tagging endpoints run their inputs
/// through this — for now only a media file's creator may tag it.
pub async fn filter_owned_media_file_tokens<'e, 'c: 'e, E>(
  args: FilterOwnedMediaFileTokensArgs<'e, 'c, E>,
) -> Result<Vec<MediaFileToken>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  if args.candidate_tokens.is_empty() {
    return Ok(Vec::new());
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "SELECT token FROM media_files \
     WHERE maybe_creator_user_token = ",
  );
  builder.push_bind(args.owner_user_token.as_str());
  builder.push(
    " AND user_deleted_at IS NULL AND mod_deleted_at IS NULL AND token IN (",
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

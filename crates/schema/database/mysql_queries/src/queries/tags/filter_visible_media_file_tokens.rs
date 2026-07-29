use std::marker::PhantomData;

use sqlx::{Executor, MySql, QueryBuilder, Row};

use enums::common::visibility::Visibility;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

pub struct FilterVisibleMediaFileTokensArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub candidate_tokens: &'e [MediaFileToken],
  pub requester_user_token: &'e UserToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Return only the input tokens whose media file exists, isn't
/// soft-deleted, and whose tags the requester may see: any non-private
/// file (public and hidden files are viewable by anyone with the URL),
/// or the requester's own files.
pub async fn filter_visible_media_file_tokens<'e, 'c: 'e, E>(
  args: FilterVisibleMediaFileTokensArgs<'e, 'c, E>,
) -> Result<Vec<MediaFileToken>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  if args.candidate_tokens.is_empty() {
    return Ok(Vec::new());
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "SELECT token FROM media_files \
     WHERE user_deleted_at IS NULL \
       AND mod_deleted_at IS NULL \
       AND (creator_set_visibility != ",
  );
  builder.push_bind(Visibility::Private.to_str());
  builder.push(" OR maybe_creator_user_token = ");
  builder.push_bind(args.requester_user_token.as_str());
  builder.push(") AND token IN (");

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

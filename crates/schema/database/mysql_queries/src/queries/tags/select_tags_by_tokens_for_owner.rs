use std::marker::PhantomData;

use sqlx::{Executor, MySql, QueryBuilder, Row};

use tokens::tokens::tags::TagToken;
use tokens::tokens::users::UserToken;

use crate::queries::tags::tag_row::TagRow;

pub struct SelectTagsByTokensForOwnerArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub tag_tokens: &'e [TagToken],
  pub creator_user_token: &'e UserToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Look up a user's (live) tags by token. Used to re-read fresh
/// `use_count` values for a response after a recount.
pub async fn select_tags_by_tokens_for_owner<'e, 'c: 'e, E>(
  args: SelectTagsByTokensForOwnerArgs<'e, 'c, E>,
) -> Result<Vec<TagRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  if args.tag_tokens.is_empty() {
    return Ok(Vec::new());
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "SELECT id, token, tag_value, tag_value_lowercase, use_count \
     FROM tags \
     WHERE creator_user_token = ",
  );
  builder.push_bind(args.creator_user_token.as_str());
  builder.push(" AND maybe_deleted_at IS NULL AND token IN (");

  let mut separated = builder.separated(", ");
  for token in args.tag_tokens {
    separated.push_bind(token.as_str());
  }
  separated.push_unseparated(")");

  let rows = builder.build().fetch_all(args.mysql_executor).await?;

  Ok(rows.into_iter()
    .map(|row| TagRow {
      id: row.get::<u64, _>(0),
      token: TagToken::new(row.get::<String, _>(1)),
      tag_value: row.get::<String, _>(2),
      tag_value_lowercase: row.get::<String, _>(3),
      use_count: row.get::<u32, _>(4),
    })
    .collect())
}

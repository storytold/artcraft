use std::marker::PhantomData;

use sqlx::{Executor, MySql, QueryBuilder, Row};

use tokens::tokens::tags::TagToken;
use tokens::tokens::users::UserToken;

use crate::queries::tags::tag_row::TagRow;

pub struct SelectTagsByLowercaseValuesArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub tag_values_lowercase: &'e [String],
  pub creator_user_token: &'e UserToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Look up a user's (live) tags by their lowercased values. Used after
/// `upsert_tags` to resolve the canonical tokens for the batch.
pub async fn select_tags_by_lowercase_values<'e, 'c: 'e, E>(
  args: SelectTagsByLowercaseValuesArgs<'e, 'c, E>,
) -> Result<Vec<TagRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  if args.tag_values_lowercase.is_empty() {
    return Ok(Vec::new());
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "SELECT id, token, tag_value, tag_value_lowercase, use_count \
     FROM tags \
     WHERE creator_user_token = ",
  );
  builder.push_bind(args.creator_user_token.as_str());
  builder.push(" AND maybe_deleted_at IS NULL AND tag_value_lowercase IN (");

  let mut separated = builder.separated(", ");
  for value in args.tag_values_lowercase {
    separated.push_bind(value.as_str());
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

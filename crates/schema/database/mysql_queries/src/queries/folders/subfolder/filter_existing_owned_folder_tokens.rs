use std::marker::PhantomData;

use sqlx::{Executor, MySql, QueryBuilder, Row};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::users::UserToken;

pub struct FilterExistingOwnedFolderTokensArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub candidate_tokens: &'e [FolderToken],
  pub owner_user_token: &'e UserToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Given an input set of candidate folder tokens, return only those that
/// currently exist, are owned by the given user, and are not soft-deleted.
/// Order of the result is unspecified.
///
/// Uses runtime `QueryBuilder` because the IN-list size is dynamic and the
/// macro form can't express that.
pub async fn filter_existing_owned_folder_tokens<'e, 'c: 'e, E>(
  args: FilterExistingOwnedFolderTokensArgs<'e, 'c, E>,
) -> Result<Vec<FolderToken>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  if args.candidate_tokens.is_empty() {
    return Ok(Vec::new());
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "SELECT token FROM folders WHERE owner_user_token = ",
  );
  builder.push_bind(args.owner_user_token.as_str());
  builder.push(" AND maybe_deleted_at IS NULL AND token IN (");

  let mut separated = builder.separated(", ");
  for token in args.candidate_tokens {
    separated.push_bind(token.as_str());
  }
  separated.push_unseparated(")");

  let rows = builder.build().fetch_all(args.mysql_executor).await?;

  Ok(rows.into_iter()
    .map(|row| FolderToken::new(row.get::<String, _>(0)))
    .collect())
}

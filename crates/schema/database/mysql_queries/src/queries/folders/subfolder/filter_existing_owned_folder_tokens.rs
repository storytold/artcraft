use sqlx::{MySql, MySqlPool, QueryBuilder, Row};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::users::UserToken;

/// Given an input set of candidate folder tokens, return only those that
/// currently exist, are owned by the given user, and are not soft-deleted.
/// Order of the result is unspecified.
///
/// Uses runtime `QueryBuilder` because the IN-list size is dynamic and the
/// macro form can't express that.
pub async fn filter_existing_owned_folder_tokens(
  candidate_tokens: &[FolderToken],
  owner_user_token: &UserToken,
  pool: &MySqlPool,
) -> Result<Vec<FolderToken>, sqlx::Error> {
  if candidate_tokens.is_empty() {
    return Ok(Vec::new());
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "SELECT token FROM folders WHERE owner_user_token = ",
  );
  builder.push_bind(owner_user_token.as_str());
  builder.push(" AND maybe_deleted_at IS NULL AND token IN (");

  let mut separated = builder.separated(", ");
  for token in candidate_tokens {
    separated.push_bind(token.as_str());
  }
  separated.push_unseparated(")");

  let rows = builder.build().fetch_all(pool).await?;

  Ok(rows.into_iter()
    .map(|row| FolderToken::new(row.get::<String, _>(0)))
    .collect())
}

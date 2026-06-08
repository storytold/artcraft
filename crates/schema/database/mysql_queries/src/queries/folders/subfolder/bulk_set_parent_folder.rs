use sqlx::{MySql, MySqlPool, QueryBuilder};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::users::UserToken;

/// Set `maybe_parent_folder_token = new_parent_token` on every owned,
/// live folder whose token is in `child_tokens` AND that isn't the parent
/// itself (a folder can't be its own parent).
///
/// Returns the number of rows affected.
///
/// Idempotent: if a row already has the desired parent, MySQL reports it
/// as not-changed but still as matched — `rows_affected()` reflects the
/// number of rows that actually changed.
pub async fn bulk_set_parent_folder(
  child_tokens: &[FolderToken],
  new_parent_token: &FolderToken,
  owner_user_token: &UserToken,
  pool: &MySqlPool,
) -> Result<u64, sqlx::Error> {
  if child_tokens.is_empty() {
    return Ok(0);
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "UPDATE folders SET maybe_parent_folder_token = ",
  );
  builder.push_bind(new_parent_token.as_str());
  builder.push(" WHERE owner_user_token = ");
  builder.push_bind(owner_user_token.as_str());
  builder.push(" AND maybe_deleted_at IS NULL AND token != ");
  builder.push_bind(new_parent_token.as_str());
  builder.push(" AND token IN (");

  let mut separated = builder.separated(", ");
  for token in child_tokens {
    separated.push_bind(token.as_str());
  }
  separated.push_unseparated(")");

  let result = builder.build().execute(pool).await?;
  Ok(result.rows_affected())
}

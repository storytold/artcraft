use sqlx::{MySql, MySqlPool, QueryBuilder};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::users::UserToken;

/// Clear `maybe_parent_folder_token` (set to NULL) on every owned, live
/// folder whose token is in `child_tokens` AND whose current parent is
/// the given `from_parent_token`. The parent guard makes the operation
/// safe to run idempotently — it won't accidentally unparent a folder
/// that's actually a child of a different parent.
///
/// Returns the number of rows affected.
pub async fn bulk_clear_parent_folder(
  child_tokens: &[FolderToken],
  from_parent_token: &FolderToken,
  owner_user_token: &UserToken,
  pool: &MySqlPool,
) -> Result<u64, sqlx::Error> {
  if child_tokens.is_empty() {
    return Ok(0);
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "UPDATE folders SET maybe_parent_folder_token = NULL WHERE owner_user_token = ",
  );
  builder.push_bind(owner_user_token.as_str());
  builder.push(" AND maybe_deleted_at IS NULL AND maybe_parent_folder_token = ");
  builder.push_bind(from_parent_token.as_str());
  builder.push(" AND token IN (");

  let mut separated = builder.separated(", ");
  for token in child_tokens {
    separated.push_bind(token.as_str());
  }
  separated.push_unseparated(")");

  let result = builder.build().execute(pool).await?;
  Ok(result.rows_affected())
}

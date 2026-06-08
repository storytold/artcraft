use std::marker::PhantomData;

use sqlx::{Executor, MySql, QueryBuilder};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::users::UserToken;

pub struct BulkSetParentFolderArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub child_tokens: &'e [FolderToken],
  pub new_parent_token: &'e FolderToken,
  pub owner_user_token: &'e UserToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Set `maybe_parent_folder_token = new_parent_token` on every owned,
/// live folder whose token is in `child_tokens` AND that isn't the parent
/// itself (a folder can't be its own parent). Returns the number of rows
/// whose value actually changed.
///
/// Self-referential parenting is prevented at two layers:
///   * Rust-side: the parent is filtered out of the candidate list
///     before the SQL is built.
///   * SQL-side: the WHERE clause includes `AND token != new_parent_token`
///     as a defense-in-depth guard.
pub async fn bulk_set_parent_folder<'e, 'c: 'e, E>(
  args: BulkSetParentFolderArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  // Drop the parent from the candidate list. This makes the function
  // self-protecting — callers don't have to remember to filter — and
  // pairs with the SQL `token != new_parent_token` guard below.
  let new_parent_str = args.new_parent_token.as_str();

  let filtered_children: Vec<&FolderToken> = args.child_tokens
    .iter()
    .filter(|t| t.as_str() != new_parent_str)
    .collect();

  if filtered_children.is_empty() {
    return Ok(0);
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "UPDATE folders SET maybe_parent_folder_token = ",
  );
  builder.push_bind(new_parent_str);
  builder.push(" WHERE owner_user_token = ");
  builder.push_bind(args.owner_user_token.as_str());
  builder.push(" AND maybe_deleted_at IS NULL AND token != ");
  builder.push_bind(new_parent_str);
  builder.push(" AND token IN (");

  let mut separated = builder.separated(", ");
  for token in filtered_children {
    separated.push_bind(token.as_str());
  }
  separated.push_unseparated(")");

  let result = builder.build().execute(args.mysql_executor).await?;
  Ok(result.rows_affected())
}

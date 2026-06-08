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
/// itself. Returns the number of rows whose value actually changed.
pub async fn bulk_set_parent_folder<'e, 'c: 'e, E>(
  args: BulkSetParentFolderArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  if args.child_tokens.is_empty() {
    return Ok(0);
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "UPDATE folders SET maybe_parent_folder_token = ",
  );
  builder.push_bind(args.new_parent_token.as_str());
  builder.push(" WHERE owner_user_token = ");
  builder.push_bind(args.owner_user_token.as_str());
  builder.push(" AND maybe_deleted_at IS NULL AND token != ");
  builder.push_bind(args.new_parent_token.as_str());
  builder.push(" AND token IN (");

  let mut separated = builder.separated(", ");
  for token in args.child_tokens {
    separated.push_bind(token.as_str());
  }
  separated.push_unseparated(")");

  let result = builder.build().execute(args.mysql_executor).await?;
  Ok(result.rows_affected())
}

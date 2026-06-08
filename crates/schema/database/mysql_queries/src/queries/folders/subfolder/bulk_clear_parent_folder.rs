use std::marker::PhantomData;

use sqlx::{Executor, MySql, QueryBuilder};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::users::UserToken;

pub struct BulkClearParentFolderArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub child_tokens: &'e [FolderToken],
  pub from_parent_token: &'e FolderToken,
  pub owner_user_token: &'e UserToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Clear `maybe_parent_folder_token` (set to NULL) on every owned, live
/// folder whose token is in `child_tokens` AND whose current parent is
/// `from_parent_token`. The parent guard makes the operation safe to run
/// idempotently — it won't accidentally unparent a folder that's a child
/// of a different parent.
pub async fn bulk_clear_parent_folder<'e, 'c: 'e, E>(
  args: BulkClearParentFolderArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  if args.child_tokens.is_empty() {
    return Ok(0);
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "UPDATE folders SET maybe_parent_folder_token = NULL WHERE owner_user_token = ",
  );
  builder.push_bind(args.owner_user_token.as_str());
  builder.push(" AND maybe_deleted_at IS NULL AND maybe_parent_folder_token = ");
  builder.push_bind(args.from_parent_token.as_str());
  builder.push(" AND token IN (");

  let mut separated = builder.separated(", ");
  for token in args.child_tokens {
    separated.push_bind(token.as_str());
  }
  separated.push_unseparated(")");

  let result = builder.build().execute(args.mysql_executor).await?;
  Ok(result.rows_affected())
}

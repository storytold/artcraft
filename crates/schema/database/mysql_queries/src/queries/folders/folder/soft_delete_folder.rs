use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::users::UserToken;

pub struct SoftDeleteFolderArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub folder_token: &'e FolderToken,
  pub owner_user_token: &'e UserToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Mark a folder as deleted by stamping `maybe_deleted_at`. Children
/// retain their `maybe_parent_folder_token` and become "orphaned" — that
/// state is surfaced by the list query's `is_orphaned` flag.
pub async fn soft_delete_folder<'e, 'c: 'e, E>(
  args: SoftDeleteFolderArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
UPDATE folders
SET maybe_deleted_at = NOW()
WHERE token = ?
  AND owner_user_token = ?
  AND maybe_deleted_at IS NULL
LIMIT 1
    "#,
    args.folder_token.as_str(),
    args.owner_user_token.as_str(),
  )
    .execute(args.mysql_executor)
    .await?;
  Ok(result.rows_affected())
}

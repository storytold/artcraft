use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::users::UserToken;

pub struct UpdateFolderNameArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub folder_token: &'e FolderToken,
  pub owner_user_token: &'e UserToken,
  pub new_name: &'e str,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Rename a folder. Scoped to owner so callers can't rename a folder they
/// don't own. Returns the number of rows updated (0 if no live folder
/// matched).
pub async fn update_folder_name<'e, 'c: 'e, E>(
  args: UpdateFolderNameArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
UPDATE folders
SET name = ?
WHERE token = ?
  AND owner_user_token = ?
  AND maybe_deleted_at IS NULL
LIMIT 1
    "#,
    args.new_name,
    args.folder_token.as_str(),
    args.owner_user_token.as_str(),
  )
    .execute(args.mysql_executor)
    .await?;
  Ok(result.rows_affected())
}

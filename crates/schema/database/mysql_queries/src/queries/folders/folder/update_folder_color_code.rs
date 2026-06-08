use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::users::UserToken;

pub struct UpdateFolderColorCodeArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub folder_token: &'e FolderToken,
  pub owner_user_token: &'e UserToken,
  pub maybe_color_code: Option<&'e str>,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Set or clear (`None`) the color code on a folder.
pub async fn update_folder_color_code<'e, 'c: 'e, E>(
  args: UpdateFolderColorCodeArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
UPDATE folders
SET maybe_color_code = ?
WHERE token = ?
  AND owner_user_token = ?
  AND maybe_deleted_at IS NULL
LIMIT 1
    "#,
    args.maybe_color_code,
    args.folder_token.as_str(),
    args.owner_user_token.as_str(),
  )
    .execute(args.mysql_executor)
    .await?;
  Ok(result.rows_affected())
}

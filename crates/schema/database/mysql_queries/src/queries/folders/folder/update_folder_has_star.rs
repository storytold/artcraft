use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::users::UserToken;

pub struct UpdateFolderHasStarArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub folder_token: &'e FolderToken,
  pub owner_user_token: &'e UserToken,
  pub has_star: bool,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

pub async fn update_folder_has_star<'e, 'c: 'e, E>(
  args: UpdateFolderHasStarArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
UPDATE folders
SET has_star = ?
WHERE token = ?
  AND owner_user_token = ?
  AND maybe_deleted_at IS NULL
LIMIT 1
    "#,
    args.has_star,
    args.folder_token.as_str(),
    args.owner_user_token.as_str(),
  )
    .execute(args.mysql_executor)
    .await?;
  Ok(result.rows_affected())
}

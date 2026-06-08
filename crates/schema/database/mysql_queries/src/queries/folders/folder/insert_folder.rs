use sqlx::MySqlPool;

use tokens::tokens::folders::FolderToken;
use tokens::tokens::users::UserToken;

pub struct InsertFolderArgs<'a> {
  pub token: &'a FolderToken,
  pub name: &'a str,
  pub owner_user_token: &'a UserToken,
  pub maybe_parent_folder_token: Option<&'a FolderToken>,
  pub maybe_color_code: Option<&'a str>,
}

pub async fn insert_folder(
  args: InsertFolderArgs<'_>,
  pool: &MySqlPool,
) -> Result<(), sqlx::Error> {
  sqlx::query!(
    r#"
INSERT INTO folders
SET
  token = ?,
  name = ?,
  owner_user_token = ?,
  maybe_parent_folder_token = ?,
  maybe_color_code = ?
    "#,
    args.token.as_str(),
    args.name,
    args.owner_user_token.as_str(),
    args.maybe_parent_folder_token.map(|t| t.as_str()),
    args.maybe_color_code,
  )
    .execute(pool)
    .await?;
  Ok(())
}

use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

pub struct UpdateFolderCoverImageArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub folder_token: &'e FolderToken,
  pub owner_user_token: &'e UserToken,

  /// `None` clears the cover image.
  pub maybe_cover_image_media_file_token: Option<&'e MediaFileToken>,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Set or clear (`None`) the custom cover-image media file on a folder.
pub async fn update_folder_cover_image<'e, 'c: 'e, E>(
  args: UpdateFolderCoverImageArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
UPDATE folders
SET maybe_cover_image_custom_media_token = ?
WHERE token = ?
  AND owner_user_token = ?
  AND maybe_deleted_at IS NULL
LIMIT 1
    "#,
    args.maybe_cover_image_media_file_token.map(|t| t.as_str()),
    args.folder_token.as_str(),
    args.owner_user_token.as_str(),
  )
    .execute(args.mysql_executor)
    .await?;
  Ok(result.rows_affected())
}

use sqlx::{Executor, MySql};
use tokens::tokens::media_files::MediaFileToken;

pub async fn update_video_media_file_with_thumbnail<'e, 'c, E>(
  media_file_token: &MediaFileToken,
  thumbnail_version: u8,
  executor: E,
) -> Result<(), sqlx::Error>
  where E: 'e + Executor<'c, Database = MySql>
{
  sqlx::query!(
    r#"
      UPDATE media_files
      SET maybe_thumbnail_version = ?
      WHERE token = ?
      LIMIT 1
    "#,
    thumbnail_version,
    media_file_token.as_str(),
  )
  .execute(executor)
  .await?;

  Ok(())
}

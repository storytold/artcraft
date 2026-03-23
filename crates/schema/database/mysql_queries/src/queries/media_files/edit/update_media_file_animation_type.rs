use sqlx::MySqlPool;

use enums_db::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use errors::AnyhowResult;
use tokens::tokens::media_files::MediaFileToken;

pub async fn update_media_file_animation_type(
    media_file_token: &MediaFileToken,
    maybe_animation_type: Option<MediaFileAnimationType>,
    mysql_pool: &MySqlPool
) -> AnyhowResult<()> {
    let _r = sqlx::query!(
        r#"
UPDATE media_files
SET
  maybe_animation_type = ?
WHERE
  token = ?
LIMIT 1
        "#,
      maybe_animation_type.map(|t| t.to_str()),
      media_file_token,
    )
        .execute(mysql_pool)
        .await?;
    Ok(())
}

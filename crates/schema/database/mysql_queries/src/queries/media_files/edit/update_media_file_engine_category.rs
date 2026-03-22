use sqlx::MySqlPool;

use enums_db::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use errors::AnyhowResult;
use tokens::tokens::media_files::MediaFileToken;

pub async fn update_media_file_engine_category(
    media_file_token: &MediaFileToken,
    engine_category: MediaFileEngineCategory,
    mysql_pool: &MySqlPool
) -> AnyhowResult<()> {
    let _r = sqlx::query!(
        r#"
UPDATE media_files
SET
  maybe_engine_category = ?
WHERE
  token = ?
LIMIT 1
        "#,
      engine_category.to_str(),
      media_file_token,
    )
        .execute(mysql_pool)
        .await?;
    Ok(())
}

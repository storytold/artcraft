use sqlx::{MySql, MySqlPool, QueryBuilder};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::media_files::MediaFileToken;

/// Insert membership rows for every (folder_token, media_file_token) in
/// the input. Uses `INSERT IGNORE` so already-present rows don't cause
/// duplicate-key errors — idempotent.
///
/// Returns the number of rows actually inserted.
pub async fn bulk_insert_folder_media_files(
  folder_token: &FolderToken,
  media_file_tokens: &[MediaFileToken],
  pool: &MySqlPool,
) -> Result<u64, sqlx::Error> {
  if media_file_tokens.is_empty() {
    return Ok(0);
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "INSERT IGNORE INTO folder_media_files (folder_token, media_file_token) ",
  );
  builder.push_values(media_file_tokens, |mut b, media_file_token| {
    b.push_bind(folder_token.as_str())
      .push_bind(media_file_token.as_str());
  });

  let result = builder.build().execute(pool).await?;
  Ok(result.rows_affected())
}

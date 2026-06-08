use sqlx::{MySql, MySqlPool, QueryBuilder};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::media_files::MediaFileToken;

/// Hard-delete membership rows for the given folder + media file tokens.
/// Idempotent — rows that don't exist are silently skipped.
///
/// Returns the number of rows actually deleted.
pub async fn bulk_delete_folder_media_files(
  folder_token: &FolderToken,
  media_file_tokens: &[MediaFileToken],
  pool: &MySqlPool,
) -> Result<u64, sqlx::Error> {
  if media_file_tokens.is_empty() {
    return Ok(0);
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "DELETE FROM folder_media_files WHERE folder_token = ",
  );
  builder.push_bind(folder_token.as_str());
  builder.push(" AND media_file_token IN (");

  let mut separated = builder.separated(", ");
  for token in media_file_tokens {
    separated.push_bind(token.as_str());
  }
  separated.push_unseparated(")");

  let result = builder.build().execute(pool).await?;
  Ok(result.rows_affected())
}

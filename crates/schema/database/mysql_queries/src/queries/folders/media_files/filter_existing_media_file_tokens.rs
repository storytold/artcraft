use sqlx::{MySql, MySqlPool, QueryBuilder, Row};

use tokens::tokens::media_files::MediaFileToken;

/// Given an input set of candidate media-file tokens, return only those
/// that currently exist and aren't soft-deleted (no user_deleted_at or
/// mod_deleted_at).
pub async fn filter_existing_media_file_tokens(
  candidate_tokens: &[MediaFileToken],
  pool: &MySqlPool,
) -> Result<Vec<MediaFileToken>, sqlx::Error> {
  if candidate_tokens.is_empty() {
    return Ok(Vec::new());
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "SELECT token FROM media_files WHERE user_deleted_at IS NULL \
       AND mod_deleted_at IS NULL AND token IN (",
  );

  let mut separated = builder.separated(", ");
  for token in candidate_tokens {
    separated.push_bind(token.as_str());
  }
  separated.push_unseparated(")");

  let rows = builder.build().fetch_all(pool).await?;

  Ok(rows.into_iter()
    .map(|row| MediaFileToken::new(row.get::<String, _>(0)))
    .collect())
}

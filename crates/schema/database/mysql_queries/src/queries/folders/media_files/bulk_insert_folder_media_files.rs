use std::marker::PhantomData;

use sqlx::{Executor, MySql, QueryBuilder};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::media_files::MediaFileToken;

pub struct BulkInsertFolderMediaFilesArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub folder_token: &'e FolderToken,
  pub media_file_tokens: &'e [MediaFileToken],
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Insert membership rows for every (folder_token, media_file_token) in
/// the input. Uses `INSERT IGNORE` so already-present rows don't cause
/// duplicate-key errors — idempotent. Returns the number of rows
/// actually inserted.
pub async fn bulk_insert_folder_media_files<'e, 'c: 'e, E>(
  args: BulkInsertFolderMediaFilesArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  if args.media_file_tokens.is_empty() {
    return Ok(0);
  }

  let folder_token_str = args.folder_token.as_str();
  let mut builder = QueryBuilder::<MySql>::new(
    "INSERT IGNORE INTO folder_media_files (folder_token, media_file_token) ",
  );
  builder.push_values(args.media_file_tokens, |mut b, media_file_token| {
    b.push_bind(folder_token_str)
      .push_bind(media_file_token.as_str());
  });

  let result = builder.build().execute(args.mysql_executor).await?;
  Ok(result.rows_affected())
}

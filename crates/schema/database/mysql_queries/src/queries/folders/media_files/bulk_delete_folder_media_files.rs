use std::marker::PhantomData;

use sqlx::{Executor, MySql, QueryBuilder};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::media_files::MediaFileToken;

pub struct BulkDeleteFolderMediaFilesArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub folder_token: &'e FolderToken,
  pub media_file_tokens: &'e [MediaFileToken],
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Hard-delete membership rows for the given folder + media file tokens.
/// Idempotent — rows that don't exist are silently skipped. Returns the
/// number of rows actually deleted.
pub async fn bulk_delete_folder_media_files<'e, 'c: 'e, E>(
  args: BulkDeleteFolderMediaFilesArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  if args.media_file_tokens.is_empty() {
    return Ok(0);
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "DELETE FROM folder_media_files WHERE folder_token = ",
  );
  builder.push_bind(args.folder_token.as_str());
  builder.push(" AND media_file_token IN (");

  let mut separated = builder.separated(", ");
  for token in args.media_file_tokens {
    separated.push_bind(token.as_str());
  }
  separated.push_unseparated(")");

  let result = builder.build().execute(args.mysql_executor).await?;
  Ok(result.rows_affected())
}

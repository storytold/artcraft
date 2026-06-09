use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::folders::FolderToken;

pub struct RecomputeFolderLastMediaFilesArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub folder_token: &'e FolderToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Recompute the four denormalized `maybe_last_media_file_token_1..4`
/// columns on `folders` for the given folder by scanning the current
/// (non-soft-deleted) members of `folder_media_files` and grabbing the
/// four with the largest `folder_media_files.id` (most-recently-added).
///
/// Single-statement: four correlated `LIMIT 1 OFFSET k` scalar subqueries
/// in the SET clause. Each subquery walks the `index_folder_token` index
/// on `folder_media_files`, joins `media_files` by primary key, and
/// stops at the (offset+1)-th matching row. Folders with fewer than four
/// live members get NULL automatically for the empty slots — that's the
/// scalar-subquery / no-rows-found semantics.
///
/// Intended to run inside the same transaction as the bulk add / remove /
/// move that necessitated the recompute, so the cached columns and the
/// real membership stay consistent under concurrent writers.
pub async fn recompute_folder_last_media_files<'e, 'c: 'e, E>(
  args: RecomputeFolderLastMediaFilesArgs<'e, 'c, E>,
) -> Result<(), sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let folder_token_str = args.folder_token.as_str();

  sqlx::query!(
    r#"
UPDATE folders
SET
  maybe_last_media_file_token_1 = (
    SELECT mf.token
    FROM folder_media_files fmf
    JOIN media_files mf
      ON mf.token = fmf.media_file_token
    WHERE fmf.folder_token = ?
      AND mf.user_deleted_at IS NULL
      AND mf.mod_deleted_at IS NULL
    ORDER BY fmf.id DESC
    LIMIT 1 OFFSET 0
  ),
  maybe_last_media_file_token_2 = (
    SELECT mf.token
    FROM folder_media_files fmf
    JOIN media_files mf
      ON mf.token = fmf.media_file_token
    WHERE fmf.folder_token = ?
      AND mf.user_deleted_at IS NULL
      AND mf.mod_deleted_at IS NULL
    ORDER BY fmf.id DESC
    LIMIT 1 OFFSET 1
  ),
  maybe_last_media_file_token_3 = (
    SELECT mf.token
    FROM folder_media_files fmf
    JOIN media_files mf
      ON mf.token = fmf.media_file_token
    WHERE fmf.folder_token = ?
      AND mf.user_deleted_at IS NULL
      AND mf.mod_deleted_at IS NULL
    ORDER BY fmf.id DESC
    LIMIT 1 OFFSET 2
  ),
  maybe_last_media_file_token_4 = (
    SELECT mf.token
    FROM folder_media_files fmf
    JOIN media_files mf
      ON mf.token = fmf.media_file_token
    WHERE fmf.folder_token = ?
      AND mf.user_deleted_at IS NULL
      AND mf.mod_deleted_at IS NULL
    ORDER BY fmf.id DESC
    LIMIT 1 OFFSET 3
  )
WHERE token = ?
    "#,
    folder_token_str,
    folder_token_str,
    folder_token_str,
    folder_token_str,
    folder_token_str,
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(())
}

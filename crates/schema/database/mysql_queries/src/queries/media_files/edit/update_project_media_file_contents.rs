use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_project_type::MediaFileProjectType;
use enums::by_table::media_files::media_file_type::MediaFileType;
use tokens::tokens::media_files::MediaFileToken;

pub struct UpdateProjectMediaFileContentsArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub media_file_token: &'e MediaFileToken,

  /// The class/type/project-type the record should hold after the update.
  /// Also backfills legacy records that predate the `project` class.
  pub media_class: MediaFileClass,
  pub media_type: MediaFileType,
  pub project_type: MediaFileProjectType,

  pub public_bucket_directory_hash: &'e str,
  pub maybe_public_bucket_prefix: Option<&'e str>,
  pub maybe_public_bucket_extension: Option<&'e str>,

  pub maybe_mime_type: Option<&'e str>,
  pub file_size_bytes: u64,
  pub sha256_checksum: &'e str,

  pub update_ip_address: &'e str,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Point a project media file record at freshly uploaded bucket contents.
pub async fn update_project_media_file_contents<'e, 'c: 'e, E>(
  args: UpdateProjectMediaFileContentsArgs<'e, 'c, E>,
) -> Result<(), sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  sqlx::query!(
    r#"
UPDATE media_files
SET
  media_class = ?,
  media_type = ?,
  maybe_project_type = ?,

  public_bucket_directory_hash = ?,
  maybe_public_bucket_prefix = ?,
  maybe_public_bucket_extension = ?,

  maybe_mime_type = ?,
  file_size_bytes = ?,
  checksum_sha2 = ?,

  creator_ip_address = ?
WHERE token = ?
LIMIT 1
    "#,
    args.media_class.to_str(),
    args.media_type.to_str(),
    args.project_type.to_str(),

    args.public_bucket_directory_hash,
    args.maybe_public_bucket_prefix,
    args.maybe_public_bucket_extension,

    args.maybe_mime_type,
    args.file_size_bytes,
    args.sha256_checksum,

    args.update_ip_address,

    args.media_file_token.as_str(),
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(())
}

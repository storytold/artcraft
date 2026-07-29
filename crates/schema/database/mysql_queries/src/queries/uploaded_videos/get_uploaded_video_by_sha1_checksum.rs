use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use enums::by_table::uploaded_videos::uploaded_video_detected_model_family::UploadedVideoDetectedModelFamily;
use enums::by_table::uploaded_videos::uploaded_video_detected_model_type::UploadedVideoDetectedModelType;
use tokens::tokens::uploaded_videos::UploadedVideoToken;

use crate::queries::uploaded_videos::uploaded_video_row::UploadedVideoRow;

pub struct GetUploadedVideoBySha1ChecksumArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub sha1_checksum: &'e str,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Look up an `uploaded_videos` record by its `sha1_checksum`. `Ok(None)` if no
/// row matches. Useful for de-duplicating re-uploads of the same bytes.
pub async fn get_uploaded_video_by_sha1_checksum<'e, 'c: 'e, E>(
  args: GetUploadedVideoBySha1ChecksumArgs<'e, 'c, E>,
) -> Result<Option<UploadedVideoRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
SELECT
  token as `token: UploadedVideoToken`,
  sha1_checksum,
  filesize_bytes as `filesize_bytes: u32`,
  maybe_width as `maybe_width: u32`,
  maybe_height as `maybe_height: u32`,
  maybe_resolution,
  maybe_detected_model_family as `maybe_detected_model_family: UploadedVideoDetectedModelFamily`,
  maybe_detected_model_type as `maybe_detected_model_type: UploadedVideoDetectedModelType`,
  maybe_report,
  upload_ip_address,
  maybe_updated_ip_address,
  created_at,
  updated_at
FROM uploaded_videos
WHERE sha1_checksum = ?
LIMIT 1
    "#,
    args.sha1_checksum,
  )
    .fetch_optional(args.mysql_executor)
    .await?;

  Ok(result.map(|r| UploadedVideoRow {
    token: r.token,
    sha1_checksum: r.sha1_checksum,
    filesize_bytes: r.filesize_bytes,
    maybe_width: r.maybe_width,
    maybe_height: r.maybe_height,
    maybe_resolution: r.maybe_resolution,
    maybe_detected_model_family: r.maybe_detected_model_family,
    maybe_detected_model_type: r.maybe_detected_model_type,
    maybe_report: r.maybe_report,
    upload_ip_address: r.upload_ip_address,
    maybe_updated_ip_address: r.maybe_updated_ip_address,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }))
}

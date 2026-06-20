use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use enums::by_table::uploaded_videos::uploaded_video_detected_model_family::UploadedVideoDetectedModelFamily;
use enums::by_table::uploaded_videos::uploaded_video_detected_model_type::UploadedVideoDetectedModelType;
use tokens::tokens::uploaded_videos::UploadedVideoToken;

pub struct InsertUploadedVideoArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub sha1_checksum: &'e str,
  pub filesize_bytes: u32,
  pub maybe_filename: Option<&'e str>,

  pub maybe_width: Option<u32>,
  pub maybe_height: Option<u32>,
  pub maybe_resolution: Option<&'e str>,

  pub maybe_detected_model_family: Option<UploadedVideoDetectedModelFamily>,
  pub maybe_detected_model_type: Option<UploadedVideoDetectedModelType>,
  pub maybe_report: Option<&'e str>,

  pub upload_ip_address: &'e str,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Insert a new `uploaded_videos` record. The `UploadedVideoToken` is minted
/// here (in the data-access layer, not the handler) and returned. `created_at`
/// is set to `NOW()`.
pub async fn insert_uploaded_video<'e, 'c: 'e, E>(
  args: InsertUploadedVideoArgs<'e, 'c, E>,
) -> Result<UploadedVideoToken, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let token = UploadedVideoToken::generate();

  sqlx::query!(
    r#"
INSERT INTO uploaded_videos
SET
  token = ?,
  sha1_checksum = ?,
  filesize_bytes = ?,
  maybe_filename = ?,
  maybe_width = ?,
  maybe_height = ?,
  maybe_resolution = ?,
  maybe_detected_model_family = ?,
  maybe_detected_model_type = ?,
  maybe_report = ?,
  upload_ip_address = ?,
  created_at = NOW()
    "#,
    token.as_str(),
    args.sha1_checksum,
    args.filesize_bytes,
    args.maybe_filename,
    args.maybe_width,
    args.maybe_height,
    args.maybe_resolution,
    args.maybe_detected_model_family.map(|family| family.to_str()),
    args.maybe_detected_model_type.map(|model_type| model_type.to_str()),
    args.maybe_report,
    args.upload_ip_address,
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(token)
}

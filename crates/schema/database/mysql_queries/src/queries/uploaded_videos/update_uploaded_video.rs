use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use enums::by_table::uploaded_videos::uploaded_video_detected_model_family::UploadedVideoDetectedModelFamily;
use enums::by_table::uploaded_videos::uploaded_video_detected_model_type::UploadedVideoDetectedModelType;
use tokens::tokens::uploaded_videos::UploadedVideoToken;

pub struct UpdateUploadedVideoArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub token: &'e UploadedVideoToken,

  pub maybe_filename: Option<&'e str>,

  pub maybe_width: Option<u32>,
  pub maybe_height: Option<u32>,
  pub maybe_resolution: Option<&'e str>,

  pub maybe_detected_model_family: Option<UploadedVideoDetectedModelFamily>,
  pub maybe_detected_model_type: Option<UploadedVideoDetectedModelType>,
  pub maybe_report: Option<&'e str>,

  /// IP address of the request making the update; stamped on `maybe_updated_ip_address`.
  pub maybe_updated_ip_address: Option<&'e str>,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Update the mutable fields of an `uploaded_videos` record by `token`
/// (dimensions, detection, report, updater IP). The `version` vector clock is
/// incremented by 1, and `updated_at` is refreshed via the column's `ON UPDATE`
/// clause. Returns the number of rows affected (0 if no row matched).
pub async fn update_uploaded_video<'e, 'c: 'e, E>(
  args: UpdateUploadedVideoArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
UPDATE uploaded_videos
SET
  maybe_filename = ?,
  maybe_width = ?,
  maybe_height = ?,
  maybe_resolution = ?,
  maybe_detected_model_family = ?,
  maybe_detected_model_type = ?,
  maybe_report = ?,
  maybe_updated_ip_address = ?,
  version = version + 1
WHERE token = ?
LIMIT 1
    "#,
    args.maybe_filename,
    args.maybe_width,
    args.maybe_height,
    args.maybe_resolution,
    args.maybe_detected_model_family.map(|family| family.to_str()),
    args.maybe_detected_model_type.map(|model_type| model_type.to_str()),
    args.maybe_report,
    args.maybe_updated_ip_address,
    args.token.as_str(),
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(result.rows_affected())
}

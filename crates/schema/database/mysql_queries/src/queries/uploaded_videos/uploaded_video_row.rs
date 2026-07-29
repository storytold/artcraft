use chrono::{DateTime, Utc};

use enums::by_table::uploaded_videos::uploaded_video_detected_model_family::UploadedVideoDetectedModelFamily;
use enums::by_table::uploaded_videos::uploaded_video_detected_model_type::UploadedVideoDetectedModelType;
use tokens::tokens::uploaded_videos::UploadedVideoToken;

/// A materialized `uploaded_videos` row (minus the internal `id`).
#[derive(Debug, Clone)]
pub struct UploadedVideoRow {
  pub token: UploadedVideoToken,

  pub sha1_checksum: String,
  pub filesize_bytes: u32,

  pub maybe_width: Option<u32>,
  pub maybe_height: Option<u32>,
  pub maybe_resolution: Option<String>,

  pub maybe_detected_model_family: Option<UploadedVideoDetectedModelFamily>,
  pub maybe_detected_model_type: Option<UploadedVideoDetectedModelType>,
  pub maybe_report: Option<String>,

  pub upload_ip_address: String,
  pub maybe_updated_ip_address: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

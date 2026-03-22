use crate::payloads::generic_inference_args::common::watermark_type::WatermarkType;
use enums_db::common::visibility::Visibility;
use std::time::Duration;
use tokens::tokens::media_files::MediaFileToken;

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct StudioGen2Payload {
  /// The input image media file (required)
  #[serde(rename = "i")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_file: Option<MediaFileToken>,

  /// The input video media file (required)
  #[serde(rename = "v")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub video_file: Option<MediaFileToken>,

  #[serde(rename = "wt")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub watermark_type: Option<WatermarkType>,

  #[serde(rename = "cv")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub creator_visibility: Option<Visibility>,

  #[serde(rename = "sm")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub after_job_debug_sleep_millis: Option<u64>,

  #[serde(rename = "ow")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_width: Option<u64>,

  #[serde(rename = "oh")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_height: Option<u64>,

  #[serde(rename = "fp")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub fps: Option<u64>,

  #[serde(rename = "mf")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub max_frames: Option<u64>,

  #[serde(rename = "rnd")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub rounds: Option<u64>,
  
  #[serde(rename = "td")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub trim_duration_millis: Option<u64>,
  
  #[serde(rename = "ski")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub skip_image_resize: Option<bool>,
  
  #[serde(rename = "tw")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub tensor_image_width: Option<u64>,
  
  #[serde(rename = "th")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub tensor_image_height: Option<u64>,
}

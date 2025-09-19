#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SeedanceImageToVideoProRequest {
  pub prompt: String,

  pub image_url: String,

  /// The resolution of the generated video frame
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// The duration of the generated video in seconds
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub camera_fixed: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_safety_checker: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct I2VOutput {
  /// The generated video
  /// {"url":"https://v2.fal.media/files/36087878b0c1435bb75c19b64b7db178_output.mp4"}
  pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct File {
  /// The URL where the file can be downloaded from.
  pub url: String,

  // /// The mime type of the file.
  // /// "image/png"
  // #[serde(skip_serializing_if = "Option::is_none")]
  // pub content_type: Option<String>,
  // /// File data
  // #[serde(skip_serializing_if = "Option::is_none")]
  // pub file_data: Option<String>,
  // /// The name of the file. It will be auto-generated if not provided.
  // /// "z9RV14K95DvU.png"
  // #[serde(skip_serializing_if = "Option::is_none")]
  // pub file_name: Option<String>,
  // /// The size of the file in bytes.
  // /// 4404019
  // #[serde(skip_serializing_if = "Option::is_none")]
  // pub file_size: Option<i64>,
}

pub fn seedance_v1_pro_image_to_video(
  params: SeedanceImageToVideoProRequest,
) -> FalRequest<SeedanceImageToVideoProRequest, I2VOutput> {
  FalRequest::new("fal-ai/bytedance/seedance/v1/pro/image-to-video", params)
}

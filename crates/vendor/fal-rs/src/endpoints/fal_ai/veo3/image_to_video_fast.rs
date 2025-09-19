#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct File {
  /// The mime type of the file.
  /// "image/png"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub content_type: Option<String>,
  /// File data
  #[serde(skip_serializing_if = "Option::is_none")]
  pub file_data: Option<String>,
  /// The name of the file. It will be auto-generated if not provided.
  /// "z9RV14K95DvU.png"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub file_name: Option<String>,
  /// The size of the file in bytes.
  /// 4404019
  #[serde(skip_serializing_if = "Option::is_none")]
  pub file_size: Option<i64>,
  /// The URL where the file can be downloaded from.
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageToVideoFastInput {
  /// The text prompt describing how the image should be animated
  /// "A lego chef cooking eggs"
  pub prompt: String,

  /// URL of the input image to animate. Should be 720p or higher resolution.
  /// "https://fal.media/files/elephant/6fq8JDSjb1osE_c3J_F2H.png"
  pub image_url: String,

  /// The duration of the generated video in seconds
  /// eg "8s".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<String>,

  /// Generate audio
  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_audio: Option<bool>,

  /// Resolution, eg. "720p"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageToVideoFastOutput {
  /// The generated video
  /// {"url":"https://v3.fal.media/files/zebra/uNu-1qkbNt8be8iHA1hiB_output.mp4"}
  pub video: File,
}

pub fn image_to_video_fast(
  params: ImageToVideoFastInput,
) -> FalRequest<ImageToVideoFastInput, ImageToVideoFastOutput> {
  FalRequest::new("fal-ai/veo3/fast/image-to-video", params)
}

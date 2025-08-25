#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SeedEditV3Input {
  /// REQUIRED
  /// The prompt to generate the image with
  pub prompt: String,

  /// REQUIRED
  /// The URL of the image to edit.
  pub image_url: String,

  /// Optional.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub guidance_scale: Option<f64>,

  /// Optional.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_safety_checker: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SeedEditV3Output {
  pub image: Vec<Image>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Image {
  /// The URL where the file can be downloaded from.
  pub url: String,

  /// The mime type of the file.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub content_type: Option<String>,

  /// The name of the file. It will be auto-generated if not provided.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub file_name: Option<String>,

  /// The size of the file in bytes.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub file_size: Option<i64>,

  /// File data
  #[serde(skip_serializing_if = "Option::is_none")]
  pub file_data: Option<String>,

  /// The width of the image in pixels.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub width: Option<u64>,

  /// The height of the image in pixels.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub height: Option<u64>,
}

pub fn seededit_v3_edit(
  params: SeedEditV3Input,
) -> FalRequest<SeedEditV3Input, SeedEditV3Output> {
  FalRequest::new("fal-ai/bytedance/seededit/v3/edit-image", params)
}

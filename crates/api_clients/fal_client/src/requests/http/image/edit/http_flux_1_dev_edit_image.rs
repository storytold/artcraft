use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Flux1DevEditImageInput {
  pub prompt: String,

  pub image_url: String,

  /// 0.0 - 1.0
  /// Default: 0.95
  #[serde(skip_serializing_if = "Option::is_none")]
  pub strength: Option<f64>,

  /// 1 - 4
  /// Default: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<i64>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub guidance_scale: Option<f64>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_inference_steps: Option<i64>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_safety_checker: Option<bool>,

  /// Options: jpeg, png
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Flux1DevEditImageFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Flux1DevEditImageOutput {
  pub images: Vec<Flux1DevEditImageFile>,
}

pub fn flux_1_dev_edit_image(
  params: Flux1DevEditImageInput,
) -> FalRequest<Flux1DevEditImageInput, Flux1DevEditImageOutput> {
  FalRequest::new("fal-ai/flux/dev/image-to-image", params)
}

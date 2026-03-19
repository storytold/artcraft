use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Flux1DevTextToImageInput {
  pub prompt: String,

  /// Options: square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_size: Option<String>,

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

  #[serde(skip_serializing_if = "Option::is_none")]
  pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Flux1DevTextToImageFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Flux1DevTextToImageOutput {
  pub images: Vec<Flux1DevTextToImageFile>,
}

pub fn flux_1_dev_text_to_image(
  params: Flux1DevTextToImageInput,
) -> FalRequest<Flux1DevTextToImageInput, Flux1DevTextToImageOutput> {
  FalRequest::new("fal-ai/flux/dev", params)
}

use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxDevJuggernautInfillInput {
  pub prompt: String,

  pub image_url: String,

  pub mask_url: String,

  /// 1 - 4
  /// Default: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<i64>,

  /// "png" or "jpeg"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,

  /// 0.0 - 1.0. 1.0 completely remakes the image, 0.0 preserves the original.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub strength: Option<f64>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_inference_steps: Option<i64>,

  /// Options: square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_size: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_safety_checker: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub guidance_scale: Option<f64>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FluxDevJuggernautInfillFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FluxDevJuggernautInfillOutput {
  pub images: Vec<FluxDevJuggernautInfillFile>,
}

pub fn flux_dev_juggernaut_infill(
  params: FluxDevJuggernautInfillInput,
) -> FalRequest<FluxDevJuggernautInfillInput, FluxDevJuggernautInfillOutput> {
  FalRequest::new("rundiffusion-fal/juggernaut-flux-lora/inpainting", params)
}

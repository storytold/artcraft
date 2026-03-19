use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxPro1InfillInput {
  pub prompt: String,

  pub image_url: String,

  pub mask_url: String,

  /// 1 - 4
  /// Default: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<i64>,

  /// "1" (most strict) to "5" (most permissive)
  #[serde(skip_serializing_if = "Option::is_none")]
  pub safety_tolerance: Option<String>,

  /// "png" or "jpeg"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FluxPro1InfillFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FluxPro1InfillOutput {
  pub images: Vec<FluxPro1InfillFile>,
}

pub fn flux_pro_1_infill(
  params: FluxPro1InfillInput,
) -> FalRequest<FluxPro1InfillInput, FluxPro1InfillOutput> {
  FalRequest::new("fal-ai/flux-pro/v1/fill", params)
}

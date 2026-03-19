use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Flux2LoraEditImageAngleInput {
  /// The URL of the image to adjust camera angle for.
  pub image_urls: Vec<String>,

  /// Horizontal rotation angle around the object in degrees.
  /// 0°=front view, 90°=right side, 180°=back view, 270°=left side.
  /// Default: 0
  #[serde(skip_serializing_if = "Option::is_none")]
  pub horizontal_angle: Option<f64>,

  /// Vertical camera angle in degrees.
  /// 0°=eye-level shot, 30°=elevated shot, 60°=high-angle shot.
  /// Default: 0
  #[serde(skip_serializing_if = "Option::is_none")]
  pub vertical_angle: Option<f64>,

  /// Camera zoom/distance. 0=wide shot, 5=medium shot, 10=close-up.
  /// Default: 5
  #[serde(skip_serializing_if = "Option::is_none")]
  pub zoom: Option<f64>,

  /// The strength of the multiple angles effect.
  /// Default: 1, range: 0-2
  #[serde(skip_serializing_if = "Option::is_none")]
  pub lora_scale: Option<f64>,

  /// The size of the generated image.
  /// Options: square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_size: Option<String>,

  /// The CFG (Classifier Free Guidance) scale.
  /// Default: 2.5, range: 0-20
  #[serde(skip_serializing_if = "Option::is_none")]
  pub guidance_scale: Option<f64>,

  /// The number of inference steps to perform.
  /// Default: 40, range: 1-50
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_inference_steps: Option<u32>,

  /// Random seed for reproducibility.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<u64>,

  /// Number of images to generate.
  /// Default: 1, max: 4
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<u8>,

  /// Whether to enable the safety checker.
  /// Default: true
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_safety_checker: Option<bool>,

  /// Output format: png, jpeg, webp.
  /// Default: "png"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Flux2LoraEditImageAngleFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Flux2LoraEditImageAngleOutput {
  pub images: Vec<Flux2LoraEditImageAngleFile>,
  pub seed: u64,
  pub prompt: Option<String>,
}

pub fn http_flux_2_lora_edit_image_angle(
  params: Flux2LoraEditImageAngleInput,
) -> FalRequest<Flux2LoraEditImageAngleInput, Flux2LoraEditImageAngleOutput> {
  FalRequest::new("fal-ai/flux-2-lora-gallery/multiple-angles", params)
}

use fal::request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct QwenEdit2511EditImageAngleInput {
  /// The URL of the image to adjust camera angle for.
  pub image_urls: Vec<String>,

  /// Horizontal rotation angle around the object in degrees. 0°=front view.
  /// Default: 0
  #[serde(skip_serializing_if = "Option::is_none")]
  pub horizontal_angle: Option<f64>,

  /// Vertical camera angle in degrees. -30°=low-angle shot, 30°=high-angle shot.
  /// Default: 0
  #[serde(skip_serializing_if = "Option::is_none")]
  pub vertical_angle: Option<f64>,

  /// Camera zoom/distance. 0=wide shot, 5=medium shot, 10=close-up.
  /// Default: 5
  #[serde(skip_serializing_if = "Option::is_none")]
  pub zoom: Option<f64>,

  /// Additional text to append to the automatically generated prompt.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub additional_prompt: Option<String>,

  /// The scale factor for the LoRA model. Controls the strength of the effect.
  /// Default: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub lora_scale: Option<f64>,

  /// The size of the generated image.
  /// Options: square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_size: Option<String>,

  /// The CFG (Classifier Free Guidance) scale.
  /// Default: 4.5
  #[serde(skip_serializing_if = "Option::is_none")]
  pub guidance_scale: Option<f64>,

  /// The number of inference steps to perform.
  /// Default: 28
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_inference_steps: Option<u32>,

  /// The negative prompt for the generation.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  /// Random seed for reproducibility.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<u64>,

  /// Number of images to generate.
  /// Default: 1
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
pub struct QwenEdit2511EditImageAngleFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QwenEdit2511EditImageAngleOutput {
  pub images: Vec<QwenEdit2511EditImageAngleFile>,
  pub seed: u64,
  pub prompt: Option<String>,
}

pub fn http_qwen_edit_2511_edit_image_angle(
  params: QwenEdit2511EditImageAngleInput,
) -> FalRequest<QwenEdit2511EditImageAngleInput, QwenEdit2511EditImageAngleOutput> {
  FalRequest::new("fal-ai/qwen-image-edit-2511-multiple-angles", params)
}

#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

//       "height": 768,
//       "content_type": "image/jpeg",
//       "url": "https://v3.fal.media/files/elephant/P-YCIAg6wtFn1hsF34fzL_qwen-edit.png",
//       "width": 1024

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct File {
  /// The URL where the file can be downloaded from.
  pub url: String,
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
  #[serde(skip_serializing_if = "Option::is_none")]
  pub height: Option<u64>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub width: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct QwenImageEditInput {
  /// REQUIRED
  /// The prompt to generate the image with
  pub prompt: String,

  /// REQUIRED
  /// The URL of the image to edit.
  pub image_url: String,

  /// Optional.
  /// Possible enum values: square_hd, square, portrait_4_3, portrait_16_9,
  ///  landscape_4_3, landscape_16_9
  /// Note: This also supports a custom JSON width/height (not yet supported)
  pub image_size: Option<String>,

  /// Optional.
  /// The number of inference steps to perform. Default value: 30
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_inference_steps: Option<u8>,

  /// Optional.
  /// The same seed and the same prompt given to the same version of the model will
  /// output the same image every time.The number of inference steps to perform. Default value: 30
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<u64>,

  /// Optional.
  /// Classifier free guidance
  /// The CFG (Classifier Free Guidance) scale is a measure of how close you want the
  /// model to stick to your prompt when looking for a related image to show you. Default value: 4
  #[serde(skip_serializing_if = "Option::is_none")]
  pub guidance_scale: Option<f64>,

  /// Optional.
  /// The number of images to generate. Default value: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<u8>,

  /// Optional.
  /// If set to true, the safety checker will be enabled. Default value: true
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_safety_checker: Option<bool>,

  /// Optional.
  /// The format of the generated image. Default value: "png"
  // Possible enum values: jpeg, png
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,

  /// Optional.
  /// The negative prompt for the generation Default value: " "
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  /// Optional.
  /// Acceleration level for image generation. Options: 'none', 'regular'.
  /// Higher acceleration increases speed. 'regular' balances speed and quality.
  /// Default value: "none"
  /// Possible enum values: none, regular, high
  #[serde(skip_serializing_if = "Option::is_none")]
  pub acceleration: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QwenImageEditOutput {
  pub images: Vec<File>,
}

pub fn qwen_image_edit(
  params: QwenImageEditInput,
) -> FalRequest<QwenImageEditInput, QwenImageEditOutput> {
  FalRequest::new("fal-ai/qwen-image-edit", params)
}

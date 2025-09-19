use crate::prelude::{Deserialize, FalRequest, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxProKontextMaxInput {
  /// The prompt to fill the masked part of the image.
  /// "A knight in shining armour holding a greatshield with \"FAL\" on it"
  pub prompt: String,

  /// The image URL to generate an image from. Needs to match the dimensions of the mask.
  /// "https://storage.googleapis.com/falserverless/flux-lora/example-images/knight.jpeg"
  pub image_url: String,

  /// The number of images to generate.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<i64>,

  /// The format of the generated image.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<String>,

  /// The safety tolerance level for the generated image. 1 being the most strict and 5 being the most permissive.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub safety_tolerance: Option<String>,

  /// The same seed and the same prompt given to the same version of the model
  /// will output the same image every time.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,

  /// If set to true, the function will wait for the image to be generated and uploaded
  /// before returning the response. This will increase the latency of the function but
  /// it allows you to get the image directly in the response without going through the CDN.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Image {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub content_type: Option<String>,
  pub height: i64,
  pub url: String,
  pub width: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
  /// Whether the generated images contain NSFW concepts.
  pub has_nsfw_concepts: Vec<bool>,
  /// The generated image files info.
  pub images: Vec<Image>,
  /// The prompt used for generating the image.
  pub prompt: String,
  /// Seed of the generated Image. It will be the same value of the one passed in the
  /// input or the randomly generated that was used in case none was passed.
  pub seed: i64,
  //pub timings: Timings,
}

pub fn max(params: FluxProKontextMaxInput) -> FalRequest<FluxProKontextMaxInput, Output> {
  FalRequest::new("fal-ai/flux-pro/kontext/max", params)
}

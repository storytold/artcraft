use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const GPT_IMAGE_1P5_MULTI_FUNCTION_IMAGE_GEN_PATH: &str = "/v1/generate/image/multi_function/gpt_image_1p5";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GptImage1p5MultiFunctionImageGenRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// Text prompt to generate the image from.
  pub prompt: Option<String>,

  /// Image media tokens to include in the editing context (**OR INPAINTING CONTEXT!**).
  /// If present, we're doing image editing (image-to-image / image-editing / image-inpainting)
  /// If absent, we're doing image generation (text-to-image)
  pub image_media_tokens: Option<Vec<MediaFileToken>>,
  
  /// Only for image editing, which turns this into an inpainting task.
  /// Text to image should not set this.
  pub mask_image_token: Option<MediaFileToken>,

  /// Number of images to generate. Default is one.
  pub num_images: Option<GptImage1p5MultiFunctionImageGenNumImages>,
  
  pub image_size: Option<GptImage1p5MultiFunctionImageGenSize>,

  pub background: Option<GptImage1p5MultiFunctionImageGenBackground>,

  pub quality: Option<GptImage1p5MultiFunctionImageGenQuality>,

  /// Only for image editing.
  pub input_fidelity: Option<GptImage1p5MultiFunctionImageGenInputFidelity>,

  pub output_format: Option<GptImage1p5MultiFunctionImageGenOutputFormat>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GptImage1p5MultiFunctionImageGenNumImages {
  One, // Default
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GptImage1p5MultiFunctionImageGenSize {
  /// 1024x1024
  Square,
  /// 1536x1024
  Wide,
  /// 1024x1536
  Tall,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GptImage1p5MultiFunctionImageGenBackground {
  Auto,
  Transparent,
  Opaque,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GptImage1p5MultiFunctionImageGenQuality {
  Low,
  Medium,
  High,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GptImage1p5MultiFunctionImageGenInputFidelity {
  Low,
  High,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GptImage1p5MultiFunctionImageGenOutputFormat {
  Jpeg,
  Png,
  Webp,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GptImage1p5MultiFunctionImageGenResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

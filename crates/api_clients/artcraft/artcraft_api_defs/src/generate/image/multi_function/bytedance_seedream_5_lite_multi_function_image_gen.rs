use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const BYTEDANCE_SEEDREAM_5_LITE_MULTI_FUNCTION_IMAGE_GEN_PATH: &str = "/v1/generate/image/multi_function/bytedance_seedream_5_lite";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct BytedanceSeedream5LiteMultiFunctionImageGenRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// Text prompt to generate the image from.
  pub prompt: Option<String>,

  /// Image media tokens to include in the editing context.
  /// If present, we're doing image editing (image-to-image / image-editing)
  /// If absent, we're doing image generation (text-to-image)
  pub image_media_tokens: Option<Vec<MediaFileToken>>,

  /// Number of images to generate. Default is one.
  pub num_images: Option<BytedanceSeedream5LiteMultiFunctionImageGenNumImages>,

  pub max_images: Option<BytedanceSeedream5LiteMultiFunctionImageGenMaxImages>,

  pub image_size: Option<BytedanceSeedream5LiteMultiFunctionImageGenImageSize>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum BytedanceSeedream5LiteMultiFunctionImageGenNumImages {
  One, // Default
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum BytedanceSeedream5LiteMultiFunctionImageGenMaxImages {
  One, // Default
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum BytedanceSeedream5LiteMultiFunctionImageGenImageSize {
  // Square
  Square,
  SquareHd,
  // Tall
  PortraitFourThree,
  PortraitSixteenNine,
  // Wide
  LandscapeFourThree,
  LandscapeSixteenNine,
  // Auto (NB: 5 Lite max is auto_3K, not auto_4K like V4.5)
  Auto2k,
  Auto3k,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct BytedanceSeedream5LiteMultiFunctionImageGenResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

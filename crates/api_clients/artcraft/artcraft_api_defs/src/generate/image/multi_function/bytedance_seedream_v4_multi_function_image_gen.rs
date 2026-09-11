use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const BYTEDANCE_SEEDREAM_V4_MULTI_FUNCTION_IMAGE_GEN_PATH: &str = "/v1/generate/image/multi_function/bytedance_seedream_4";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct BytedanceSeedreamV4MultiFunctionImageGenRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// Text prompt to generate the image from.
  pub prompt: Option<String>,

  /// Image media tokens to include in the editing context.
  /// If present, we're doing image editing (image-to-image / image-editing)
  /// If absent, we're doing image generation (text-to-image)
  pub image_media_tokens: Option<Vec<MediaFileToken>>,

  /// Number of images to generate. Default is one.
  pub num_images: Option<BytedanceSeedreamV4MultiFunctionImageGenNumImages>,

  pub max_images: Option<BytedanceSeedreamV4MultiFunctionImageGenMaxImages>,

  pub image_size: Option<BytedanceSeedreamV4MultiFunctionImageGenImageSize>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum BytedanceSeedreamV4MultiFunctionImageGenNumImages {
  One, // Default
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum BytedanceSeedreamV4MultiFunctionImageGenMaxImages {
  One, // Default
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum BytedanceSeedreamV4MultiFunctionImageGenImageSize {
  // Square
  Square,
  SquareHd,
  // Tall
  PortraitFourThree,
  PortraitSixteenNine,
  // Wide
  LandscapeFourThree,
  LandscapeSixteenNine,
  // Auto
  Auto,
  Auto2k,
  Auto4k,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct BytedanceSeedreamV4MultiFunctionImageGenResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

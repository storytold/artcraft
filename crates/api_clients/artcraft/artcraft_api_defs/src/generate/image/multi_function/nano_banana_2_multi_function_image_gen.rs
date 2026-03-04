use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const NANO_BANANA_2_MULTI_FUNCTION_IMAGE_GEN_PATH: &str = "/v1/generate/image/multi_function/nano_banana_2";

#[derive(Serialize, Deserialize, ToSchema, Debug)]
pub struct NanaBanana2MultiFunctionImageGenRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// Text prompt to generate the image from.
  pub prompt: Option<String>,

  /// Image media tokens to include in the editing context.
  /// If present, we're doing image editing (image-to-image / image-editing)
  /// If absent, we're doing image generation (text-to-image)
  pub image_media_tokens: Option<Vec<MediaFileToken>>,

  /// Number of images to generate. Default is one.
  pub num_images: Option<NanaBanana2MultiFunctionImageGenNumImages>,

  /// Resolution of the image to generate. Default is OneK (1K).
  pub resolution: Option<NanaBanana2MultiFunctionImageGenImageResolution>,

  /// Aspect ratio of the images to generate. Default is "1:1"
  pub aspect_ratio: Option<NanaBanana2MultiFunctionImageGenAspectRatio>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum NanaBanana2MultiFunctionImageGenNumImages {
  One, // Default
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum NanaBanana2MultiFunctionImageGenImageResolution {
  HalfK,
  OneK,
  TwoK,
  FourK,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum NanaBanana2MultiFunctionImageGenAspectRatio {
  // Auto (only for image editing)
  Auto, // Default for image editing.
  // Square
  OneByOne, // Default for text-to-image
  // Wide
  FiveByFour,
  FourByThree,
  ThreeByTwo,
  SixteenByNine,
  TwentyOneByNine,
  // Tall
  FourByFive,
  ThreeByFour,
  TwoByThree,
  NineBySixteen,
}


#[derive(Serialize, Deserialize, ToSchema)]
pub struct NanaBanana2MultiFunctionImageGenResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

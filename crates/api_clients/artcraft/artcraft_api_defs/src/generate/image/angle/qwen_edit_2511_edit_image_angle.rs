use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const QWEN_EDIT_2511_EDIT_IMAGE_ANGLE_PATH: &str = "/v1/generate/image/angle/qwen_edit_2511";

#[derive(Serialize, Deserialize, ToSchema, Debug)]
pub struct QwenEdit2511EditImageAngleRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// The image to edit with angle adjustment.
  pub image_media_token: MediaFileToken,

  /// Horizontal rotation angle in degrees.
  pub horizontal_angle: Option<f64>,

  /// Vertical rotation angle in degrees.
  pub vertical_angle: Option<f64>,

  /// Zoom level.
  pub zoom: Option<f64>,

  /// Additional text prompt to guide the generation.
  pub additional_prompt: Option<String>,

  /// Number of images to generate. Default is one.
  pub num_images: Option<QwenEdit2511EditImageAngleNumImages>,

  /// Output image size. Default is square_hd.
  pub image_size: Option<QwenEdit2511EditImageAngleImageSize>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum QwenEdit2511EditImageAngleNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum QwenEdit2511EditImageAngleImageSize {
  Square,
  SquareHd,
  PortraitFourThree,
  PortraitSixteenNine,
  LandscapeFourThree,
  LandscapeSixteenNine,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct QwenEdit2511EditImageAngleResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

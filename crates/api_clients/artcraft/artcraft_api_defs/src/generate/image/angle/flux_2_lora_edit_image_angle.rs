use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const FLUX_2_LORA_EDIT_IMAGE_ANGLE_PATH: &str = "/v1/generate/image/angle/flux_2_lora";

#[derive(Serialize, Deserialize, ToSchema, Debug)]
pub struct Flux2LoraEditImageAngleRequest {
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

  /// Number of images to generate. Default is one.
  pub num_images: Option<Flux2LoraEditImageAngleNumImages>,

  /// Output image size. Default is square_hd.
  pub image_size: Option<Flux2LoraEditImageAngleImageSize>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum Flux2LoraEditImageAngleNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum Flux2LoraEditImageAngleImageSize {
  Square,
  SquareHd,
  PortraitFourThree,
  PortraitSixteenNine,
  LandscapeFourThree,
  LandscapeSixteenNine,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct Flux2LoraEditImageAngleResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

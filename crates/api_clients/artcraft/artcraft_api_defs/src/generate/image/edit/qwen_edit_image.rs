use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const QWEN_EDIT_IMAGE_PATH: &str = "/v1/generate/image/edit/qwen";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct QwenEditImageRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// The image we're editing.
  pub image_media_token: MediaFileToken,

  /// Text prompt to generate the image from.
  pub prompt: Option<String>,

  /// Text prompt to generate the image from.
  pub negative_prompt: Option<String>,

  /// Acceleration level for image generation.
  /// Options: 'none', 'regular'. Higher acceleration increases speed.
  /// 'regular' balances speed and quality. Default value: "none"
  pub acceleration: Option<QwenEditImageAcceleration>,

  /// Number of images to generate. Default is one.
  pub num_images: Option<QwenEditImageNumImages>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub enum QwenEditImageAcceleration {
  None,
  Regular,
  High,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum QwenEditImageNumImages {
  One, // Default
  Two,
  Three,
  Four,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct QwenEditImageResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

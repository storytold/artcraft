use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const FLUX_PRO_KONTEXT_MAX_EDIT_IMAGE_PATH: &str = "/v1/generate/image/edit/flux_pro_kontext_max";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct FluxProKontextMaxEditImageRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// Text prompt to generate the image from.
  pub prompt: Option<String>,

  /// The image we're editing.
  pub image_media_token: MediaFileToken,

  /// Number of images to generate. Default is one.
  pub num_images: Option<FluxProKontextMaxEditImageNumImages>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum FluxProKontextMaxEditImageNumImages {
  One, // Default
  Two,
  Three,
  Four,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct FluxProKontextMaxEditImageResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

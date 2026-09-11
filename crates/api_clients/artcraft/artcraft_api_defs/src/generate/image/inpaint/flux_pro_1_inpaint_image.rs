use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const FLUX_PRO_1_INPAINT_PATH: &str = "/v1/generate/image/inpaint/flux_pro_1";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct FluxPro1InpaintImageRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// Text prompt to generate the image from.
  pub prompt: Option<String>,

  /// The image we're editing.
  pub image_media_token: MediaFileToken,
  
  /// The mask to use against the image.
  pub mask_media_token: MediaFileToken,

  /// Number of images to generate. Default is one.
  pub num_images: Option<FluxPro1InpaintImageNumImages>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum FluxPro1InpaintImageNumImages {
  One, // Default
  Two,
  Three,
  Four,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct FluxPro1InpaintImageResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

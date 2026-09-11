use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use utoipa::ToSchema;

pub const GENERATE_FLUX_PRO_11_TEXT_TO_IMAGE_PATH: &str = "/v1/generate/image/flux_pro_1.1_text_to_image";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateFluxPro11TextToImageRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// Text prompt to generate the image from.
  pub prompt: Option<String>,

  /// Aspect ratio of the output images.
  pub aspect_ratio: Option<GenerateFluxPro11TextToImageAspectRatio>,

  /// Number of images to generate. Default is one.
  pub num_images: Option<GenerateFluxPro11TextToImageNumImages>,
}

// TODO(btw,2026-01-01): Fal.ai and Fal.rs client libraries seem to disagree about the options.
#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateFluxPro11TextToImageAspectRatio {
  Square, // 1:1
  LandscapeFourByThree, // 4:3
  LandscapeSixteenByNine, // 16:9
  PortraitThreeByFour, // 3:4
  PortraitNineBySixteen, // 9:16
  //Custom { width: u32, height: u32 }, // TODO
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateFluxPro11TextToImageNumImages {
  One, // Default
  Two,
  Three,
  Four,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateFluxPro11TextToImageResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

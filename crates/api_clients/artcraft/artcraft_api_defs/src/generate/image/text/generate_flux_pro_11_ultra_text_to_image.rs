use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use utoipa::ToSchema;

pub const GENERATE_FLUX_PRO_11_ULTRA_TEXT_TO_IMAGE_PATH: &str = "/v1/generate/image/flux_pro_1.1_ultra_text_to_image";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateFluxPro11UltraTextToImageRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// Text prompt to generate the image from.
  pub prompt: Option<String>,

  /// Aspect ratio of the output images.
  pub aspect_ratio: Option<GenerateFluxPro11UltraTextToImageAspectRatio>,

  /// Number of images to generate. Default is one.
  pub num_images: Option<GenerateFluxPro11UltraTextToImageNumImages>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateFluxPro11UltraTextToImageAspectRatio {
  Square, // 1:1
  LandscapeThreeByTwo, // 3:2
  LandscapeFourByThree, // 4:3
  LandscapeSixteenByNine, // 16:9
  LandscapeTwentyOneByNine, // 21:9
  PortraitTwoByThree, // 2:3
  PortraitThreeByFour, // 3:4
  PortraitNineBySixteen, // 9:16
  PortraitNineByTwentyOne, // 9:21
  //Custom { width: u32, height: u32 }, // TODO
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateFluxPro11UltraTextToImageNumImages {
  One, // Default
  Two,
  Three,
  Four,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateFluxPro11UltraTextToImageResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

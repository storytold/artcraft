use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use utoipa::ToSchema;

pub const GENERATE_FLUX_1_SCHNELL_TEXT_TO_IMAGE_PATH: &str = "/v1/generate/image/flux_1_schnell_text_to_image";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateFlux1SchnellTextToImageRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// Text prompt to generate the image from.
  pub prompt: Option<String>,
  
  /// Aspect ratio of the output images.
  pub aspect_ratio: Option<GenerateFlux1SchnellTextToImageAspectRatio>,
  
  /// Number of images to generate. Default is one.
  pub num_images: Option<GenerateFlux1SchnellTextToImageNumImages>,
}


#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateFlux1SchnellTextToImageAspectRatio {
  Square, // 1:1
  SquareHd, // 1:1
  LandscapeFourByThree, // 4:3
  LandscapeSixteenByNine, // 16:9
  PortraitThreeByFour, // 3:4
  PortraitNineBySixteen, // 9:16
  //Custom { width: u32, height: u32 }, // TODO
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateFlux1SchnellTextToImageNumImages {
  One, // Default
  Two,
  Three,
  Four,
}


#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateFlux1SchnellTextToImageResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

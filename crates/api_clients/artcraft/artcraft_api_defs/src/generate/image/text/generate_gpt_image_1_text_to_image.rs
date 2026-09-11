use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const GPT_IMAGE_1_TEXT_TO_IMAGE_PATH: &str = "/v1/generate/image/gpt_image_1_text_to_image";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateGptImage1TextToImageRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// Text prompt to generate the image from.
  pub prompt: Option<String>,

  /// Size of the image to generate. Default is Square.
  pub image_size: Option<GenerateGptImage1TextToImageImageSize>,

  /// Number of images to generate. Default is one.
  pub num_images: Option<GenerateGptImage1TextToImageNumImages>,

  /// Quality of the image to generate. Default is High.
  pub image_quality: Option<GenerateGptImage1TextToImageImageQuality>,
}


#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateGptImage1TextToImageImageSize {
  Square, // 1:1, Default
  Horizontal,
  Vertical,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateGptImage1TextToImageNumImages {
  One, // Default
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateGptImage1TextToImageImageQuality {
  Auto,
  Low,
  Medium,
  High, // Default
}


#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateGptImage1TextToImageResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

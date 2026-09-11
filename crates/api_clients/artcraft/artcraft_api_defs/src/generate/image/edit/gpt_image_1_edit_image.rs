use serde_derive::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const GPT_IMAGE_1_EDIT_IMAGE_PATH: &str = "/v1/generate/image/edit/gpt_image_1";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GptImage1EditImageRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// Text prompt to generate the image from.
  pub prompt: Option<String>,

  // TODO: OneOf for image_urls or image_media_tokens
  /// Image media tokens to include in the editing context.
  pub image_media_tokens: Option<Vec<MediaFileToken>>,

  /// Size of the image to generate. Default is Square.
  pub image_size: Option<GptImage1EditImageImageSize>,

  /// Number of images to generate. Default is one.
  pub num_images: Option<GptImage1EditImageNumImages>,

  /// Quality of the image to generate. Default is High.
  pub image_quality: Option<GptImage1EditImageImageQuality>,
}


#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GptImage1EditImageImageSize {
  Square, // 1:1, Default
  Horizontal,
  Vertical,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GptImage1EditImageNumImages {
  One, // Default
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GptImage1EditImageImageQuality {
  Auto,
  Low,
  Medium,
  High, // Default
}


#[derive(Serialize, Deserialize, ToSchema)]
pub struct GptImage1EditImageResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

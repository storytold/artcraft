use serde::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const GENERATE_SEEDANCE_1_0_PRO_IMAGE_TO_VIDEO_URL_PATH: &str = "/v1/generate/video/seedance_1.0_pro_image_to_video";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateSeedance10ProImageToVideoRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,
  
  /// Source of the image file to convert to video.
  /// It must be an image.
  pub media_file_token: Option<MediaFileToken>,

  /// Optional text prompt.
  pub prompt: Option<String>,
  
  /// Optional: aspect ratio of the generated video.
  pub resolution: Option<GenerateSeedance10ProResolution>,

  /// Optional: aspect ratio of the generated video.
  pub duration: Option<GenerateSeedance10ProDuration>,
}

#[derive(Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateSeedance10ProResolution {
  FourEightyP,
  SevenTwentyP,
  TenEightyP,
}

#[derive(Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateSeedance10ProDuration {
  ThreeSeconds,
  FourSeconds,
  FiveSeconds,
  SixSeconds,
  SevenSeconds,
  EightSeconds,
  NineSeconds,
  TenSeconds,
  ElevenSeconds,
  TwelveSeconds,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateSeedance10ProImageToVideoResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

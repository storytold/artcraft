use serde::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const GENERATE_VEO_2_IMAGE_TO_VIDEO_URL_PATH: &str = "/v1/generate/video/veo_2_image_to_video";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateVeo2ImageToVideoRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,
  
  /// Source of the image file to convert to video.
  /// It must be an image.
  pub media_file_token: Option<MediaFileToken>,
  
  /// Optional text prompt.
  pub prompt: Option<String>,

  /// **NB(bt): ASPECT RATIO IS ACTUALLY NOT USED IN VEO 2 IMAGE-TO-VIDEO**
  /// Optional: aspect ratio of the generated video.
  pub aspect_ratio: Option<GenerateVeo2AspectRatio>,

  /// Optional: aspect ratio of the generated video.
  pub duration: Option<GenerateVeo2Duration>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateVeo2AspectRatio {
  Auto,
  AutoPreferPortrait,
  WideSixteenNine, // 16:9
  TallNineSixteen, // 9:16
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateVeo2Duration {
  FiveSeconds,
  SixSeconds,
  SevenSeconds,
  EightSeconds,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateVeo2ImageToVideoResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

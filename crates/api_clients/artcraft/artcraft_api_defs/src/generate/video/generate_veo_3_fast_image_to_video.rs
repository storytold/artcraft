use serde::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const GENERATE_VEO_3_FAST_IMAGE_TO_VIDEO_URL_PATH: &str = "/v1/generate/video/veo_3_fast_image_to_video";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateVeo3FastImageToVideoRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,
  
  /// Source of the image file to convert to video.
  /// It must be an image.
  pub media_file_token: Option<MediaFileToken>,
  
  /// Optional text prompt.
  pub prompt: Option<String>,

  /// Optional: resolution of the generated video.
  pub resolution: Option<GenerateVeo3FastResolution>,

  /// Optional: aspect ratio of the generated video.
  pub duration: Option<GenerateVeo3FastDuration>,

  /// Optional: Generate an audio track along with the video
  pub generate_audio: Option<bool>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateVeo3FastResolution {
  SevenTwentyP, // 720p
  TenEightyP, // 1080p
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateVeo3FastDuration {
  EightSeconds,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateVeo3FastImageToVideoResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

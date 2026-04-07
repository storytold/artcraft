use serde::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const GENERATE_VEO_3_IMAGE_TO_VIDEO_URL_PATH: &str = "/v1/generate/video/veo_3_image_to_video";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateVeo3ImageToVideoRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,
  
  /// Source of the image file to convert to video.
  /// It must be an image.
  pub media_file_token: Option<MediaFileToken>,
  
  /// Optional text prompt.
  pub prompt: Option<String>,

  /// Optional: aspect ratio of the generated video.
  pub aspect_ratio: Option<GenerateVeo3AspectRatio>,

  /// Optional: resolution of the generated video.
  pub resolution: Option<GenerateVeo3Resolution>,

  /// Optional: aspect ratio of the generated video.
  pub duration: Option<GenerateVeo3Duration>,

  /// Optional: Generate an audio track along with the video
  pub generate_audio: Option<bool>,

  // /// Optional.
  // pub enhance_prompt: Option<bool>,
  // /// Optional. Whether to automatically attempt to fix prompts that fail
  // /// content policy or other validation checks by rewriting them
  // /// Default value: true
  // pub auto_fix: Option<bool>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateVeo3AspectRatio {
  WideSixteenNine, // 16:9
  TallNineSixteen, // 9:16
  Square, // 1:1
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateVeo3Resolution {
  SevenTwentyP, // 720p
  TenEightyP, // 1080p
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateVeo3Duration {
  EightSeconds,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateVeo3ImageToVideoResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

use serde::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const GENERATE_KLING_2_1_MASTER_IMAGE_TO_VIDEO_URL_PATH: &str = "/v1/generate/video/kling_2.1_master_image_to_video";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateKling21MasterImageToVideoRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,
  
  /// Source of the image file to convert to video.
  /// It must be an image.
  pub media_file_token: Option<MediaFileToken>,
  
  /// Optional text prompt.
  pub prompt: Option<String>,
  
  /// Optional: aspect ratio of the generated video.
  pub aspect_ratio: Option<GenerateKling21MasterAspectRatio>,

  /// Optional: aspect ratio of the generated video.
  pub duration: Option<GenerateKling21MasterDuration>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateKling21MasterAspectRatio {
  /// 16:9 aspect ratio
  WideSixteenNine,
  /// 9:16 aspect ratio
  TallNineSixteen,
  /// 1:1 aspect ratio
  Square,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateKling21MasterDuration {
  FiveSeconds,
  TenSeconds,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateKling21MasterImageToVideoResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

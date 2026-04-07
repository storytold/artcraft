use serde::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const GENERATE_SEEDANCE_1_0_LITE_IMAGE_TO_VIDEO_URL_PATH: &str = "/v1/generate/video/seedance_1.0_lite_image_to_video";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateSeedance10LiteImageToVideoRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,
  
  /// Source of the image file to convert to video.
  /// It must be an image.
  pub media_file_token: Option<MediaFileToken>,

  /// Optional.
  /// Image media file; the image to remove the background from.
  pub end_frame_image_media_token: Option<MediaFileToken>,

  /// Optional text prompt.
  pub prompt: Option<String>,
  
  /// Optional: resolution of the generated video.
  pub resolution: Option<GenerateSeedance10LiteResolution>,

  /// Optional: duration of the generated video.
  pub duration: Option<GenerateSeedance10LiteDuration>,

  /// Optional: aspect ratio of the generated video.
  pub aspect_ratio: Option<GenerateSeedance10LiteAspectRatio>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateSeedance10LiteResolution {
  FourEightyP,
  SevenTwentyP,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateSeedance10LiteDuration {
  FiveSeconds,
  TenSeconds,
}


#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerateSeedance10LiteAspectRatio {
  Auto,
  TwentyOneByNine,
  SixteenByNine,
  FourByThree,
  Square,
  ThreeByFour,
  NineBySixteen,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GenerateSeedance10LiteImageToVideoResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

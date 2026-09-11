use serde::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const SORA_2_MULTI_FUNCTION_VIDEO_VIDEO_PATH: &str = "/v1/generate/video/multi_function/sora_2";

/// Both text-to-video and image-to-video in one request.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct Sora2MultiFunctionVideoGenRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// "Required".
  /// Required downstream, but we'll coerce null to empty string.
  /// Text prompt.
  pub prompt: Option<String>,

  /// Optional.
  /// Only for image-to-video
  /// Source of the starting frame
  /// If present, we're doing image-to-video
  /// If absent, we're doing text-to-video
  pub image_media_token: Option<MediaFileToken>,

  /// Optional.
  pub resolution: Option<Sora2MultiFunctionVideoGenResolution>,

  /// Optional
  /// Duration of the video
  /// (this is uniform against all modes)
  pub duration: Option<Sora2MultiFunctionVideoGenDuration>,

  /// Optional.
  pub aspect_ratio: Option<Sora2MultiFunctionVideoGenAspectRatio>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum Sora2MultiFunctionVideoGenResolution {
  Auto,
  SevenTwentyP,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum Sora2MultiFunctionVideoGenDuration {
  FourSeconds,
  EightSeconds,
  TwelveSeconds,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum Sora2MultiFunctionVideoGenAspectRatio {
  Auto,
  NineBySixteen,
  SixteenByNine,
}


#[derive(Serialize, Deserialize, ToSchema)]
pub struct Sora2MultiFunctionVideoGenResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

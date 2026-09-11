use serde::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const KLING_3P0_PRO_MULTI_FUNCTION_VIDEO_PATH: &str = "/v1/generate/video/multi_function/kling_3p0_pro";

/// Both text-to-video and image-to-video in one request.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct Kling3p0ProMultiFunctionVideoGenRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// Text prompt.
  pub prompt: Option<String>,

  /// Optional negative prompt.
  pub negative_prompt: Option<String>,

  /// If present, we're doing image-to-video. If absent, text-to-video.
  pub image_media_token: Option<MediaFileToken>,

  /// Optional end frame image.
  pub end_image_media_token: Option<MediaFileToken>,

  /// Duration of the video (3-15 seconds).
  pub duration: Option<Kling3p0ProMultiFunctionVideoGenDuration>,

  /// Whether to generate audio.
  pub generate_audio: Option<bool>,

  /// Aspect ratio (only for text-to-video).
  pub aspect_ratio: Option<Kling3p0ProMultiFunctionVideoGenAspectRatio>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum Kling3p0ProMultiFunctionVideoGenDuration {
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
  ThirteenSeconds,
  FourteenSeconds,
  FifteenSeconds,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum Kling3p0ProMultiFunctionVideoGenAspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct Kling3p0ProMultiFunctionVideoGenResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

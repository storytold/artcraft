use serde::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const KLING_2P5_TURBO_PRO_MULTI_FUNCTION_VIDEO_VIDEO_PATH: &str = "/v1/generate/video/multi_function/kling_2p5_turbo_pro";

/// Both text-to-video and image-to-video in one request.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct Kling2p5TurboProMultiFunctionVideoGenRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// "Required".
  /// Required downstream, but we'll coerce null to empty string.
  /// Text prompt.
  pub prompt: Option<String>,

  /// Optional.
  /// Only for text-to-video.
  pub negative_prompt: Option<String>,

  /// Optional.
  /// Only for image-to-video
  /// Source of the starting frame
  /// If present, we're doing image-to-video
  /// If absent, we're doing text-to-video
  pub start_frame_image_media_token: Option<MediaFileToken>,

  /// Optional.
  /// Only for image-to-video
  /// Source of the ending frame (if desired)
  pub end_frame_image_media_token: Option<MediaFileToken>,

  /// Optional
  /// Duration of the video
  pub duration: Option<Kling2p5TurboProMultiFunctionVideoGenDuration>,

  /// Optional.
  /// Only for text-to-video
  pub aspect_ratio: Option<Kling2p5TurboProMultiFunctionVideoGenAspectRatio>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum Kling2p5TurboProMultiFunctionVideoGenDuration {
  FiveSeconds,
  TenSeconds,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum Kling2p5TurboProMultiFunctionVideoGenAspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
}


#[derive(Serialize, Deserialize, ToSchema)]
pub struct Kling2p5TurboProMultiFunctionVideoGenResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

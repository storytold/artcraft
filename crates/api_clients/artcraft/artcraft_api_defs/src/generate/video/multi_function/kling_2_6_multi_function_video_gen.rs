use serde::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const KLING_2P6_PRO_MULTI_FUNCTION_VIDEO_VIDEO_PATH: &str = "/v1/generate/video/multi_function/kling_2p6_pro";

/// Both text-to-video and image-to-video in one request.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct Kling2p6ProMultiFunctionVideoGenRequest {
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

  // /// Optional.
  // /// Only for image-to-video
  // /// Source of the ending frame (if desired)
  // pub end_frame_image_media_token: Option<MediaFileToken>,

  /// Optional
  /// Duration of the video
  pub duration: Option<Kling2p6ProMultiFunctionVideoGenDuration>,

  /// Optional
  /// Whether to generate audio.
  pub generate_audio: Option<bool>,

  /// Optional.
  /// Only for text-to-video
  pub aspect_ratio: Option<Kling2p6ProMultiFunctionVideoGenAspectRatio>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum Kling2p6ProMultiFunctionVideoGenDuration {
  FiveSeconds,
  TenSeconds,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum Kling2p6ProMultiFunctionVideoGenAspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
}


#[derive(Serialize, Deserialize, ToSchema)]
pub struct Kling2p6ProMultiFunctionVideoGenResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

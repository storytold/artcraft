use serde::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const VEO_3P1_MULTI_FUNCTION_VIDEO_VIDEO_PATH: &str = "/v1/generate/video/multi_function/veo_3p1";

/// Both text-to-video and image-to-video in one request.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct Veo3p1MultiFunctionVideoGenRequest {
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
  /// (this is uniform against all modes)
  pub duration: Option<Veo3p1MultiFunctionVideoGenDuration>,

  /// Optional.
  pub aspect_ratio: Option<Veo3p1MultiFunctionVideoGenAspectRatio>,
  
  /// Optional.
  pub resolution: Option<Veo3p1MultiFunctionVideoGenResolution>,

  /// Optional
  /// Whether to generate audio.
  pub generate_audio: Option<bool>,

  /// Optional
  /// Only for text-to-video
  pub enhance_prompt: Option<bool>,

  /// Optional
  /// Only for text-to-video
  pub seed: Option<i64>,

  /// Optional
  /// Only for text-to-video
  pub auto_fix: Option<bool>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum Veo3p1MultiFunctionVideoGenDuration {
  FourSeconds,
  SixSeconds,
  EightSeconds,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum Veo3p1MultiFunctionVideoGenAspectRatio {
  Auto,
  SixteenByNine,
  NineBySixteen,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum Veo3p1MultiFunctionVideoGenResolution {
  SevenTwentyP,
  TenEightyP,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct Veo3p1MultiFunctionVideoGenResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

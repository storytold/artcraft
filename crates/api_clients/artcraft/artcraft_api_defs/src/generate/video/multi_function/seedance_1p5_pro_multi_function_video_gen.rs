use serde::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const SEEDANCE_1P5_PRO_MULTI_FUNCTION_VIDEO_GEN_PATH: &str = "/v1/generate/video/multi_function/seedance_1p5_pro";

/// Both text-to-video and image-to-video in one request.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct Seedance1p5ProMultiFunctionVideoGenRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// "Required".
  /// Required downstream, but we'll coerce null to empty string.
  /// Text prompt.
  pub prompt: Option<String>,

  /// Optional.
  /// Only for image-to-video.
  /// Source of the starting frame.
  /// If present, we're doing image-to-video.
  /// If absent, we're doing text-to-video.
  pub start_frame_image_media_token: Option<MediaFileToken>,

  /// Optional.
  /// Only for image-to-video.
  /// Source of the ending frame.
  pub end_frame_image_media_token: Option<MediaFileToken>,

  /// Optional.
  pub resolution: Option<Seedance1p5ProMultiFunctionVideoGenResolution>,

  /// Optional.
  /// Duration of the video.
  /// (this is uniform against all modes)
  pub duration: Option<Seedance1p5ProMultiFunctionVideoGenDuration>,

  /// Optional.
  pub aspect_ratio: Option<Seedance1p5ProMultiFunctionVideoGenAspectRatio>,
}

#[derive(Serialize, Deserialize, ToSchema, Copy, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub enum Seedance1p5ProMultiFunctionVideoGenResolution {
  FourEightyP,
  SevenTwentyP,
  TenEightyP,
}

#[derive(Serialize, Deserialize, ToSchema, Copy, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub enum Seedance1p5ProMultiFunctionVideoGenDuration {
  FourSeconds,
  FiveSeconds,
  SixSeconds,
  SevenSeconds,
  EightSeconds,
  NineSeconds,
  TenSeconds,
  ElevenSeconds,
  TwelveSeconds,
}

#[derive(Serialize, Deserialize, ToSchema, Copy, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub enum Seedance1p5ProMultiFunctionVideoGenAspectRatio {
  TwentyOneByNine,
  SixteenByNine,
  FourByThree,
  Square,
  ThreeByFour,
  NineBySixteen,
  Auto,
}


#[derive(Serialize, Deserialize, ToSchema)]
pub struct Seedance1p5ProMultiFunctionVideoGenResponse {
  pub success: bool,
  pub inference_job_token: InferenceJobToken,
}

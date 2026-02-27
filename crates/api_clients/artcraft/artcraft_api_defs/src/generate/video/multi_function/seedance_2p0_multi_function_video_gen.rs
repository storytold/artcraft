use serde::{Deserialize, Serialize};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

pub const SEEDANCE_2P0_MULTI_FUNCTION_VIDEO_GEN_PATH: &str = "/v1/generate/video/multi_function/seedance_2p0";

/// Seedance 2.0 multi-function video generation (text-to-video, image-to-video, and reference-based).
#[derive(Serialize, Deserialize, ToSchema)]
pub struct Seedance2p0MultiFunctionVideoGenRequest {
  /// Idempotency token to prevent duplicate requests.
  pub uuid_idempotency_token: String,

  /// Text prompt.
  pub prompt: Option<String>,

  /// Optional start frame image.
  pub start_frame_media_token: Option<MediaFileToken>,

  /// Optional end frame image.
  pub end_frame_media_token: Option<MediaFileToken>,

  /// Optional reference images (reference mode). When present, takes priority over start/end frames.
  pub reference_image_media_tokens: Option<Vec<MediaFileToken>>,

  /// Video aspect ratio / resolution.
  pub aspect_ratio: Option<Seedance2p0AspectRatio>,

  /// Duration in seconds (4–15).
  pub duration_seconds: Option<u8>,

  /// Number of videos to generate.
  pub batch_count: Option<Seedance2p0BatchCount>,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum Seedance2p0AspectRatio {
  /// 16:9 landscape (1280x720)
  Landscape16x9,
  /// 9:16 portrait (720x1280)
  Portrait9x16,
  /// 1:1 square (720x720)
  Square1x1,
  /// 4:3 standard (960x720)
  Standard4x3,
  /// 3:4 portrait (720x960)
  Portrait3x4,
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum Seedance2p0BatchCount {
  One,
  Two,
  Four,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct Seedance2p0MultiFunctionVideoGenResponse {
  pub success: bool,

  /// The first inference job token (always present).
  pub inference_job_token: InferenceJobToken,

  /// All inference job tokens for the batch (includes `inference_job_token` as the first entry).
  pub all_inference_job_tokens: Vec<InferenceJobToken>,
}

#[cfg(test)]
mod tests {
  use super::*;

  fn aspect_to_string(input: Seedance2p0AspectRatio) -> anyhow::Result<String> {
    let val = serde_json::to_string(&input)?;
    Ok(val.replace("\"", ""))
  }

  #[test]
  fn just_testing_snake_case() -> anyhow::Result<()> {
    // Ugh, not sure what these are...
    assert_eq!(aspect_to_string(Seedance2p0AspectRatio::Landscape16x9)?, "landscape16x9");
    Ok(())
  }
}
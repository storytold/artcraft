use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_quality::CommonQuality;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;
use tokens::tokens::media_files::MediaFileToken;

/// Shared request body for both the video cost estimate and video generation endpoints.
#[derive(Serialize, Deserialize, ToSchema, Debug)]
pub struct OmniGenVideoCostAndGenerateRequest {
  /// REQUIRED (even if marked optional)
  /// Idempotency token to prevent duplicate requests.
  pub idempotency_token: Option<String>,

  /// REQUIRED (even if marked optional)
  /// Which model to use.
  pub model: Option<CommonVideoModel>,

  /// The text prompt for the video generation.
  pub prompt: Option<String>,

  /// Some models support negative text prompts.
  pub negative_prompt: Option<String>,

  /// Starting keyframe (optional).
  pub start_frame_image_media_token: Option<MediaFileToken>,

  /// Ending keyframe (optional).
  pub end_frame_image_media_token: Option<MediaFileToken>,

  /// Reference images (optional).
  pub reference_image_media_tokens: Option<Vec<MediaFileToken>>,

  /// Reference videos (optional).
  pub reference_video_media_tokens: Option<Vec<MediaFileToken>>,

  /// Reference audio (optional).
  pub reference_audio_media_tokens: Option<Vec<MediaFileToken>>,

  /// The resolution to use.
  pub resolution: Option<CommonResolution>,

  /// The aspect ratio to use.
  pub aspect_ratio: Option<CommonAspectRatio>,

  /// The quality to use.
  pub quality: Option<CommonQuality>,

  /// How many seconds to generate.
  pub duration_seconds: Option<u16>,

  /// How many videos to generate.
  pub video_batch_count: Option<u16>,

  /// Whether to turn on/off audio.
  /// Not all models support audio, not all models have a choice.
  /// Some models will default this to true, others will default it to false,
  /// so it's best to be explicit.
  pub generate_audio: Option<bool>,
}

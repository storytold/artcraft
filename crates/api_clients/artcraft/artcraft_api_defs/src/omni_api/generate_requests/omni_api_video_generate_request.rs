use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_bitrate::CommonBitrate;
use enums::common::generation::common_quality::CommonQuality;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;
use tokens::tokens::characters::CharacterToken;
use tokens::tokens::media_files::MediaFileToken;

/// Request body for the Omni API video generation endpoint.
///
/// Forked from `OmniGenVideoCostAndGenerateRequest` so the Omni API's request
/// shape can evolve independently without affecting the product-critical Omni
/// Gen endpoints.
#[derive(Clone, Serialize, Deserialize, ToSchema, Debug)]
pub struct OmniApiVideoGenerateRequest {
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

  /// URL alternative to `start_frame_image_media_token`. Mutually exclusive with it.
  /// Downloaded and stored as a media file before generation.
  pub start_frame_image_url: Option<String>,

  /// Ending keyframe (optional).
  pub end_frame_image_media_token: Option<MediaFileToken>,

  /// URL alternative to `end_frame_image_media_token`. Mutually exclusive with it.
  /// Downloaded and stored as a media file before generation.
  pub end_frame_image_url: Option<String>,

  /// Reference images (optional).
  pub reference_image_media_tokens: Option<Vec<MediaFileToken>>,

  /// URL alternative to `reference_image_media_tokens`. Mutually exclusive with it.
  /// Each URL is downloaded and stored as a media file before generation.
  pub reference_image_urls: Option<Vec<String>>,

  /// Reference videos (optional).
  pub reference_video_media_tokens: Option<Vec<MediaFileToken>>,

  /// URL alternative to `reference_video_media_tokens`. Mutually exclusive with it.
  /// Each URL is downloaded and stored as a media file before generation.
  pub reference_video_urls: Option<Vec<String>>,

  /// Reference audio (optional).
  pub reference_audio_media_tokens: Option<Vec<MediaFileToken>>,

  /// URL alternative to `reference_audio_media_tokens`. Mutually exclusive with it.
  /// Each URL is downloaded and stored as a media file before generation.
  pub reference_audio_urls: Option<Vec<String>>,

  /// Optional character tokens to reference in the prompt.
  /// Characters are referenced in prompts as @CharacterName.
  pub reference_character_tokens: Option<Vec<CharacterToken>>,

  /// The resolution to use.
  pub resolution: Option<CommonResolution>,

  /// The aspect ratio to use.
  pub aspect_ratio: Option<CommonAspectRatio>,

  /// The output bitrate to use.
  /// Not all models support this; models that don't simply ignore it.
  pub bitrate: Option<CommonBitrate>,

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

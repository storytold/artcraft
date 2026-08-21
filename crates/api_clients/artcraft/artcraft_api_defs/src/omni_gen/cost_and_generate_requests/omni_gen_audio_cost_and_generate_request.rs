use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use enums::common::generation::common_audio_model::CommonAudioModel;
use enums::common::generation::common_musical_key::CommonMusicalKey;
use tokens::tokens::media_files::MediaFileToken;

/// Shared request body for both the audio cost estimate and audio generation endpoints.
#[derive(Clone, Serialize, Deserialize, ToSchema, Debug)]
pub struct OmniGenAudioCostAndGenerateRequest {
  /// REQUIRED (even if marked optional)
  /// Idempotency token to prevent duplicate requests.
  pub idempotency_token: Option<String>,

  /// REQUIRED (even if marked optional)
  /// Which model to use.
  pub model: Option<CommonAudioModel>,

  /// The text prompt for the audio generation.
  pub prompt: Option<String>,

  /// Style/genre direction (Suno's "tags").
  pub style_prompt: Option<String>,

  /// Reference audio (optional).
  /// The remix/sample source, or Seed Audio @Audio references (up to 3).
  pub audio_media_tokens: Option<Vec<MediaFileToken>>,

  /// Reference image (optional).
  /// Seed Audio supports a single reference image; cannot be combined with audio references.
  pub image_media_tokens: Option<Vec<MediaFileToken>>,

  /// Whether to keep the original lyrics (Suno Remix).
  pub keep_lyrics: Option<bool>,

  /// Whether to generate instrumental-only audio (Suno Music / Sample).
  pub is_instrumental: Option<bool>,

  /// Whether the sound should loop vs a single hit (Suno Sounds).
  pub is_loopable: Option<bool>,

  /// Beats per minute (Suno Sounds).
  pub bpm: Option<u16>,

  /// The musical key to use (Suno Sounds).
  pub musical_key: Option<CommonMusicalKey>,

  /// Output sample rate in Hz (Seed Audio: 8000/16000/24000/32000/44100/48000).
  pub sample_rate_hz: Option<u32>,

  /// Playback speed multiplier (Seed Audio: 0.5–2.0).
  pub speed: Option<f64>,

  /// Volume multiplier (Seed Audio: 0.5–2.0).
  pub volume: Option<f64>,

  /// Pitch shift in semitones (Seed Audio: -12..=12).
  pub pitch: Option<f64>,
}

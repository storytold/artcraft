use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `bytedance/seed-audio-1.0`.
/// fal's schema: <https://fal.ai/models/bytedance/seed-audio-1.0/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SeedAudio1p0Input {
  /// Text to synthesize. Reference audio clips are cited in the prompt as
  /// `@Audio1`, `@Audio2`, `@Audio3`.
  pub prompt: String,

  /// Voice to use: a preset voice name or a cloned voice id.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub voice: Option<String>,

  /// Up to 3 reference audio URLs (each ≤30s and ≤10MB; wav/mp3/pcm/ogg_opus).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub audio_urls: Option<Vec<String>>,

  /// A single reference image URL (jpeg/png/webp, ≤10MB).
  /// Cannot be combined with audio references.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_url: Option<String>,

  /// Output container.
  /// Possible values: "wav", "mp3", "pcm", "ogg_opus". fal default: "mp3".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,

  /// Output sample rate in Hz.
  /// Possible values: 8000, 16000, 24000, 32000, 44100, 48000. fal default: 24000.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub sample_rate: Option<u32>,

  /// Speech speed multiplier. Range 0.5–2.0. fal default: 1.0.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub speed: Option<f64>,

  /// Volume multiplier. Range 0.5–2.0. fal default: 1.0.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub volume: Option<f64>,

  /// Pitch shift in semitones. Range −12 to +12. fal default: 0.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub pitch: Option<i8>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SeedAudio1p0AudioFile {
  pub url: String,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub content_type: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub file_name: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub file_size: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SeedAudio1p0Output {
  pub audio: SeedAudio1p0AudioFile,
}

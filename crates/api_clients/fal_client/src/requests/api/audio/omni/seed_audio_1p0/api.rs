use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::audio::omni::seed_audio_1p0::raw_request::{
  SeedAudio1p0Input, SeedAudio1p0Output,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// ByteDance Seed Audio 1.0: omni audio generation (speech, drama, ambience)
/// with voice presets, voice cloning, and audio/image references.
#[derive(Clone, Debug)]
pub struct SeedAudio1p0Request {
  /// Text to synthesize. Reference audio clips supplied via `audio_urls` are
  /// cited in the prompt as `@Audio1`, `@Audio2`, `@Audio3`.
  pub prompt: String,

  /// Voice to synthesize with: a preset or a cloned voice id.
  /// The model picks a voice when `None`.
  pub voice: Option<SeedAudio1p0Voice>,

  /// Up to 3 reference audio URLs, cited in the prompt as `@Audio1`–`@Audio3`.
  /// Each clip: ≤30 seconds, ≤10MB, wav/mp3/pcm/ogg_opus.
  pub audio_urls: Option<Vec<String>>,

  /// A single reference image URL (jpeg/png/webp, ≤10MB) to condition the
  /// generation on (e.g. a scene to voice over).
  /// NB: fal rejects requests that combine an image reference with audio
  /// references — set `image_url` or `audio_urls`, not both.
  pub image_url: Option<String>,

  /// Output container. fal's default is mp3 when `None`.
  pub output_format: Option<SeedAudio1p0OutputFormat>,

  /// Output sample rate. fal's default is 24 kHz when `None`.
  pub sample_rate: Option<SeedAudio1p0SampleRate>,

  /// Speech speed multiplier. Valid range 0.5–2.0; fal's default is 1.0
  /// when `None`.
  pub speed: Option<f64>,

  /// Volume multiplier. Valid range 0.5–2.0; fal's default is 1.0 when `None`.
  pub volume: Option<f64>,

  /// Pitch shift in semitones. Valid range −12 to +12; fal's default is 0
  /// when `None`.
  pub pitch: Option<i8>,
}

/// A voice for Seed Audio: either one of fal's preset voices or a cloned
/// voice id.
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum SeedAudio1p0Voice {
  Preset(SeedAudio1p0VoicePreset),
  /// The id of a cloned voice.
  Custom(String),
}

impl SeedAudio1p0Voice {
  fn to_wire_string(&self) -> String {
    match self {
      Self::Preset(preset) => preset.to_str().to_string(),
      Self::Custom(voice_id) => voice_id.clone(),
    }
  }
}

/// fal's preset voices. The suffixes name the languages each voice supports
/// (en = English, zh = Chinese, ja = Japanese, es = Spanish, id = Indonesian,
/// pt = Portuguese).
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum SeedAudio1p0VoicePreset {
  ViviMixedEnZhJaEsId,
  MindyEnEsIdPtZh,
  KianEnZh,
  CedricEnZh,
  SophieEnZh,
  JeanEnZh,
  MagnusEnZh,
  MabelEnZh,
  NadiaEnZh,
  OpalEnZh,
  PearlEnZh,
  QuentinEnZh,
  CorinneMixedEnZh,
  EstherMixedEnZh,
  LylaMixedEnZh,
  TracyEsZh,
  SandyEsMixedEnZh,
  FelixZh,
  CelesteZh,
  MonkeyKingZh,
}

impl SeedAudio1p0VoicePreset {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::ViviMixedEnZhJaEsId => "vivi_mixed_en_zh_ja_es_id",
      Self::MindyEnEsIdPtZh => "mindy_en_es_id_pt_zh",
      Self::KianEnZh => "kian_en_zh",
      Self::CedricEnZh => "cedric_en_zh",
      Self::SophieEnZh => "sophie_en_zh",
      Self::JeanEnZh => "jean_en_zh",
      Self::MagnusEnZh => "magnus_en_zh",
      Self::MabelEnZh => "mabel_en_zh",
      Self::NadiaEnZh => "nadia_en_zh",
      Self::OpalEnZh => "opal_en_zh",
      Self::PearlEnZh => "pearl_en_zh",
      Self::QuentinEnZh => "quentin_en_zh",
      Self::CorinneMixedEnZh => "corinne_mixed_en_zh",
      Self::EstherMixedEnZh => "esther_mixed_en_zh",
      Self::LylaMixedEnZh => "lyla_mixed_en_zh",
      Self::TracyEsZh => "tracy_es_zh",
      Self::SandyEsMixedEnZh => "sandy_es_mixed_en_zh",
      Self::FelixZh => "felix_zh",
      Self::CelesteZh => "celeste_zh",
      Self::MonkeyKingZh => "monkey_king_zh",
    }
  }

  pub fn all() -> [Self; 20] {
    [
      Self::ViviMixedEnZhJaEsId,
      Self::MindyEnEsIdPtZh,
      Self::KianEnZh,
      Self::CedricEnZh,
      Self::SophieEnZh,
      Self::JeanEnZh,
      Self::MagnusEnZh,
      Self::MabelEnZh,
      Self::NadiaEnZh,
      Self::OpalEnZh,
      Self::PearlEnZh,
      Self::QuentinEnZh,
      Self::CorinneMixedEnZh,
      Self::EstherMixedEnZh,
      Self::LylaMixedEnZh,
      Self::TracyEsZh,
      Self::SandyEsMixedEnZh,
      Self::FelixZh,
      Self::CelesteZh,
      Self::MonkeyKingZh,
    ]
  }
}

/// Output audio container.
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum SeedAudio1p0OutputFormat {
  Wav,
  /// fal's default.
  Mp3,
  Pcm,
  OggOpus,
}

impl SeedAudio1p0OutputFormat {
  fn to_str(&self) -> &'static str {
    match self {
      Self::Wav => "wav",
      Self::Mp3 => "mp3",
      Self::Pcm => "pcm",
      Self::OggOpus => "ogg_opus",
    }
  }
}

/// Output sample rate.
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum SeedAudio1p0SampleRate {
  Hz8000,
  Hz16000,
  /// fal's default.
  Hz24000,
  Hz32000,
  Hz44100,
  Hz48000,
}

impl SeedAudio1p0SampleRate {
  fn as_hz(&self) -> u32 {
    match self {
      Self::Hz8000 => 8_000,
      Self::Hz16000 => 16_000,
      Self::Hz24000 => 24_000,
      Self::Hz32000 => 32_000,
      Self::Hz44100 => 44_100,
      Self::Hz48000 => 48_000,
    }
  }
}

impl FalEndpoint for SeedAudio1p0Request {
  const ENDPOINT: &str = "bytedance/seed-audio-1.0";

  type RawRequest = SeedAudio1p0Input;
  type RawResponse = SeedAudio1p0Output;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      voice: self.voice.as_ref().map(|voice| voice.to_wire_string()),
      audio_urls: self.audio_urls.clone(),
      image_url: self.image_url.clone(),
      output_format: self.output_format.map(|format| format.to_str().to_string()),
      sample_rate: self.sample_rate.map(|rate| rate.as_hz()),
      speed: self.speed,
      volume: self.volume,
      pitch: self.pitch,
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::traits::fal_endpoint_trait::FalEndpoint;
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  // ── Real requests (manually run; require a live key and cost money) ──

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_seed_audio_queue_minimal() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = SeedAudio1p0Request {
      prompt: "Generate a short suspense radio drama in a late-night convenience store.".to_string(),
      voice: None,
      audio_urls: None,
      image_url: None,
      output_format: None,
      sample_rate: None,
      speed: None,
      volume: None,
      pitch: None,
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_seed_audio_queue_preset_voice_tuned() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = SeedAudio1p0Request {
      prompt: "Welcome aboard the midnight express. Please keep your arms inside the train at all times.".to_string(),
      voice: Some(SeedAudio1p0Voice::Preset(SeedAudio1p0VoicePreset::MagnusEnZh)),
      audio_urls: None,
      image_url: None,
      output_format: Some(SeedAudio1p0OutputFormat::Wav),
      sample_rate: Some(SeedAudio1p0SampleRate::Hz44100),
      speed: Some(0.9),
      volume: Some(1.2),
      pitch: Some(-2),
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_seed_audio_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = SeedAudio1p0Request {
      prompt: "A calm narrator describes ocean waves rolling onto a moonlit beach.".to_string(),
      voice: Some(SeedAudio1p0Voice::Preset(SeedAudio1p0VoicePreset::SophieEnZh)),
      audio_urls: None,
      image_url: None,
      output_format: Some(SeedAudio1p0OutputFormat::Mp3),
      sample_rate: None,
      speed: None,
      volume: None,
      pitch: None,
    };

    let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
    println!("Webhook result: {:?}", result);
    assert!(result.request_id.is_some() || result.gateway_request_id.is_some());
    Ok(())
  }

  // ── Wire-shape sanity (no API calls) ──

  #[test]
  fn raw_request_maps_all_fields() {
    let request = SeedAudio1p0Request {
      prompt: "Read @Audio1 in this voice.".to_string(),
      voice: Some(SeedAudio1p0Voice::Preset(SeedAudio1p0VoicePreset::ViviMixedEnZhJaEsId)),
      audio_urls: Some(vec![
        "https://example.com/a1.mp3".to_string(),
        "https://example.com/a2.wav".to_string(),
        "https://example.com/a3.ogg".to_string(),
      ]),
      image_url: None,
      output_format: Some(SeedAudio1p0OutputFormat::OggOpus),
      sample_rate: Some(SeedAudio1p0SampleRate::Hz48000),
      speed: Some(1.5),
      volume: Some(0.5),
      pitch: Some(12),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "Read @Audio1 in this voice.");
    assert_eq!(raw.voice.as_deref(), Some("vivi_mixed_en_zh_ja_es_id"));
    assert_eq!(raw.audio_urls.as_ref().map(|urls| urls.len()), Some(3));
    assert_eq!(raw.image_url, None);
    assert_eq!(raw.output_format.as_deref(), Some("ogg_opus"));
    assert_eq!(raw.sample_rate, Some(48_000));
    assert_eq!(raw.speed, Some(1.5));
    assert_eq!(raw.volume, Some(0.5));
    assert_eq!(raw.pitch, Some(12));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = SeedAudio1p0Request {
      prompt: "minimal".to_string(),
      voice: None,
      audio_urls: None,
      image_url: None,
      output_format: None,
      sample_rate: None,
      speed: None,
      volume: None,
      pitch: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({ "prompt": "minimal" }));
  }

  #[test]
  fn custom_voice_id_passes_through_verbatim() {
    let request = SeedAudio1p0Request {
      prompt: "p".to_string(),
      voice: Some(SeedAudio1p0Voice::Custom("my_cloned_voice_id_123".to_string())),
      audio_urls: None,
      image_url: None,
      output_format: None,
      sample_rate: None,
      speed: None,
      volume: None,
      pitch: None,
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.voice.as_deref(), Some("my_cloned_voice_id_123"));
  }

  #[test]
  fn image_url_serializes_when_set() {
    let request = SeedAudio1p0Request {
      prompt: "Narrate this scene.".to_string(),
      voice: None,
      audio_urls: None,
      image_url: Some("https://example.com/scene.png".to_string()),
      output_format: None,
      sample_rate: None,
      speed: None,
      volume: None,
      pitch: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({
        "prompt": "Narrate this scene.",
        "image_url": "https://example.com/scene.png",
      }),
    );
  }

  #[test]
  fn negative_pitch_serializes() {
    let request = SeedAudio1p0Request {
      prompt: "p".to_string(),
      voice: None,
      audio_urls: None,
      image_url: None,
      output_format: None,
      sample_rate: None,
      speed: None,
      volume: None,
      pitch: Some(-12),
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json.get("pitch").and_then(|p| p.as_i64()), Some(-12));
  }

  #[test]
  fn every_voice_preset_maps_to_wire_string() {
    let expected = [
      "vivi_mixed_en_zh_ja_es_id",
      "mindy_en_es_id_pt_zh",
      "kian_en_zh",
      "cedric_en_zh",
      "sophie_en_zh",
      "jean_en_zh",
      "magnus_en_zh",
      "mabel_en_zh",
      "nadia_en_zh",
      "opal_en_zh",
      "pearl_en_zh",
      "quentin_en_zh",
      "corinne_mixed_en_zh",
      "esther_mixed_en_zh",
      "lyla_mixed_en_zh",
      "tracy_es_zh",
      "sandy_es_mixed_en_zh",
      "felix_zh",
      "celeste_zh",
      "monkey_king_zh",
    ];
    for (preset, expected) in SeedAudio1p0VoicePreset::all().iter().zip(expected) {
      assert_eq!(preset.to_str(), expected, "wire value for {preset:?}");
    }
  }

  #[test]
  fn every_output_format_maps_to_wire_string() {
    for (variant, expected) in [
      (SeedAudio1p0OutputFormat::Wav, "wav"),
      (SeedAudio1p0OutputFormat::Mp3, "mp3"),
      (SeedAudio1p0OutputFormat::Pcm, "pcm"),
      (SeedAudio1p0OutputFormat::OggOpus, "ogg_opus"),
    ] {
      assert_eq!(variant.to_str(), expected);
    }
  }

  #[test]
  fn every_sample_rate_maps_to_hz() {
    for (variant, expected) in [
      (SeedAudio1p0SampleRate::Hz8000, 8_000),
      (SeedAudio1p0SampleRate::Hz16000, 16_000),
      (SeedAudio1p0SampleRate::Hz24000, 24_000),
      (SeedAudio1p0SampleRate::Hz32000, 32_000),
      (SeedAudio1p0SampleRate::Hz44100, 44_100),
      (SeedAudio1p0SampleRate::Hz48000, 48_000),
    ] {
      assert_eq!(variant.as_hz(), expected);
    }
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(SeedAudio1p0Request::ENDPOINT, "bytedance/seed-audio-1.0");
  }

  // NB: Pricing tests are in cost.rs
}

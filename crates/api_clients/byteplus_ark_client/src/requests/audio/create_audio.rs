use crate::creds::seed_audio_api_key::SeedAudioApiKey;
use crate::error::ark_api_error::{ArkApiError, ArkApiErrorKind};
use crate::error::ark_error::ArkError;
use base64::Engine;
use base64::engine::general_purpose::STANDARD;
use log::{debug, warn};
use reqwest::Client;
use serde_derive::{Deserialize, Serialize};
use std::time::Duration;

/// Seed Audio runs on the BytePlus voice service, not on the ModelArk host.
pub const SEED_AUDIO_CREATE_URL: &str = "https://voice.ap-southeast-1.bytepluses.com/api/v3/tts/create";

/// English and Chinese.
pub const SEED_AUDIO_1_MODEL_ID: &str = "seed-audio-1.0";

/// 20 languages and timestamp markers.
pub const SEED_AUDIO_1_MULTILINGUAL_MODEL_ID: &str = "seed-audio-1.0-multilingual";

/// The documented `text_prompt` limit.
pub const MAX_TEXT_PROMPT_CHARS: usize = 3000;

/// Up to 120 seconds of audio come back in the response itself.
const CREATE_AUDIO_TIMEOUT: Duration = Duration::from_secs(180);

/// Words in a rejection message meaning the prompt or a voice reference was refused.
const MODERATION_MARKERS: [&str; 6] = ["sensitive", "voiceprint", "voice clone", "audit", "risk", "content"];

/// POST /api/v3/tts/create
#[derive(Clone, Serialize)]
pub struct CreateAudioRequest {
  pub model: String,

  /// What to generate: a scene, a song, or lines to speak (up to 2048 characters). Audio
  /// references are cited in order as `@Audio1`, `@Audio2` and `@Audio3`.
  pub text_prompt: String,

  /// Up to 3 audio references, or exactly 1 image reference (the two can't be mixed).
  #[serde(skip_serializing_if = "Vec::is_empty")]
  pub references: Vec<AudioReference>,

  pub audio_config: AudioConfig,

  /// Watermark options; an empty object means no watermark.
  pub watermark: AudioWatermark,
}

/// The generated audio.
pub struct GeneratedAudio {
  pub bytes: Vec<u8>,

  /// Utterance timings, when `enable_subtitle` asked for them.
  pub subtitle_lines: Vec<SubtitleLine>,

  /// Seconds, after speed changes.
  pub maybe_duration_seconds: Option<f64>,

  /// Seconds the model generated. BytePlus bills on this (capped at 120).
  pub maybe_billed_duration_seconds: Option<f64>,
}

/// One spoken line of the generated audio, in milliseconds from its start.
#[derive(Clone, Debug, Deserialize)]
pub struct SubtitleLine {
  pub start_time: i64,
  pub end_time: i64,
  pub text: String,
}

/// One reference item; each holds exactly one source.
#[derive(Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum AudioReference {
  /// A Doubao TTS voice or cloned voice id.
  Speaker(String),
  /// Bare base64 audio (wav, mp3, pcm or ogg_opus; up to 30 s and 10 MB).
  AudioData(String),
  AudioUrl(String),
  /// Bare base64 image (jpeg, png or webp; up to 10 MB).
  ImageData(String),
  ImageUrl(String),
}

#[derive(Clone, Debug, Serialize)]
pub struct AudioConfig {
  pub format: AudioFormat,

  /// 8000, 16000, 24000, 32000, 44100 or 48000.
  pub sample_rate: u32,

  /// -50 (0.5x) to 100 (2x); 0 is normal speed.
  #[serde(skip_serializing_if = "is_zero")]
  pub speech_rate: i32,

  /// -50 (0.5x) to 100 (2x); 0 is normal volume.
  #[serde(skip_serializing_if = "is_zero")]
  pub loudness_rate: i32,

  /// Semitones, -12 to 12.
  #[serde(skip_serializing_if = "is_zero")]
  pub pitch_rate: i32,

  /// Asks for word-level timings alongside the audio.
  #[serde(skip_serializing_if = "std::ops::Not::not")]
  pub enable_subtitle: bool,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum AudioFormat {
  Wav,
  Mp3,
  Pcm,
  OggOpus,
}

/// Watermark options. An empty object leaves the audio unmarked.
#[derive(Clone, Debug, Default, Serialize)]
pub struct AudioWatermark {
  /// Adds an audible rhythm marker at the end of the audio.
  #[serde(skip_serializing_if = "std::ops::Not::not")]
  pub aigc_watermark: bool,
}

impl AudioFormat {
  pub fn file_extension(self) -> &'static str {
    match self {
      Self::Wav => "wav",
      Self::Mp3 => "mp3",
      Self::Pcm => "pcm",
      Self::OggOpus => "ogg",
    }
  }
}

/// Generates audio with Seed Audio. The request is synchronous: the audio is in the response.
pub async fn create_audio(api_key: &SeedAudioApiKey, request: &CreateAudioRequest) -> Result<GeneratedAudio, ArkError> {
  let client = Client::builder()
      .timeout(CREATE_AUDIO_TIMEOUT)
      .build()
      .map_err(ArkError::ClientBuild)?;

  debug!("Seed Audio request: model {}, {} reference(s)", request.model, request.references.len());

  let response = client.post(SEED_AUDIO_CREATE_URL)
      .header("X-Api-Key", &api_key.api_key)
      .json(request)
      .send()
      .await
      .map_err(ArkError::Network)?;

  let status = response.status().as_u16();
  let log_id = response.headers()
      .get("X-Tt-Logid")
      .and_then(|value| value.to_str().ok())
      .unwrap_or_default()
      .to_string();
  let body = response.text().await.map_err(ArkError::Network)?;

  parse_create_audio_response(status, &body)
      .inspect_err(|err| warn!("Seed Audio request failed (HTTP {}, logid {}): {:?}", status, log_id, err))
}

fn parse_create_audio_response(status: u16, body: &str) -> Result<GeneratedAudio, ArkError> {
  let is_success = (200..300).contains(&status);

  let raw = match serde_json::from_str::<RawCreateAudioResponse>(body) {
    Ok(raw) => raw,
    Err(error) if is_success => return Err(ArkError::ResponseParse { error, body: body.to_string() }),
    Err(_) => return Err(classify_seed_audio_error(status, None, None).into()),
  };

  let maybe_audio = raw.audio.as_deref().filter(|audio| !audio.is_empty());

  let Some(audio) = maybe_audio.filter(|_| is_success) else {
    return Err(classify_seed_audio_error(status, raw.code, raw.message.as_deref()).into());
  };

  let bytes = STANDARD.decode(audio).map_err(|_| ArkApiError {
    kind: ArkApiErrorKind::Other,
    maybe_status_code: Some(status),
    maybe_code: None,
    maybe_message: Some("The generated audio couldn't be decoded.".to_string()),
  })?;

  Ok(GeneratedAudio {
    bytes,
    subtitle_lines: raw.subtitle.and_then(|subtitle| subtitle.sentences).unwrap_or_default(),
    maybe_duration_seconds: raw.duration,
    maybe_billed_duration_seconds: raw.original_duration,
  })
}

/// Seed Audio errors carry a numeric `code` and a free-text `message` instead of ModelArk's codes.
fn classify_seed_audio_error(status: u16, maybe_code: Option<i64>, maybe_message: Option<&str>) -> ArkApiError {
  let message = maybe_message.unwrap_or_default().to_ascii_lowercase();

  let kind = if message.contains("activat") || message.contains("not granted") {
    ArkApiErrorKind::ModelNotActivated
  } else if matches!(status, 401 | 403) {
    ArkApiErrorKind::InvalidApiKey
  } else if message.contains("qps") || message.contains("quota exceeded") {
    // Too many requests at once comes back as a quota error, not always as HTTP 429.
    ArkApiErrorKind::RateLimited
  } else if MODERATION_MARKERS.iter().any(|marker| message.contains(marker)) {
    ArkApiErrorKind::ContentModeration
  } else {
    match status {
      429 => ArkApiErrorKind::RateLimited,
      500..=599 => ArkApiErrorKind::ServerError,
      _ if !message.is_empty() => ArkApiErrorKind::BadRequest,
      _ => ArkApiErrorKind::Other,
    }
  };

  ArkApiError {
    kind,
    maybe_status_code: Some(status),
    maybe_code: maybe_code.map(|code| code.to_string()),
    maybe_message: maybe_message.map(str::to_string),
  }
}

fn is_zero(value: &i32) -> bool {
  *value == 0
}

#[derive(Deserialize)]
struct RawCreateAudioResponse {
  code: Option<i64>,
  message: Option<String>,
  /// Base64 audio.
  audio: Option<String>,
  duration: Option<f64>,
  original_duration: Option<f64>,
  subtitle: Option<RawSubtitle>,
}

#[derive(Deserialize)]
struct RawSubtitle {
  sentences: Option<Vec<SubtitleLine>>,
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde_json::json;

  mod request_tests {
    use super::*;

    #[test]
    fn text_only_request_omits_references_and_neutral_rates() {
      let request = request_with(vec![]);
      assert_eq!(
        serde_json::to_value(&request).unwrap(),
        json!({
          "model": "seed-audio-1.0",
          "text_prompt": "Rain on a tin roof",
          "audio_config": { "format": "mp3", "sample_rate": 44100 },
          "watermark": {},
        }),
      );
    }

    #[test]
    fn references_name_their_source_and_rates_are_sent_when_set() {
      let mut request = request_with(vec![AudioReference::AudioData("AAEC".to_string())]);
      request.audio_config.format = AudioFormat::OggOpus;
      request.audio_config.pitch_rate = -3;
      let value = serde_json::to_value(&request).unwrap();
      assert_eq!(value["references"], json!([{ "audio_data": "AAEC" }]));
      assert_eq!(value["audio_config"]["format"], "ogg_opus");
      assert_eq!(value["audio_config"]["pitch_rate"], -3);
    }
  }

  mod response_tests {
    use super::*;

    #[test]
    fn decodes_the_generated_audio() {
      let body = r#"{"code":0,"message":"ok","audio":"SUQz","duration":2.5,"original_duration":2.4}"#;
      let audio = parse_create_audio_response(200, body).unwrap();
      assert_eq!(audio.bytes, b"ID3");
      assert_eq!(audio.maybe_billed_duration_seconds, Some(2.4));
    }

    #[test]
    fn classifies_rejections() {
      assert_eq!(kind_of(401, r#"{"message":"unauthorized"}"#), ArkApiErrorKind::InvalidApiKey);
      assert_eq!(kind_of(200, r#"{"code":45000001,"message":"voiceprint sensitive"}"#), ArkApiErrorKind::ContentModeration);
      assert_eq!(kind_of(403, r#"{"message":"resource not granted"}"#), ArkApiErrorKind::ModelNotActivated);
      assert_eq!(kind_of(429, "busy"), ArkApiErrorKind::RateLimited);
      assert_eq!(kind_of(400, r#"{"code":45000292,"message":"quota exceeded for types: qps"}"#), ArkApiErrorKind::RateLimited);
      assert_eq!(kind_of(500, r#"{"code":55001310,"message":"audio risk audit tts_create_output: chunk 1 rejected (decision_in_reject_list)"}"#), ArkApiErrorKind::ContentModeration);
      assert_eq!(kind_of(400, r#"{"message":"text_prompt too long"}"#), ArkApiErrorKind::BadRequest);
    }

    fn kind_of(status: u16, body: &str) -> ArkApiErrorKind {
      match parse_create_audio_response(status, body) {
        Err(ArkError::Api(err)) => err.kind,
        _ => panic!("expected an API error"),
      }
    }
  }

  // Generates one short clip (billed per second of audio). Opt in with your own key:
  //   SEED_AUDIO_API_KEY=... cargo test -p byteplus_ark_client generates_one_seed_audio_clip -- --ignored --nocapture
  #[tokio::test]
  #[ignore]
  async fn generates_one_seed_audio_clip() {
    let Ok(key) = std::env::var("SEED_AUDIO_API_KEY") else {
      return;
    };
    let mut request = request_with(vec![]);
    request.text_prompt = "A calm narrator says: Welcome to ArtCraft.".to_string();
    let audio = create_audio(&SeedAudioApiKey::new(&key), &request).await.unwrap();
    println!("{} bytes, {:?} s billed", audio.bytes.len(), audio.maybe_billed_duration_seconds);
    let is_mp3 = audio.bytes.starts_with(b"ID3") || audio.bytes.first() == Some(&0xFF);
    assert!(is_mp3, "expected an MP3 file");
  }

  fn request_with(references: Vec<AudioReference>) -> CreateAudioRequest {
    CreateAudioRequest {
      model: SEED_AUDIO_1_MODEL_ID.to_string(),
      text_prompt: "Rain on a tin roof".to_string(),
      references,
      audio_config: AudioConfig {
        format: AudioFormat::Mp3,
        sample_rate: 44100,
        speech_rate: 0,
        loudness_rate: 0,
        pitch_rate: 0,
        enable_subtitle: false,
      },
      watermark: AudioWatermark::default(),
    }
  }
}

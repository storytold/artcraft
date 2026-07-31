use serde_derive::Serialize;

use crate::cost::kinovi_generation_cost::KinoviGenerationCost;
use crate::creds::kinovi_web_session::KinoviWebSession;
use crate::error::kinovi_web_error::KinoviWebError;
use crate::requests::kinovi_host::KinoviHost;
use crate::requests::workflow_run_task::workflow_run_task::{
  workflow_run_task_custom, WorkflowRunTaskCustomArgs, WorkflowRunTaskResponse,
};

const BUSINESS_TYPE: &str = "suno-remix-generation";
const MODEL: &str = "suno-remix";
const MODEL_VERSION: &str = "chirp-v5-5";

/// Flat credit price per generation.
const CREDITS_PER_GENERATION: u64 = 16;

// ── Args ──

pub struct GenerateSunoRemixArgs<'a> {
  pub request: GenerateSunoRemixRequest,
  pub session: &'a KinoviWebSession,
  pub host_override: Option<KinoviHost>,
}

// ── Request ──

/// Suno Remix: transform an existing piece of audio.
#[derive(Clone, Debug)]
pub struct GenerateSunoRemixRequest {
  /// How to transform the audio, e.g. "Make this electronic".
  pub prompt: String,

  /// The audio to remix.
  pub source: KinoviSunoRemixSource,

  /// Optional style/genre direction (the UI's "style prompt").
  pub style_tags: Option<String>,

  /// Keep the original lyrics in the remix.
  pub keep_lyrics: bool,
}

// ── Enums ──

/// The audio input for a remix: either an uploaded file (by CDN URL) or a
/// previously generated Suno track (by its music id).
#[derive(Clone, Debug)]
pub enum KinoviSunoRemixSource {
  /// A Kinovi CDN URL to an uploaded audio file.
  AudioUrl(String),
  /// The id of a previously generated Suno track
  /// (e.g. "fea7e70c-5373-452d-9c5e-f079ff837fcd").
  MusicId(String),
}

// ── Pricing ──
//
// Suno Remix: flat 16 Kinovi credits per generation, regardless of options.

impl GenerateSunoRemixRequest {
  /// Calculate the cost of this generation request, in Kinovi credits and
  /// USD cents.
  pub fn calculate_costs(&self) -> KinoviGenerationCost {
    KinoviGenerationCost::from_kinovi_credits(CREDITS_PER_GENERATION)
  }
}

// ── Response ──

pub struct GenerateSunoRemixResponse {
  pub task_id: String,
  pub order_id: String,
}

// ── Entry point ──

pub async fn generate_suno_remix(
  args: GenerateSunoRemixArgs<'_>,
) -> Result<GenerateSunoRemixResponse, KinoviWebError> {
  let raw_response: WorkflowRunTaskResponse = workflow_run_task_custom(WorkflowRunTaskCustomArgs {
    business_type: BUSINESS_TYPE,
    api_params: build_api_params(&args.request),
    session: args.session,
    host_override: args.host_override,
  }).await?;

  Ok(GenerateSunoRemixResponse {
    task_id: raw_response.task_id,
    order_id: raw_response.order_id,
  })
}

// ── Wire payload ──

/// The `apiParams` shape for `suno-remix-generation`. Field order matches the
/// captured browser traffic. Exactly one of `audio_url` / `music_id` is set.
#[derive(Serialize, Debug)]
struct SunoRemixApiParams {
  model: &'static str,
  prompt: String,
  #[serde(rename = "audioUrl", skip_serializing_if = "Option::is_none")]
  audio_url: Option<String>,
  #[serde(rename = "musicId", skip_serializing_if = "Option::is_none")]
  music_id: Option<String>,
  custom: bool,
  #[serde(rename = "keepLyrics")]
  keep_lyrics: bool,
  mv: &'static str,
  #[serde(skip_serializing_if = "Option::is_none")]
  tags: Option<String>,
  #[serde(rename = "isStorage")]
  is_storage: bool,
}

fn build_api_params(request: &GenerateSunoRemixRequest) -> SunoRemixApiParams {
  let (audio_url, music_id) = match &request.source {
    KinoviSunoRemixSource::AudioUrl(url) => (Some(url.clone()), None),
    KinoviSunoRemixSource::MusicId(id) => (None, Some(id.clone())),
  };

  SunoRemixApiParams {
    model: MODEL,
    prompt: request.prompt.clone(),
    audio_url,
    music_id,
    custom: false,
    keep_lyrics: request.keep_lyrics,
    mv: MODEL_VERSION,
    tags: request.style_tags.clone(),
    is_storage: true,
  }
}

// ── Tests ──

#[cfg(test)]
mod tests {
  use super::*;

  mod pricing_tests {
    use super::*;

    fn base_request() -> GenerateSunoRemixRequest {
      GenerateSunoRemixRequest {
        prompt: "Make this electronic".to_string(),
        source: KinoviSunoRemixSource::AudioUrl("https://example.com/a.mp3".to_string()),
        style_tags: None,
        keep_lyrics: false,
      }
    }

    #[test]
    fn flat_sixteen_credits() {
      let costs = base_request().calculate_costs();
      assert_eq!(costs.kinovi_credits, 16);
    }

    #[test]
    fn usd_cents() {
      // 16 credits; 1600/243 = 6.5843… → up 7¢, down 6¢.
      let costs = base_request().calculate_costs();
      assert_eq!(costs.usd_cents_rounded_up, 7);
      assert_eq!(costs.usd_cents_rounded_down, 6);
      assert!((costs.usd_cents_fractional - (1600.0 / 243.0)).abs() < 1e-9);
    }

    #[test]
    fn options_do_not_affect_cost() {
      let base = base_request().calculate_costs();
      let other = GenerateSunoRemixRequest {
        prompt: "Make this a symphony".to_string(),
        source: KinoviSunoRemixSource::MusicId("abc".to_string()),
        style_tags: Some("Classical music".to_string()),
        keep_lyrics: true,
      }.calculate_costs();
      assert_eq!(base, other);
    }
  }

  mod request_shape_tests {
    use super::*;

    /// Mirrors capture 5_suno_remix.txt (uploaded audio URL, no lyric keep).
    #[test]
    fn audio_url_source() {
      let params = build_api_params(&GenerateSunoRemixRequest {
        prompt: "Make this electronic".to_string(),
        source: KinoviSunoRemixSource::AudioUrl(
          "https://static.seedance2-pro.com/materials/20260707/1783399892833-7d9668fb.mp3".to_string(),
        ),
        style_tags: Some("EDM style".to_string()),
        keep_lyrics: false,
      });
      assert_eq!(
        serde_json::to_string(&params).unwrap(),
        r#"{"model":"suno-remix","prompt":"Make this electronic","audioUrl":"https://static.seedance2-pro.com/materials/20260707/1783399892833-7d9668fb.mp3","custom":false,"keepLyrics":false,"mv":"chirp-v5-5","tags":"EDM style","isStorage":true}"#,
      );
    }

    /// Mirrors capture 6_suno_remix_lyrics.txt (existing track by music id,
    /// keeping the lyrics).
    #[test]
    fn music_id_source_with_kept_lyrics() {
      let params = build_api_params(&GenerateSunoRemixRequest {
        prompt: "Make this a symphony".to_string(),
        source: KinoviSunoRemixSource::MusicId("fea7e70c-5373-452d-9c5e-f079ff837fcd".to_string()),
        style_tags: Some("Classical music".to_string()),
        keep_lyrics: true,
      });
      assert_eq!(
        serde_json::to_string(&params).unwrap(),
        r#"{"model":"suno-remix","prompt":"Make this a symphony","musicId":"fea7e70c-5373-452d-9c5e-f079ff837fcd","custom":false,"keepLyrics":true,"mv":"chirp-v5-5","tags":"Classical music","isStorage":true}"#,
      );
    }

    #[test]
    fn business_type() {
      assert_eq!(BUSINESS_TYPE, "suno-remix-generation");
    }
  }

  mod live_tests {
    use super::*;
    use crate::requests::prepare_file_upload::prepare_file_upload::{prepare_file_upload, PrepareFileUploadArgs};
    use crate::requests::upload_file::upload_file::{upload_file, UploadFileArgs};
    use crate::test_utils::get_test_cookies::get_test_cookies;
    use crate::test_utils::setup_test_logging::setup_test_logging;
    use errors::AnyhowResult;
    use log::LevelFilter;

    #[tokio::test]
    #[ignore] // Sends a real generation to Kinovi; costs credits. Requires a local audio file.
    async fn test_remix_uploaded_audio() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let audio_url = upload_test_audio(&session).await?;
      println!("Uploaded audio: {}", audio_url);

      let result = generate_suno_remix(GenerateSunoRemixArgs {
        session: &session,
        host_override: None,
        request: GenerateSunoRemixRequest {
          prompt: "Make this electronic".to_string(),
          source: KinoviSunoRemixSource::AudioUrl(audio_url),
          style_tags: Some("EDM style".to_string()),
          keep_lyrics: false,
        },
      }).await?;
      println!("suno remix — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2, "Inspect output above");
      Ok(())
    }

    fn test_session() -> AnyhowResult<KinoviWebSession> {
      let cookies = get_test_cookies()?;
      Ok(KinoviWebSession::from_cookies_string(cookies))
    }

    async fn upload_test_audio(session: &KinoviWebSession) -> AnyhowResult<String> {
      let audio_path = test_utils::test_file_path::test_file_path(
        "test_data/audio/mp3/super_mario_rpg_beware_the_forests_mushrooms.mp3",
      )?;
      let audio_bytes = std::fs::read(&audio_path)?;

      let prepare_result = prepare_file_upload(PrepareFileUploadArgs {
        session,
        extension: "mp3".to_string(),
        host_override: None,
      }).await?;

      let upload_result = upload_file(UploadFileArgs {
        upload_url: prepare_result.upload_url,
        file_bytes: audio_bytes,
        host_override: None,
      }).await?;

      Ok(upload_result.public_url)
    }
  }
}

use serde_derive::Serialize;

use crate::pricing::cost::kinovi_generation_cost::KinoviGenerationCost;
use crate::creds::kinovi_web_session::KinoviWebSession;
use crate::error::kinovi_web_error::KinoviWebError;
use crate::requests::kinovi_host::KinoviHost;
use crate::requests::workflow_run_task::workflow_run_task::{
  workflow_run_task_custom, WorkflowRunTaskCustomArgs, WorkflowRunTaskResponse,
};

const BUSINESS_TYPE: &str = "suno-sample-generation";
const MODEL: &str = "suno-sample";
const MODEL_VERSION: &str = "chirp-v5-5";

/// Flat credit price per generation.
const CREDITS_PER_GENERATION: u64 = 16;

// ── Args ──

pub struct GenerateSunoSampleArgs<'a> {
  pub request: GenerateSunoSampleRequest,
  pub session: &'a KinoviWebSession,
  pub host_override: Option<KinoviHost>,
}

// ── Request ──

/// Suno Sample: build a track from a chopped sample of an uploaded audio file.
///
/// NB: the Kinovi UI offers a voice choice (male / female / no voice), but it
/// is never transmitted on the wire — `instrumental` controls whether vocals
/// are added at all; steer the vocalist through the prompt or style tags.
#[derive(Clone, Debug)]
pub struct GenerateSunoSampleRequest {
  /// What to build from the sample, e.g. "Mystical RPG adventure, make it
  /// have a grand climax".
  pub prompt: String,

  /// A Kinovi CDN URL to the uploaded audio file to sample.
  pub audio_url: String,

  /// Start of the sample window within the audio, in seconds.
  pub chop_sample_start_seconds: u32,

  /// End of the sample window within the audio, in seconds.
  pub chop_sample_end_seconds: u32,

  /// Optional style/genre direction (the UI's "style prompt").
  pub style_tags: Option<String>,

  /// Generate an instrumental-only track (no vocals).
  pub instrumental: bool,
}

// ── Pricing ──
//
// Suno Sample: flat 16 Kinovi credits per generation, regardless of options.

impl GenerateSunoSampleRequest {
  /// Calculate the cost of this generation request, in Kinovi credits and
  /// USD cents.
  pub fn calculate_costs(&self) -> KinoviGenerationCost {
    KinoviGenerationCost::from_kinovi_credits(CREDITS_PER_GENERATION)
  }
}

// ── Response ──

pub struct GenerateSunoSampleResponse {
  pub task_id: String,
  pub order_id: String,
}

// ── Entry point ──

pub async fn generate_suno_sample(
  args: GenerateSunoSampleArgs<'_>,
) -> Result<GenerateSunoSampleResponse, KinoviWebError> {
  let raw_response: WorkflowRunTaskResponse = workflow_run_task_custom(WorkflowRunTaskCustomArgs {
    business_type: BUSINESS_TYPE,
    api_params: build_api_params(&args.request),
    session: args.session,
    host_override: args.host_override,
  }).await?;

  Ok(GenerateSunoSampleResponse {
    task_id: raw_response.task_id,
    order_id: raw_response.order_id,
  })
}

// ── Wire payload ──

/// The `apiParams` shape for `suno-sample-generation`. Field order matches the
/// captured browser traffic.
#[derive(Serialize, Debug)]
struct SunoSampleApiParams {
  model: &'static str,
  prompt: String,
  #[serde(rename = "audioUrl")]
  audio_url: String,
  #[serde(rename = "chopSampleStartS")]
  chop_sample_start_s: u32,
  #[serde(rename = "chopSampleEndS")]
  chop_sample_end_s: u32,
  custom: bool,
  instrumental: bool,
  #[serde(rename = "autoLyrics")]
  auto_lyrics: bool,
  mv: &'static str,
  #[serde(skip_serializing_if = "Option::is_none")]
  tags: Option<String>,
  #[serde(rename = "isStorage")]
  is_storage: bool,
}

fn build_api_params(request: &GenerateSunoSampleRequest) -> SunoSampleApiParams {
  SunoSampleApiParams {
    model: MODEL,
    prompt: request.prompt.clone(),
    audio_url: request.audio_url.clone(),
    chop_sample_start_s: request.chop_sample_start_seconds,
    chop_sample_end_s: request.chop_sample_end_seconds,
    custom: false,
    instrumental: request.instrumental,
    auto_lyrics: true,
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

    fn base_request() -> GenerateSunoSampleRequest {
      GenerateSunoSampleRequest {
        prompt: "Mystical RPG adventure".to_string(),
        audio_url: "https://example.com/a.aac".to_string(),
        chop_sample_start_seconds: 0,
        chop_sample_end_seconds: 41,
        style_tags: None,
        instrumental: true,
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
      let other = GenerateSunoSampleRequest {
        prompt: "A vocal fantasy track".to_string(),
        audio_url: "https://example.com/b.aac".to_string(),
        chop_sample_start_seconds: 10,
        chop_sample_end_seconds: 30,
        style_tags: Some("Fantasy video game".to_string()),
        instrumental: false,
      }.calculate_costs();
      assert_eq!(base, other);
    }
  }

  mod request_shape_tests {
    use super::*;

    /// Mirrors capture 11_suno_sample_1.txt (instrumental).
    #[test]
    fn instrumental_sample() {
      let params = build_api_params(&GenerateSunoSampleRequest {
        prompt: "Mystical RPG adventure, make it have a grand climax".to_string(),
        audio_url: "https://static.seedance2-pro.com/materials/20260707/1783401649804-e654f994.aac".to_string(),
        chop_sample_start_seconds: 0,
        chop_sample_end_seconds: 41,
        style_tags: Some("Fantasy video game, Motoi Sakuraba, Golden Sun".to_string()),
        instrumental: true,
      });
      assert_eq!(
        serde_json::to_string(&params).unwrap(),
        r#"{"model":"suno-sample","prompt":"Mystical RPG adventure, make it have a grand climax","audioUrl":"https://static.seedance2-pro.com/materials/20260707/1783401649804-e654f994.aac","chopSampleStartS":0,"chopSampleEndS":41,"custom":false,"instrumental":true,"autoLyrics":true,"mv":"chirp-v5-5","tags":"Fantasy video game, Motoi Sakuraba, Golden Sun","isStorage":true}"#,
      );
    }

    /// Mirrors capture 12_suno_sample_2.txt (with vocals).
    #[test]
    fn vocal_sample() {
      let params = build_api_params(&GenerateSunoSampleRequest {
        prompt: "Give this a lyrics track, a woman singing in a fantasy language".to_string(),
        audio_url: "https://static.seedance2-pro.com/materials/20260707/1783401649804-e654f994.aac".to_string(),
        chop_sample_start_seconds: 0,
        chop_sample_end_seconds: 41,
        style_tags: Some("Fantasy video game, Motoi Sakuraba, Golden Sun".to_string()),
        instrumental: false,
      });
      let json = serde_json::to_string(&params).unwrap();
      assert!(json.contains(r#""instrumental":false"#), "{json}");
      assert!(json.contains(r#""autoLyrics":true"#), "{json}");
      assert!(json.contains(r#""chopSampleStartS":0"#), "{json}");
      assert!(json.contains(r#""chopSampleEndS":41"#), "{json}");
    }

    #[test]
    fn business_type() {
      assert_eq!(BUSINESS_TYPE, "suno-sample-generation");
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
    async fn test_sample_instrumental() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let audio_url = upload_test_audio(&session).await?;
      println!("Uploaded audio: {}", audio_url);

      let result = generate_suno_sample(GenerateSunoSampleArgs {
        session: &session,
        host_override: None,
        request: GenerateSunoSampleRequest {
          prompt: "Mystical RPG adventure, make it have a grand climax".to_string(),
          audio_url,
          chop_sample_start_seconds: 0,
          chop_sample_end_seconds: 30,
          style_tags: Some("Fantasy video game score".to_string()),
          instrumental: true,
        },
      }).await?;
      println!("suno sample — task_id={}, order_id={}", result.task_id, result.order_id);
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
        "test_data/audio/aac/golden_sun_elemental_stars_cyanne.aac",
      )?;
      let audio_bytes = std::fs::read(&audio_path)?;

      let prepare_result = prepare_file_upload(PrepareFileUploadArgs {
        session,
        extension: "aac".to_string(),
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

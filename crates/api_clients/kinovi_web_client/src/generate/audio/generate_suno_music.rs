use serde_derive::Serialize;

use crate::cost::kinovi_generation_cost::KinoviGenerationCost;
use crate::creds::kinovi_web_session::KinoviWebSession;
use crate::error::kinovi_web_error::KinoviWebError;
use crate::requests::kinovi_host::KinoviHost;
use crate::requests::workflow_run_task::workflow_run_task::{
  workflow_run_task_custom, WorkflowRunTaskCustomArgs, WorkflowRunTaskResponse,
};

const BUSINESS_TYPE: &str = "suno-music-generation";
const MODEL: &str = "suno-music";
const MODEL_VERSION: &str = "chirp-v5-5";

/// Flat credit price per generation.
const CREDITS_PER_GENERATION: u64 = 16;

// ── Args ──

pub struct GenerateSunoMusicArgs<'a> {
  pub request: GenerateSunoMusicRequest,
  pub session: &'a KinoviWebSession,
  pub host_override: Option<KinoviHost>,
}

// ── Request ──

/// Suno Music: text-to-music generation.
///
/// NB: the Kinovi UI offers a voice choice (any / male / female), but it is
/// never transmitted on the wire — steer the vocalist through the prompt or
/// style tags instead.
#[derive(Clone, Debug)]
pub struct GenerateSunoMusicRequest {
  /// What the song should be about.
  pub prompt: String,

  /// Optional style/genre direction (the UI's "style prompt"), e.g.
  /// "EDM style meets dance".
  pub style_tags: Option<String>,

  /// Generate an instrumental-only track (no vocals).
  pub instrumental: bool,
}

// ── Pricing ──
//
// Suno Music: flat 16 Kinovi credits per generation, regardless of options.

impl GenerateSunoMusicRequest {
  /// Calculate the cost of this generation request, in Kinovi credits and
  /// USD cents.
  pub fn calculate_costs(&self) -> KinoviGenerationCost {
    KinoviGenerationCost::from_kinovi_credits(CREDITS_PER_GENERATION)
  }
}

// ── Response ──

pub struct GenerateSunoMusicResponse {
  pub task_id: String,
  pub order_id: String,
}

// ── Entry point ──

pub async fn generate_suno_music(
  args: GenerateSunoMusicArgs<'_>,
) -> Result<GenerateSunoMusicResponse, KinoviWebError> {
  let raw_response: WorkflowRunTaskResponse = workflow_run_task_custom(WorkflowRunTaskCustomArgs {
    business_type: BUSINESS_TYPE,
    api_params: build_api_params(&args.request),
    session: args.session,
    host_override: args.host_override,
  }).await?;

  Ok(GenerateSunoMusicResponse {
    task_id: raw_response.task_id,
    order_id: raw_response.order_id,
  })
}

// ── Wire payload ──

/// The `apiParams` shape for `suno-music-generation`. Field order matches the
/// captured browser traffic.
#[derive(Serialize, Debug)]
struct SunoMusicApiParams {
  model: &'static str,
  prompt: String,
  custom: bool,
  instrumental: bool,
  mv: &'static str,
  #[serde(skip_serializing_if = "Option::is_none")]
  tags: Option<String>,
  #[serde(rename = "generateVideo")]
  generate_video: bool,
  #[serde(rename = "isStorage")]
  is_storage: bool,
}

fn build_api_params(request: &GenerateSunoMusicRequest) -> SunoMusicApiParams {
  SunoMusicApiParams {
    model: MODEL,
    prompt: request.prompt.clone(),
    custom: false,
    instrumental: request.instrumental,
    mv: MODEL_VERSION,
    tags: request.style_tags.clone(),
    generate_video: false,
    is_storage: true,
  }
}

// ── Tests ──

#[cfg(test)]
mod tests {
  use super::*;

  mod pricing_tests {
    use super::*;

    fn base_request() -> GenerateSunoMusicRequest {
      GenerateSunoMusicRequest {
        prompt: "A song".to_string(),
        style_tags: None,
        instrumental: false,
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
      let styled = GenerateSunoMusicRequest {
        prompt: "Another song".to_string(),
        style_tags: Some("EDM".to_string()),
        instrumental: true,
      }.calculate_costs();
      assert_eq!(base, styled);
    }
  }

  mod request_shape_tests {
    use super::*;

    /// Mirrors capture 1_suno_music.txt (no style tags, with vocals).
    #[test]
    fn basic_prompt() {
      let params = build_api_params(&GenerateSunoMusicRequest {
        prompt: "A song about corgi super heroes fighting shiba super villains.".to_string(),
        style_tags: None,
        instrumental: false,
      });
      assert_eq!(
        serde_json::to_string(&params).unwrap(),
        r#"{"model":"suno-music","prompt":"A song about corgi super heroes fighting shiba super villains.","custom":false,"instrumental":false,"mv":"chirp-v5-5","generateVideo":false,"isStorage":true}"#,
      );
    }

    /// Mirrors capture 2_suno_music_style_female.txt (style tags present).
    #[test]
    fn with_style_tags() {
      let params = build_api_params(&GenerateSunoMusicRequest {
        prompt: "A song about Mario and Luigi fighting Bowser".to_string(),
        style_tags: Some("EDM style meets dance".to_string()),
        instrumental: false,
      });
      assert_eq!(
        serde_json::to_string(&params).unwrap(),
        r#"{"model":"suno-music","prompt":"A song about Mario and Luigi fighting Bowser","custom":false,"instrumental":false,"mv":"chirp-v5-5","tags":"EDM style meets dance","generateVideo":false,"isStorage":true}"#,
      );
    }

    /// Mirrors capture 3_suno_music_instrumental.txt.
    #[test]
    fn instrumental() {
      let params = build_api_params(&GenerateSunoMusicRequest {
        prompt: "An epic journey for a JRPG".to_string(),
        style_tags: Some("Japanese JRPG adventure music".to_string()),
        instrumental: true,
      });
      let json = serde_json::to_string(&params).unwrap();
      assert!(json.contains(r#""instrumental":true"#), "{json}");
      assert!(json.contains(r#""custom":false"#), "{json}");
      assert!(json.contains(r#""mv":"chirp-v5-5""#), "{json}");
    }

    #[test]
    fn business_type() {
      assert_eq!(BUSINESS_TYPE, "suno-music-generation");
    }
  }

  mod live_tests {
    use super::*;
    use crate::test_utils::get_test_cookies::get_test_cookies;
    use crate::test_utils::setup_test_logging::setup_test_logging;
    use errors::AnyhowResult;
    use log::LevelFilter;

    #[tokio::test]
    #[ignore] // Sends a real generation to Kinovi; costs credits.
    async fn test_music_with_vocals() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_suno_music(GenerateSunoMusicArgs {
        session: &session,
        host_override: None,
        request: GenerateSunoMusicRequest {
          prompt: "A song about a corgi who learns to sail the open sea".to_string(),
          style_tags: Some("Sea shanty, folk".to_string()),
          instrumental: false,
        },
      }).await?;
      println!("suno music — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2, "Inspect output above");
      Ok(())
    }

    #[tokio::test]
    #[ignore] // Sends a real generation to Kinovi; costs credits.
    async fn test_music_instrumental() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_suno_music(GenerateSunoMusicArgs {
        session: &session,
        host_override: None,
        request: GenerateSunoMusicRequest {
          prompt: "An epic journey across a frozen mountain range".to_string(),
          style_tags: Some("Cinematic orchestral score".to_string()),
          instrumental: true,
        },
      }).await?;
      println!("suno music instrumental — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2, "Inspect output above");
      Ok(())
    }

    fn test_session() -> AnyhowResult<KinoviWebSession> {
      let cookies = get_test_cookies()?;
      Ok(KinoviWebSession::from_cookies_string(cookies))
    }
  }
}

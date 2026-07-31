use serde_derive::Serialize;

use crate::cost::kinovi_generation_cost::KinoviGenerationCost;
use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::requests::kinovi_host::KinoviHost;
use crate::requests::workflow_run_task::workflow_run_task::{
  workflow_run_task_custom, WorkflowRunTaskCustomArgs, WorkflowRunTaskResponse,
};

const BUSINESS_TYPE: &str = "suno-sounds-generation";
const MODEL: &str = "suno-sounds";
const MODEL_VERSION: &str = "chirp-v5-5";

/// Flat credit price per generation.
const CREDITS_PER_GENERATION: u64 = 4;

// ── Args ──

pub struct GenerateSunoSoundArgs<'a> {
  pub request: GenerateSunoSoundRequest,
  pub session: &'a Seedance2ProSession,
  pub host_override: Option<KinoviHost>,
}

// ── Request ──

/// Suno Sounds: short sound-effect / sample generation.
#[derive(Clone, Debug)]
pub struct GenerateSunoSoundRequest {
  /// What the sound should be, e.g. "Rain sound effects".
  pub prompt: String,

  /// Single hit vs seamless loop.
  pub sound_type: KinoviSunoSoundType,

  /// Optional tempo in BPM.
  pub bpm: Option<u16>,

  /// Musical key. `Auto` lets Kinovi pick.
  pub key: KinoviSunoSoundKey,
}

// ── Enums ──

/// Single hit ("one-shot") vs seamless loop ("loop").
#[derive(Debug, Clone, Copy)]
pub enum KinoviSunoSoundType {
  SingleHit,
  Loopable,
}

/// Musical key for the generated sound.
///
/// NB: the Kinovi UI's "Auto" selection still transmits "C" on the wire
/// (observed in captured traffic), so `Auto` and `CMajor` are wire-identical.
#[derive(Debug, Clone, Copy)]
pub enum KinoviSunoSoundKey {
  Auto,
  CMajor,
  CMinor,
  DMajor,
  DMinor,
  FMajor,
  FMinor,
  GMajor,
  GMinor,
  AMajor,
  AMinor,
  BMajor,
  BMinor,
}

// ── Pricing ──
//
// Suno Sounds: flat 4 Kinovi credits per generation, regardless of options.

impl GenerateSunoSoundRequest {
  /// Calculate the cost of this generation request, in Kinovi credits and
  /// USD cents.
  pub fn calculate_costs(&self) -> KinoviGenerationCost {
    KinoviGenerationCost::from_kinovi_credits(CREDITS_PER_GENERATION)
  }
}

// ── Response ──

pub struct GenerateSunoSoundResponse {
  pub task_id: String,
  pub order_id: String,
}

// ── Entry point ──

pub async fn generate_suno_sound(
  args: GenerateSunoSoundArgs<'_>,
) -> Result<GenerateSunoSoundResponse, Seedance2ProError> {
  let raw_response: WorkflowRunTaskResponse = workflow_run_task_custom(WorkflowRunTaskCustomArgs {
    business_type: BUSINESS_TYPE,
    api_params: build_api_params(&args.request),
    session: args.session,
    host_override: args.host_override,
  }).await?;

  Ok(GenerateSunoSoundResponse {
    task_id: raw_response.task_id,
    order_id: raw_response.order_id,
  })
}

// ── Wire payload ──

/// The `apiParams` shape for `suno-sounds-generation`. Field order matches the
/// captured browser traffic.
#[derive(Serialize, Debug)]
struct SunoSoundApiParams {
  model: &'static str,
  prompt: String,
  mv: &'static str,
  #[serde(rename = "type")]
  sound_type: &'static str,
  #[serde(skip_serializing_if = "Option::is_none")]
  bpm: Option<u16>,
  key: &'static str,
  #[serde(rename = "isStorage")]
  is_storage: bool,
}

fn build_api_params(request: &GenerateSunoSoundRequest) -> SunoSoundApiParams {
  SunoSoundApiParams {
    model: MODEL,
    prompt: request.prompt.clone(),
    mv: MODEL_VERSION,
    sound_type: sound_type_as_api_str(request.sound_type),
    bpm: request.bpm,
    key: key_as_api_str(request.key),
    is_storage: true,
  }
}

fn sound_type_as_api_str(sound_type: KinoviSunoSoundType) -> &'static str {
  match sound_type {
    KinoviSunoSoundType::SingleHit => "one-shot",
    KinoviSunoSoundType::Loopable => "loop",
  }
}

fn key_as_api_str(key: KinoviSunoSoundKey) -> &'static str {
  match key {
    // The UI's Auto choice sends "C" on the wire.
    KinoviSunoSoundKey::Auto => "C",
    KinoviSunoSoundKey::CMajor => "C",
    KinoviSunoSoundKey::CMinor => "Cm",
    KinoviSunoSoundKey::DMajor => "D",
    KinoviSunoSoundKey::DMinor => "Dm",
    KinoviSunoSoundKey::FMajor => "F",
    KinoviSunoSoundKey::FMinor => "Fm",
    KinoviSunoSoundKey::GMajor => "G",
    KinoviSunoSoundKey::GMinor => "Gm",
    KinoviSunoSoundKey::AMajor => "A",
    KinoviSunoSoundKey::AMinor => "Am",
    KinoviSunoSoundKey::BMajor => "B",
    KinoviSunoSoundKey::BMinor => "Bm",
  }
}

// ── Tests ──

#[cfg(test)]
mod tests {
  use super::*;

  mod pricing_tests {
    use super::*;

    fn base_request() -> GenerateSunoSoundRequest {
      GenerateSunoSoundRequest {
        prompt: "Rain sound effects".to_string(),
        sound_type: KinoviSunoSoundType::SingleHit,
        bpm: None,
        key: KinoviSunoSoundKey::Auto,
      }
    }

    #[test]
    fn flat_four_credits() {
      let costs = base_request().calculate_costs();
      assert_eq!(costs.kinovi_credits, 4);
    }

    #[test]
    fn usd_cents() {
      // 4 credits; 400/243 = 1.6461… → up 2¢, down 1¢.
      let costs = base_request().calculate_costs();
      assert_eq!(costs.usd_cents_rounded_up, 2);
      assert_eq!(costs.usd_cents_rounded_down, 1);
      assert!((costs.usd_cents_fractional - (400.0 / 243.0)).abs() < 1e-9);
    }

    #[test]
    fn options_do_not_affect_cost() {
      let base = base_request().calculate_costs();
      let other = GenerateSunoSoundRequest {
        prompt: "Thunder".to_string(),
        sound_type: KinoviSunoSoundType::Loopable,
        bpm: Some(180),
        key: KinoviSunoSoundKey::DMinor,
      }.calculate_costs();
      assert_eq!(base, other);
    }
  }

  mod request_shape_tests {
    use super::*;

    /// Mirrors capture 7_suno_sounds_1.txt (single hit, no BPM, auto key —
    /// which transmits "C").
    #[test]
    fn single_hit_no_bpm_auto_key() {
      let params = build_api_params(&GenerateSunoSoundRequest {
        prompt: "Rain sound effects".to_string(),
        sound_type: KinoviSunoSoundType::SingleHit,
        bpm: None,
        key: KinoviSunoSoundKey::Auto,
      });
      assert_eq!(
        serde_json::to_string(&params).unwrap(),
        r#"{"model":"suno-sounds","prompt":"Rain sound effects","mv":"chirp-v5-5","type":"one-shot","key":"C","isStorage":true}"#,
      );
    }

    /// Mirrors capture 8_suno_sounds_2.txt (loop, 60 BPM, D minor).
    #[test]
    fn loop_with_bpm_and_minor_key() {
      let params = build_api_params(&GenerateSunoSoundRequest {
        prompt: "Thunder".to_string(),
        sound_type: KinoviSunoSoundType::Loopable,
        bpm: Some(60),
        key: KinoviSunoSoundKey::DMinor,
      });
      assert_eq!(
        serde_json::to_string(&params).unwrap(),
        r#"{"model":"suno-sounds","prompt":"Thunder","mv":"chirp-v5-5","type":"loop","bpm":60,"key":"Dm","isStorage":true}"#,
      );
    }

    /// Mirrors capture 9_suno_sounds_3.txt (loop, 180 BPM, F major).
    #[test]
    fn loop_with_major_key() {
      let params = build_api_params(&GenerateSunoSoundRequest {
        prompt: "Plates crashing in the kitchen".to_string(),
        sound_type: KinoviSunoSoundType::Loopable,
        bpm: Some(180),
        key: KinoviSunoSoundKey::FMajor,
      });
      assert_eq!(
        serde_json::to_string(&params).unwrap(),
        r#"{"model":"suno-sounds","prompt":"Plates crashing in the kitchen","mv":"chirp-v5-5","type":"loop","bpm":180,"key":"F","isStorage":true}"#,
      );
    }

    /// Mirrors capture 10_suno_sounds_4.txt (single hit, 100 BPM, C minor).
    #[test]
    fn single_hit_with_bpm_and_minor_key() {
      let params = build_api_params(&GenerateSunoSoundRequest {
        prompt: "Car crash".to_string(),
        sound_type: KinoviSunoSoundType::SingleHit,
        bpm: Some(100),
        key: KinoviSunoSoundKey::CMinor,
      });
      assert_eq!(
        serde_json::to_string(&params).unwrap(),
        r#"{"model":"suno-sounds","prompt":"Car crash","mv":"chirp-v5-5","type":"one-shot","bpm":100,"key":"Cm","isStorage":true}"#,
      );
    }

    #[test]
    fn every_key_wire_value() {
      let cases = [
        (KinoviSunoSoundKey::Auto, "C"),
        (KinoviSunoSoundKey::CMajor, "C"),
        (KinoviSunoSoundKey::CMinor, "Cm"),
        (KinoviSunoSoundKey::DMajor, "D"),
        (KinoviSunoSoundKey::DMinor, "Dm"),
        (KinoviSunoSoundKey::FMajor, "F"),
        (KinoviSunoSoundKey::FMinor, "Fm"),
        (KinoviSunoSoundKey::GMajor, "G"),
        (KinoviSunoSoundKey::GMinor, "Gm"),
        (KinoviSunoSoundKey::AMajor, "A"),
        (KinoviSunoSoundKey::AMinor, "Am"),
        (KinoviSunoSoundKey::BMajor, "B"),
        (KinoviSunoSoundKey::BMinor, "Bm"),
      ];
      for (key, expected) in cases {
        assert_eq!(key_as_api_str(key), expected, "wire value for {key:?}");
      }
    }

    #[test]
    fn business_type() {
      assert_eq!(BUSINESS_TYPE, "suno-sounds-generation");
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
    async fn test_single_hit() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_suno_sound(GenerateSunoSoundArgs {
        session: &session,
        host_override: None,
        request: GenerateSunoSoundRequest {
          prompt: "A heavy castle door creaking open".to_string(),
          sound_type: KinoviSunoSoundType::SingleHit,
          bpm: None,
          key: KinoviSunoSoundKey::Auto,
        },
      }).await?;
      println!("suno sound single hit — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2, "Inspect output above");
      Ok(())
    }

    #[tokio::test]
    #[ignore] // Sends a real generation to Kinovi; costs credits.
    async fn test_loop_with_bpm_and_key() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_suno_sound(GenerateSunoSoundArgs {
        session: &session,
        host_override: None,
        request: GenerateSunoSoundRequest {
          prompt: "Lo-fi vinyl crackle groove".to_string(),
          sound_type: KinoviSunoSoundType::Loopable,
          bpm: Some(85),
          key: KinoviSunoSoundKey::AMinor,
        },
      }).await?;
      println!("suno sound loop — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2, "Inspect output above");
      Ok(())
    }

    fn test_session() -> AnyhowResult<Seedance2ProSession> {
      let cookies = get_test_cookies()?;
      Ok(Seedance2ProSession::from_cookies_string(cookies))
    }
  }
}

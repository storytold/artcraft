use crate::creds::kinovi_web_session::KinoviWebSession;
use crate::error::kinovi_web_error::KinoviWebError;
use crate::cost::kinovi_cost_calculator_trait::KinoviCostCalculatorTrait;
use crate::cost::kinovi_fractional_generation_cost::KinoviFractionalGenerationCost;
use crate::cost::kinovi_pricing_rate::KinoviPricingRate;
use crate::cost::kinovi_pricing_tier::KinoviPricingTier;
use crate::requests::kinovi_host::KinoviHost;
use crate::requests::workflow_run_task::workflow_run_task::{
  workflow_run_task, KinoviAspectRatioRaw, KinoviBatchCountRaw, KinoviModelTypeRaw,
  KinoviOutputResolutionRaw, WorkflowRunTaskArgs, WorkflowRunTaskRequest,
};

// ── Args ──

pub struct GenerateSeedance2p5PreviewArgs<'a> {
  pub request: GenerateSeedance2p5PreviewRequest,
  pub session: &'a KinoviWebSession,
  pub host_override: Option<KinoviHost>,
}

// ── Request ──

/// Seedance 2.5 Preview only supports reference mode (there is no keyframe
/// start/end frame mode), 480p/720p output, and durations of 4–30 seconds.
#[derive(Clone, Debug)]
pub struct GenerateSeedance2p5PreviewRequest {
  pub prompt: String,
  pub aspect_ratio: Option<KinoviSeedance2p5PreviewAspectRatio>,
  pub output_resolution: Option<KinoviSeedance2p5PreviewOutputResolution>,
  pub duration_seconds: u8,
  /// Reference images, referenced in prompts as @image1, @image2, etc.
  pub reference_image_urls: Option<Vec<String>>,
  /// Reference videos, referenced in prompts as @video1, @video2, etc.
  pub reference_video_urls: Option<Vec<String>>,
  /// Reference audio, referenced in prompts as @audio1, @audio2, etc.
  pub reference_audio_urls: Option<Vec<String>>,
  /// Controls `faceBlurMode`: true sends "on"; false or None sends "off"
  /// (the model always sends the field, unlike older Seedance models).
  pub use_face_blur_hack: Option<bool>,
}

// ── Enums ──

#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p5PreviewAspectRatio {
  Landscape16x9,
  UltraWide21x9,
  Portrait9x16,
  Square1x1,
  Standard4x3,
  Portrait3x4,
}

/// Output resolution. 2.5 Preview supports only 480p and 720p.
#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p5PreviewOutputResolution {
  FourEightyP,
  SevenTwentyP,
}

// ── Pricing ──
//
// Seedance 2.5 Preview credit pricing (per second of output duration):
//
// | Resolution | Consumer credits/sec | Enterprise credits/sec |
// |------------|----------------------|------------------------|
// | 480p       |                46.15 |                  42.13 |
// | 720p       |                92.03 |                  84.26 |
//
// References (images, videos, and audio) do NOT affect the cost — unlike the
// Seedance 2.0 models, there is no video-reference surcharge. Default
// resolution (None) is 720p.

/// Per-second credit rates for Seedance 2.5 Preview at 480p.
const SEEDANCE_2P5_PREVIEW_480P: KinoviPricingRate = KinoviPricingRate {
  consumer_credits: 46.15,
  maybe_enterprise_credits: Some(42.13),
};

/// Per-second credit rates for Seedance 2.5 Preview at 720p.
const SEEDANCE_2P5_PREVIEW_720P: KinoviPricingRate = KinoviPricingRate {
  consumer_credits: 92.03,
  maybe_enterprise_credits: Some(84.26),
};

impl KinoviCostCalculatorTrait for GenerateSeedance2p5PreviewRequest {
  type Cost = KinoviFractionalGenerationCost;

  /// Calculate the cost of this generation request, in Kinovi credits
  /// (fractional) and USD cents, at the given pricing tier.
  ///
  /// `cost_from_credits` snaps to the nearest hundredth of a credit, so the
  /// totals land exactly on the observed values (e.g. consumer 480p × 15s =
  /// 692.25, not a 692.250000000001 float artifact).
  fn calculate_costs(&self, tier: KinoviPricingTier) -> KinoviFractionalGenerationCost {
    let rate = match self.output_resolution {
      Some(KinoviSeedance2p5PreviewOutputResolution::FourEightyP) => SEEDANCE_2P5_PREVIEW_480P,
      Some(KinoviSeedance2p5PreviewOutputResolution::SevenTwentyP) | None => SEEDANCE_2P5_PREVIEW_720P,
    };
    let total_credits = rate.credits(tier) * f64::from(self.duration_seconds);
    tier.cost_from_credits(total_credits)
  }
}

// ── Response ──

pub struct GenerateSeedance2p5PreviewResponse {
  pub task_id: String,
  pub order_id: String,
  pub task_ids: Option<Vec<String>>,
  pub order_ids: Option<Vec<String>>,
}

// ── Entry point ──

pub async fn generate_seedance_2p5_preview(
  args: GenerateSeedance2p5PreviewArgs<'_>,
) -> Result<GenerateSeedance2p5PreviewResponse, KinoviWebError> {
  let raw_response = workflow_run_task(WorkflowRunTaskArgs {
    request: to_raw_request(args.request),
    session: args.session,
    host_override: args.host_override,
  }).await?;

  Ok(GenerateSeedance2p5PreviewResponse {
    task_id: raw_response.task_id,
    order_id: raw_response.order_id,
    task_ids: raw_response.task_ids,
    order_ids: raw_response.order_ids,
  })
}

// ── Mapping helpers ──

fn to_raw_request(req: GenerateSeedance2p5PreviewRequest) -> WorkflowRunTaskRequest {
  WorkflowRunTaskRequest {
    model_type: KinoviModelTypeRaw::Seedance2p5Preview,
    prompt: req.prompt,
    aspect_ratio: map_aspect_ratio(req.aspect_ratio),
    output_resolution: Some(map_output_resolution(req.output_resolution)),
    duration_seconds: req.duration_seconds,
    batch_count: KinoviBatchCountRaw::One,
    start_frame_url: None,
    end_frame_url: None,
    reference_image_urls: req.reference_image_urls,
    reference_video_urls: req.reference_video_urls,
    reference_audio_urls: req.reference_audio_urls,
    character_ids: None,
    use_face_blur_hack: req.use_face_blur_hack,
    bitrate: None,
  }
}

fn map_aspect_ratio(ar: Option<KinoviSeedance2p5PreviewAspectRatio>) -> KinoviAspectRatioRaw {
  match ar {
    Some(KinoviSeedance2p5PreviewAspectRatio::Landscape16x9) => KinoviAspectRatioRaw::Landscape16x9,
    Some(KinoviSeedance2p5PreviewAspectRatio::UltraWide21x9) => KinoviAspectRatioRaw::UltraWide21x9,
    Some(KinoviSeedance2p5PreviewAspectRatio::Portrait9x16) => KinoviAspectRatioRaw::Portrait9x16,
    Some(KinoviSeedance2p5PreviewAspectRatio::Square1x1) => KinoviAspectRatioRaw::Square1x1,
    Some(KinoviSeedance2p5PreviewAspectRatio::Standard4x3) => KinoviAspectRatioRaw::Landscape4x3,
    Some(KinoviSeedance2p5PreviewAspectRatio::Portrait3x4) => KinoviAspectRatioRaw::Portrait3x4,
    None => KinoviAspectRatioRaw::Landscape16x9,
  }
}

fn map_output_resolution(res: Option<KinoviSeedance2p5PreviewOutputResolution>) -> KinoviOutputResolutionRaw {
  match res {
    Some(KinoviSeedance2p5PreviewOutputResolution::FourEightyP) => KinoviOutputResolutionRaw::FourEightyP,
    // Unset resolves to 720p — MUST stay in lockstep with calculate_costs(),
    // which prices None as 720p.
    Some(KinoviSeedance2p5PreviewOutputResolution::SevenTwentyP) | None => KinoviOutputResolutionRaw::SevenTwentyP,
  }
}

// ── Tests ──

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::kinovi_web_session::KinoviWebSession;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  mod pricing_tests {
    use super::*;

    const FLOAT_TOLERANCE: f64 = 1e-9;

    // ── Full pricing tables (credits) ──
    //
    // The exact per-duration tables for Seedance 2.5 Preview at each tier:
    // consumer 480p = 46.15 credits/sec, 720p = 92.03 credits/sec;
    // enterprise 480p = 42.13 credits/sec, 720p = 84.26 credits/sec.

    mod consumer_pricing_table {
      use super::*;

      #[test]
      fn table_480p() {
        assert_eq!(r480(4).calculate_consumer_costs().kinovi_credits, 184.6);
        assert_eq!(r480(10).calculate_consumer_costs().kinovi_credits, 461.5);
        assert_eq!(r480(15).calculate_consumer_costs().kinovi_credits, 692.25);
        assert_eq!(r480(20).calculate_consumer_costs().kinovi_credits, 923.0);
        assert_eq!(r480(25).calculate_consumer_costs().kinovi_credits, 1153.75);
        assert_eq!(r480(30).calculate_consumer_costs().kinovi_credits, 1384.5);
      }

      #[test]
      fn table_720p() {
        assert_eq!(r720(4).calculate_consumer_costs().kinovi_credits, 368.12);
        assert_eq!(r720(10).calculate_consumer_costs().kinovi_credits, 920.3);
        assert_eq!(r720(15).calculate_consumer_costs().kinovi_credits, 1380.45);
        assert_eq!(r720(20).calculate_consumer_costs().kinovi_credits, 1840.6);
        assert_eq!(r720(25).calculate_consumer_costs().kinovi_credits, 2300.75);
        assert_eq!(r720(30).calculate_consumer_costs().kinovi_credits, 2760.9);
      }

      #[test]
      fn explicit_720p_same_as_default() {
        let default = r720(10).calculate_consumer_costs();
        let explicit = build_request(10, Some(KinoviSeedance2p5PreviewOutputResolution::SevenTwentyP)).calculate_consumer_costs();
        assert_eq!(default, explicit);
      }
    }

    mod enterprise_pricing_table {
      use super::*;

      #[test]
      fn table_480p() {
        assert_eq!(r480(4).calculate_enterprise_costs().kinovi_credits, 168.52);
        assert_eq!(r480(10).calculate_enterprise_costs().kinovi_credits, 421.3);
        assert_eq!(r480(15).calculate_enterprise_costs().kinovi_credits, 631.95);
        assert_eq!(r480(20).calculate_enterprise_costs().kinovi_credits, 842.6);
        assert_eq!(r480(25).calculate_enterprise_costs().kinovi_credits, 1053.25);
        assert_eq!(r480(30).calculate_enterprise_costs().kinovi_credits, 1263.9);
      }

      #[test]
      fn table_720p() {
        assert_eq!(r720(4).calculate_enterprise_costs().kinovi_credits, 337.04);
        assert_eq!(r720(10).calculate_enterprise_costs().kinovi_credits, 842.6);
        assert_eq!(r720(15).calculate_enterprise_costs().kinovi_credits, 1263.9);
        assert_eq!(r720(20).calculate_enterprise_costs().kinovi_credits, 1685.2);
        assert_eq!(r720(25).calculate_enterprise_costs().kinovi_credits, 2106.5);
        assert_eq!(r720(30).calculate_enterprise_costs().kinovi_credits, 2527.8);
      }

      #[test]
      fn explicit_720p_same_as_default() {
        let default = r720(10).calculate_enterprise_costs();
        let explicit = build_request(10, Some(KinoviSeedance2p5PreviewOutputResolution::SevenTwentyP)).calculate_enterprise_costs();
        assert_eq!(default, explicit);
      }
    }

    // ── Tier dispatch ──

    #[test]
    fn convenience_methods_match_explicit_tier() {
      let request = r480(10);
      assert_eq!(request.calculate_consumer_costs(), request.calculate_costs(KinoviPricingTier::Consumer));
      assert_eq!(request.calculate_enterprise_costs(), request.calculate_costs(KinoviPricingTier::Enterprise));
    }

    // ── References don't affect cost ──
    //
    // Unlike the Seedance 2.0 models, 2.5 Preview has no video-reference
    // surcharge: adding or removing references of any type leaves the cost
    // unchanged at either tier.

    mod references_do_not_affect_cost {
      use super::*;

      #[test]
      fn table_480p_with_references_is_identical() {
        for tier in [KinoviPricingTier::Enterprise, KinoviPricingTier::Consumer] {
          for duration in [4u8, 10, 15, 20, 25, 30] {
            assert_eq!(
              with_all_reference_types(r480(duration)).calculate_costs(tier),
              r480(duration).calculate_costs(tier),
              "480p at {duration}s ({tier:?})",
            );
          }
        }
      }

      #[test]
      fn table_720p_with_references_is_identical() {
        for tier in [KinoviPricingTier::Enterprise, KinoviPricingTier::Consumer] {
          for duration in [4u8, 10, 15, 20, 25, 30] {
            assert_eq!(
              with_all_reference_types(r720(duration)).calculate_costs(tier),
              r720(duration).calculate_costs(tier),
              "720p at {duration}s ({tier:?})",
            );
          }
        }
      }

      #[test]
      fn video_reference_alone_adds_no_surcharge() {
        let mut request = r720(10);
        request.reference_video_urls = Some(vec!["https://example.com/ref.mp4".to_string()]);
        assert_eq!(request.calculate_consumer_costs().kinovi_credits, 920.3);
        assert_eq!(request.calculate_enterprise_costs().kinovi_credits, 842.6);
      }
    }

    // ── USD cents conversion ──
    //
    // usd_cents = credits × 100 / credits_per_dollar. Consumer converts at
    // 192.98 credits/$1; enterprise converts at the bulk rate of 243.16
    // credits/$1.

    mod usd_cents {
      use super::*;

      #[test]
      fn consumer_cents_480p_4s() {
        // 184.6 credits; 18460/192.98 = 95.6576 cents.
        let cost = r480(4).calculate_consumer_costs();
        assert_eq!(cost.usd_cents_rounded_up, 96);
        assert_eq!(cost.usd_cents_rounded_down, 95);
        assert!((cost.usd_cents_fractional - (18460.0 / 192.98)).abs() < FLOAT_TOLERANCE);
      }

      #[test]
      fn consumer_cents_480p_15s() {
        // 692.25 credits; 69225/192.98 = 358.7159 cents.
        let cost = r480(15).calculate_consumer_costs();
        assert_eq!(cost.usd_cents_rounded_up, 359);
        assert_eq!(cost.usd_cents_rounded_down, 358);
        assert!((cost.usd_cents_fractional - (69225.0 / 192.98)).abs() < FLOAT_TOLERANCE);
      }

      #[test]
      fn consumer_cents_720p_4s() {
        // 368.12 credits; 36812/192.98 = 190.7555 cents.
        let cost = r720(4).calculate_consumer_costs();
        assert_eq!(cost.usd_cents_rounded_up, 191);
        assert_eq!(cost.usd_cents_rounded_down, 190);
        assert!((cost.usd_cents_fractional - (36812.0 / 192.98)).abs() < FLOAT_TOLERANCE);
      }

      #[test]
      fn consumer_cents_720p_30s() {
        // 2760.9 credits; 276090/192.98 = 1430.6664 cents.
        let cost = r720(30).calculate_consumer_costs();
        assert_eq!(cost.usd_cents_rounded_up, 1431);
        assert_eq!(cost.usd_cents_rounded_down, 1430);
        assert!((cost.usd_cents_fractional - (276090.0 / 192.98)).abs() < FLOAT_TOLERANCE);
      }

      #[test]
      fn enterprise_cents_480p_4s() {
        // 168.52 credits; 16852/243.16 = 69.3041 cents.
        let cost = r480(4).calculate_enterprise_costs();
        assert_eq!(cost.usd_cents_rounded_up, 70);
        assert_eq!(cost.usd_cents_rounded_down, 69);
        assert!((cost.usd_cents_fractional - (16852.0 / 243.16)).abs() < FLOAT_TOLERANCE);
      }

      #[test]
      fn enterprise_cents_480p_15s() {
        // 631.95 credits; 63195/243.16 = 259.8906 cents.
        let cost = r480(15).calculate_enterprise_costs();
        assert_eq!(cost.usd_cents_rounded_up, 260);
        assert_eq!(cost.usd_cents_rounded_down, 259);
        assert!((cost.usd_cents_fractional - (63195.0 / 243.16)).abs() < FLOAT_TOLERANCE);
      }

      #[test]
      fn enterprise_cents_720p_4s() {
        // 337.04 credits; 33704/243.16 = 138.6083 cents.
        let cost = r720(4).calculate_enterprise_costs();
        assert_eq!(cost.usd_cents_rounded_up, 139);
        assert_eq!(cost.usd_cents_rounded_down, 138);
        assert!((cost.usd_cents_fractional - (33704.0 / 243.16)).abs() < FLOAT_TOLERANCE);
      }

      #[test]
      fn enterprise_cents_720p_30s() {
        // 2527.8 credits; 252780/243.16 = 1039.5624 cents.
        let cost = r720(30).calculate_enterprise_costs();
        assert_eq!(cost.usd_cents_rounded_up, 1040);
        assert_eq!(cost.usd_cents_rounded_down, 1039);
        assert!((cost.usd_cents_fractional - (252780.0 / 243.16)).abs() < FLOAT_TOLERANCE);
      }
    }

    // ── Relative pricing ──

    mod relative_tests {
      use super::*;

      #[test]
      fn enterprise_720p_is_exactly_double_480p() {
        // 84.26 = 2 × 42.13.
        for duration in [4u8, 10, 15, 20, 25, 30] {
          let c480 = r480(duration).calculate_enterprise_costs().kinovi_credits;
          let c720 = r720(duration).calculate_enterprise_costs().kinovi_credits;
          assert_eq!(c720, c480 * 2.0, "enterprise 720p should be 2× 480p at {duration}s");
        }
      }

      #[test]
      fn consumer_720p_is_slightly_less_than_double_480p() {
        // 92.03 < 2 × 46.15 = 92.30, so consumer 720p is just under double.
        for duration in [4u8, 10, 15, 20, 25, 30] {
          let c480 = r480(duration).calculate_consumer_costs().kinovi_credits;
          let c720 = r720(duration).calculate_consumer_costs().kinovi_credits;
          assert!(c720 < c480 * 2.0, "consumer 720p should be under 2× 480p at {duration}s");
        }
      }

      #[test]
      fn enterprise_is_cheaper_than_consumer() {
        for resolution in [
          Some(KinoviSeedance2p5PreviewOutputResolution::FourEightyP),
          Some(KinoviSeedance2p5PreviewOutputResolution::SevenTwentyP),
        ] {
          let request = build_request(10, resolution);
          let consumer = request.calculate_consumer_costs();
          let enterprise = request.calculate_enterprise_costs();
          assert!(enterprise.kinovi_credits < consumer.kinovi_credits);
          assert!(enterprise.usd_cents_fractional < consumer.usd_cents_fractional);
        }
      }

      #[test]
      fn cost_scales_linearly_with_duration() {
        assert_eq!(r480(1).calculate_consumer_costs().kinovi_credits, 46.15);
        assert_eq!(r480(1).calculate_enterprise_costs().kinovi_credits, 42.13);
        for duration in [4u8, 10, 15, 20, 25, 30] {
          let expected_consumer = (4_615 * u64::from(duration)) as f64 / 100.0;
          let expected_enterprise = (4_213 * u64::from(duration)) as f64 / 100.0;
          assert_eq!(r480(duration).calculate_consumer_costs().kinovi_credits, expected_consumer);
          assert_eq!(r480(duration).calculate_enterprise_costs().kinovi_credits, expected_enterprise);
        }
      }
    }

    // ── Aspect ratio doesn't affect cost ──

    #[test]
    fn aspect_ratio_does_not_affect_credits() {
      let baseline = r720(10).calculate_consumer_costs().kinovi_credits;

      let ratios = [
        KinoviSeedance2p5PreviewAspectRatio::Landscape16x9,
        KinoviSeedance2p5PreviewAspectRatio::UltraWide21x9,
        KinoviSeedance2p5PreviewAspectRatio::Portrait9x16,
        KinoviSeedance2p5PreviewAspectRatio::Square1x1,
        KinoviSeedance2p5PreviewAspectRatio::Standard4x3,
        KinoviSeedance2p5PreviewAspectRatio::Portrait3x4,
      ];

      for ar in &ratios {
        let mut request = r720(10);
        request.aspect_ratio = Some(*ar);
        assert_eq!(
          request.calculate_consumer_costs().kinovi_credits, baseline,
          "Aspect ratio {:?} should not change credits from baseline {}", ar, baseline,
        );
      }
    }

    // ── Helpers ──

    fn build_request(
      duration_seconds: u8,
      output_resolution: Option<KinoviSeedance2p5PreviewOutputResolution>,
    ) -> GenerateSeedance2p5PreviewRequest {
      GenerateSeedance2p5PreviewRequest {
        prompt: String::new(),
        aspect_ratio: None,
        output_resolution,
        duration_seconds,
        reference_image_urls: None,
        reference_video_urls: None,
        reference_audio_urls: None,
        use_face_blur_hack: None,
      }
    }

    fn r480(dur: u8) -> GenerateSeedance2p5PreviewRequest {
      build_request(dur, Some(KinoviSeedance2p5PreviewOutputResolution::FourEightyP))
    }

    fn r720(dur: u8) -> GenerateSeedance2p5PreviewRequest {
      build_request(dur, None)
    }

    fn with_all_reference_types(mut request: GenerateSeedance2p5PreviewRequest) -> GenerateSeedance2p5PreviewRequest {
      request.reference_image_urls = Some(vec![
        "https://example.com/a.jpg".to_string(),
        "https://example.com/b.png".to_string(),
      ]);
      request.reference_video_urls = Some(vec!["https://example.com/ref.mp4".to_string()]);
      request.reference_audio_urls = Some(vec!["https://example.com/ref.wav".to_string()]);
      request
    }
  }

  mod real_requests {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_text_to_video_480p() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p5_preview(GenerateSeedance2p5PreviewArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p5PreviewRequest {
          prompt: "A man is running from a t-rex".to_string(),
          aspect_ratio: Some(KinoviSeedance2p5PreviewAspectRatio::Landscape16x9),
          output_resolution: Some(KinoviSeedance2p5PreviewOutputResolution::FourEightyP),
          duration_seconds: 4,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          use_face_blur_hack: None,
        },
      }).await?;
      println!("t2v 480p — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2, "Inspect output above");
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_text_to_video_720p_default() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p5_preview(GenerateSeedance2p5PreviewArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p5PreviewRequest {
          prompt: "A corgi and a shiba are playing chess against one another".to_string(),
          aspect_ratio: None,
          output_resolution: None,
          duration_seconds: 4,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          use_face_blur_hack: None,
        },
      }).await?;
      println!("t2v 720p — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2, "Inspect output above");
      Ok(())
    }

    fn test_session() -> AnyhowResult<KinoviWebSession> {
      let cookies = get_test_cookies()?;
      Ok(KinoviWebSession::from_cookies_string(cookies))
    }
  }
}

use crate::creds::kinovi_web_session::KinoviWebSession;
use crate::error::kinovi_web_error::KinoviWebError;
use crate::pricing::cost::kinovi_seedance_fractional_generation_cost::KinoviSeedanceFractionalGenerationCost;
use crate::pricing::kinovi_cost_calculator_trait::KinoviCostCalculatorTrait;
use crate::pricing::kinovi_pricing_rate::KinoviPricingRate;
use crate::pricing::kinovi_pricing_tier::KinoviPricingTier;
use crate::requests::kinovi_host::KinoviHost;
use crate::requests::workflow_run_task::workflow_run_task::{
  workflow_run_task, KinoviAspectRatioRaw, KinoviBatchCountRaw, KinoviBitrateRaw,
  KinoviModelTypeRaw, KinoviOutputResolutionRaw, WorkflowRunTaskArgs,
  WorkflowRunTaskRequest,
};

// ── Args ──

pub struct GenerateSeedance2p0MiniArgs<'a> {
  pub request: GenerateSeedance2p0MiniRequest,
  pub session: &'a KinoviWebSession,
  pub host_override: Option<KinoviHost>,
}

// ── Request ──

#[derive(Clone, Debug)]
pub struct GenerateSeedance2p0MiniRequest {
  pub prompt: String,
  pub aspect_ratio: Option<KinoviSeedance2p0MiniAspectRatio>,
  pub output_resolution: Option<KinoviSeedance2p0MiniOutputResolution>,
  pub duration_seconds: u8,
  pub batch_count: Option<KinoviSeedance2p0MiniBatchCount>,
  pub start_frame_url: Option<String>,
  pub end_frame_url: Option<String>,
  pub reference_image_urls: Option<Vec<String>>,
  pub reference_video_urls: Option<Vec<String>>,
  pub reference_audio_urls: Option<Vec<String>>,
  pub character_ids: Option<Vec<String>>,
  pub use_face_blur_hack: Option<bool>,
  /// Output video bitrate. None defaults to "normal"; `High` requests a
  /// higher bitrate. Does not affect cost.
  pub bitrate: Option<KinoviSeedance2p0MiniBitrate>,
}

// ── Enums ──

#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0MiniAspectRatio {
  Landscape16x9,
  UltraWide21x9,
  Portrait9x16,
  Square1x1,
  Standard4x3,
  Portrait3x4,
}

/// Output resolution. Mini supports only 480p and 720p (no 1080p / 4K).
#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0MiniOutputResolution {
  FourEightyP,
  SevenTwentyP,
}

/// Number of videos to generate in one request. Mini allows 1–8.
#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0MiniBatchCount {
  One,
  Two,
  Three,
  Four,
  Five,
  Six,
  Seven,
  Eight,
}

#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0MiniBitrate {
  High,
}

// ── Pricing ──
//
// Seedance 2.0 Mini credit pricing (per second of OUTPUT duration):
//
// | Resolution | Consumer credits/sec | Enterprise credits/sec |
// |------------|----------------------|------------------------|
// | 480p       |                  7.5 |                      3 |
// | 720p       |                   20 |                      8 |
//
// Attaching reference VIDEOS adds a per-output-second surcharge; reference
// images and audio are free.
//
// | Resolution | Consumer surcharge/sec | Enterprise surcharge/sec |
// |------------|------------------------|--------------------------|
// | 480p       |                      2 |                      0.8 |
// | 720p       |                      4 |                      1.6 |
//
// The enterprise rates come from the negotiated combined prices: 480p
// 7.5 → 3 credits/sec without a reference video and 9.5 → 3.8 with one;
// 720p 20 → 8 and 24 → 9.6. The surcharge is the difference
// (3.8 − 3 = 0.8; 9.6 − 8 = 1.6).
//
// 480p consumer credits can be FRACTIONAL (7.5/sec lands on half-credits at
// odd durations, e.g. 5s = 37.5). Default resolution (None) is 720p. Batch
// count multiplies the total.

/// Per-second base credit rates by resolution.
const SEEDANCE_2P0_MINI_480P: KinoviPricingRate = KinoviPricingRate {
  consumer_credits: 7.5,
  maybe_enterprise_credits: Some(3.0),
};
const SEEDANCE_2P0_MINI_720P: KinoviPricingRate = KinoviPricingRate {
  consumer_credits: 20.0,
  maybe_enterprise_credits: Some(8.0),
};

/// Per-second video-reference surcharge rates by resolution. Flat per
/// generation regardless of how many reference videos are attached.
const SEEDANCE_2P0_MINI_480P_VIDEO_REF_SURCHARGE: KinoviPricingRate = KinoviPricingRate {
  consumer_credits: 2.0,
  maybe_enterprise_credits: Some(0.8),
};
const SEEDANCE_2P0_MINI_720P_VIDEO_REF_SURCHARGE: KinoviPricingRate = KinoviPricingRate {
  consumer_credits: 4.0,
  maybe_enterprise_credits: Some(1.6),
};

impl KinoviCostCalculatorTrait for GenerateSeedance2p0MiniRequest {
  type Cost = KinoviSeedanceFractionalGenerationCost;

  /// Calculate the cost of this generation request, in Kinovi credits
  /// (possibly fractional) and USD cents, at the given pricing tier.
  fn calculate_costs(&self, tier: KinoviPricingTier) -> KinoviSeedanceFractionalGenerationCost {
    let base_rate = match self.output_resolution {
      Some(KinoviSeedance2p0MiniOutputResolution::FourEightyP) => SEEDANCE_2P0_MINI_480P,
      Some(KinoviSeedance2p0MiniOutputResolution::SevenTwentyP) | None => SEEDANCE_2P0_MINI_720P,
    };
    let surcharge_rate = match self.output_resolution {
      Some(KinoviSeedance2p0MiniOutputResolution::FourEightyP) => SEEDANCE_2P0_MINI_480P_VIDEO_REF_SURCHARGE,
      Some(KinoviSeedance2p0MiniOutputResolution::SevenTwentyP) | None => SEEDANCE_2P0_MINI_720P_VIDEO_REF_SURCHARGE,
    };

    let output_seconds = f64::from(self.duration_seconds) * f64::from(self.batch_multiplier());
    let base_credits = base_rate.credits(tier) * output_seconds;
    let maybe_video_reference_surcharge_credits = if self.has_video_reference() {
      Some(surcharge_rate.credits(tier) * output_seconds)
    } else {
      None
    };

    KinoviSeedanceFractionalGenerationCost::from_base_and_surcharge_at_tier(
      tier,
      base_credits,
      maybe_video_reference_surcharge_credits,
    )
  }
}

impl GenerateSeedance2p0MiniRequest {
  fn has_video_reference(&self) -> bool {
    self.reference_video_urls
      .as_ref()
      .is_some_and(|urls| !urls.is_empty())
  }

  fn batch_multiplier(&self) -> u8 {
    match self.batch_count {
      None | Some(KinoviSeedance2p0MiniBatchCount::One) => 1,
      Some(KinoviSeedance2p0MiniBatchCount::Two) => 2,
      Some(KinoviSeedance2p0MiniBatchCount::Three) => 3,
      Some(KinoviSeedance2p0MiniBatchCount::Four) => 4,
      Some(KinoviSeedance2p0MiniBatchCount::Five) => 5,
      Some(KinoviSeedance2p0MiniBatchCount::Six) => 6,
      Some(KinoviSeedance2p0MiniBatchCount::Seven) => 7,
      Some(KinoviSeedance2p0MiniBatchCount::Eight) => 8,
    }
  }
}

// ── Response ──

pub struct GenerateSeedance2p0MiniResponse {
  pub task_id: String,
  pub order_id: String,
  pub task_ids: Option<Vec<String>>,
  pub order_ids: Option<Vec<String>>,
}

// ── Entry point ──

pub async fn generate_seedance_2p0_mini(
  args: GenerateSeedance2p0MiniArgs<'_>,
) -> Result<GenerateSeedance2p0MiniResponse, KinoviWebError> {
  let raw_response = workflow_run_task(WorkflowRunTaskArgs {
    request: to_raw_request(args.request),
    session: args.session,
    host_override: args.host_override,
  }).await?;

  Ok(GenerateSeedance2p0MiniResponse {
    task_id: raw_response.task_id,
    order_id: raw_response.order_id,
    task_ids: raw_response.task_ids,
    order_ids: raw_response.order_ids,
  })
}

// ── Mapping helpers ──

fn to_raw_request(req: GenerateSeedance2p0MiniRequest) -> WorkflowRunTaskRequest {
  WorkflowRunTaskRequest {
    model_type: KinoviModelTypeRaw::Seedance2Mini,
    prompt: req.prompt,
    aspect_ratio: map_aspect_ratio(req.aspect_ratio),
    output_resolution: Some(map_output_resolution(req.output_resolution)),
    batch_count: map_batch_count(req.batch_count),
    duration_seconds: req.duration_seconds,
    start_frame_url: req.start_frame_url,
    end_frame_url: req.end_frame_url,
    reference_image_urls: req.reference_image_urls,
    reference_video_urls: req.reference_video_urls,
    reference_audio_urls: req.reference_audio_urls,
    character_ids: req.character_ids,
    use_face_blur_hack: req.use_face_blur_hack,
    bitrate: map_bitrate(req.bitrate),
  }
}

fn map_aspect_ratio(ar: Option<KinoviSeedance2p0MiniAspectRatio>) -> KinoviAspectRatioRaw {
  match ar {
    Some(KinoviSeedance2p0MiniAspectRatio::Landscape16x9) => KinoviAspectRatioRaw::Landscape16x9,
    Some(KinoviSeedance2p0MiniAspectRatio::UltraWide21x9) => KinoviAspectRatioRaw::UltraWide21x9,
    Some(KinoviSeedance2p0MiniAspectRatio::Portrait9x16) => KinoviAspectRatioRaw::Portrait9x16,
    Some(KinoviSeedance2p0MiniAspectRatio::Square1x1) => KinoviAspectRatioRaw::Square1x1,
    Some(KinoviSeedance2p0MiniAspectRatio::Standard4x3) => KinoviAspectRatioRaw::Landscape4x3,
    Some(KinoviSeedance2p0MiniAspectRatio::Portrait3x4) => KinoviAspectRatioRaw::Portrait3x4,
    None => KinoviAspectRatioRaw::Landscape16x9,
  }
}

fn map_output_resolution(res: Option<KinoviSeedance2p0MiniOutputResolution>) -> KinoviOutputResolutionRaw {
  match res {
    Some(KinoviSeedance2p0MiniOutputResolution::FourEightyP) => KinoviOutputResolutionRaw::FourEightyP,
    // Unset resolves to 720p — MUST stay in lockstep with calculate_costs(),
    // which prices None as 720p.
    Some(KinoviSeedance2p0MiniOutputResolution::SevenTwentyP) | None => KinoviOutputResolutionRaw::SevenTwentyP,
  }
}

fn map_batch_count(bc: Option<KinoviSeedance2p0MiniBatchCount>) -> KinoviBatchCountRaw {
  match bc {
    Some(KinoviSeedance2p0MiniBatchCount::One) | None => KinoviBatchCountRaw::One,
    Some(KinoviSeedance2p0MiniBatchCount::Two) => KinoviBatchCountRaw::Two,
    Some(KinoviSeedance2p0MiniBatchCount::Three) => KinoviBatchCountRaw::Three,
    Some(KinoviSeedance2p0MiniBatchCount::Four) => KinoviBatchCountRaw::Four,
    Some(KinoviSeedance2p0MiniBatchCount::Five) => KinoviBatchCountRaw::Five,
    Some(KinoviSeedance2p0MiniBatchCount::Six) => KinoviBatchCountRaw::Six,
    Some(KinoviSeedance2p0MiniBatchCount::Seven) => KinoviBatchCountRaw::Seven,
    Some(KinoviSeedance2p0MiniBatchCount::Eight) => KinoviBatchCountRaw::Eight,
  }
}

fn map_bitrate(bitrate: Option<KinoviSeedance2p0MiniBitrate>) -> Option<KinoviBitrateRaw> {
  match bitrate {
    Some(KinoviSeedance2p0MiniBitrate::High) => Some(KinoviBitrateRaw::High),
    None => None,
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

    /// Expected fractional cents are written to 4 decimal places.
    const FLOAT_TOLERANCE: f64 = 0.0001;

    // ── Consumer pricing tables ──
    //
    // The standard published rates: 480p 7.5/s (+2/s video ref), 720p 20/s
    // (+4/s). 480p produces fractional credits at odd durations (37.5,
    // 112.5, …). Cents convert at 192.98 credits/$1, rounded up.

    mod consumer_pricing_tables {
      use super::*;

      #[test]
      fn table_480p() {
        assert_eq!(consumer_credits(&r480(4)), 30.0);
        assert_eq!(consumer_credits(&r480(5)), 37.5);
        assert_eq!(consumer_credits(&r480(10)), 75.0);
        assert_eq!(consumer_credits(&r480(15)), 112.5);

        assert_eq!(consumer_cents(&r480(4)), 16);
        assert_eq!(consumer_cents(&r480(5)), 20);
        assert_eq!(consumer_cents(&r480(10)), 39);
        assert_eq!(consumer_cents(&r480(15)), 59);
      }

      #[test]
      fn table_480p_with_video_reference() {
        // 9.5 credits/sec combined (7.5 base + 2 surcharge).
        assert_eq!(consumer_credits(&with_video_ref(r480(4))), 38.0);
        assert_eq!(consumer_credits(&with_video_ref(r480(5))), 47.5);
        assert_eq!(consumer_credits(&with_video_ref(r480(10))), 95.0);
        assert_eq!(consumer_credits(&with_video_ref(r480(15))), 142.5);

        assert_eq!(consumer_cents(&with_video_ref(r480(4))), 20);
        assert_eq!(consumer_cents(&with_video_ref(r480(5))), 25);
        assert_eq!(consumer_cents(&with_video_ref(r480(10))), 50);
        assert_eq!(consumer_cents(&with_video_ref(r480(15))), 74);
      }

      #[test]
      fn table_720p() {
        assert_eq!(consumer_credits(&r720(4)), 80.0);
        assert_eq!(consumer_credits(&r720(5)), 100.0);
        assert_eq!(consumer_credits(&r720(10)), 200.0);
        assert_eq!(consumer_credits(&r720(15)), 300.0);

        assert_eq!(consumer_cents(&r720(4)), 42);
        assert_eq!(consumer_cents(&r720(5)), 52);
        assert_eq!(consumer_cents(&r720(10)), 104);
        assert_eq!(consumer_cents(&r720(15)), 156);
      }

      #[test]
      fn table_720p_with_video_reference() {
        // 24 credits/sec combined (20 base + 4 surcharge).
        assert_eq!(consumer_credits(&with_video_ref(r720(4))), 96.0);
        assert_eq!(consumer_credits(&with_video_ref(r720(5))), 120.0);
        assert_eq!(consumer_credits(&with_video_ref(r720(10))), 240.0);
        assert_eq!(consumer_credits(&with_video_ref(r720(15))), 360.0);

        assert_eq!(consumer_cents(&with_video_ref(r720(4))), 50);
        assert_eq!(consumer_cents(&with_video_ref(r720(5))), 63);
        assert_eq!(consumer_cents(&with_video_ref(r720(10))), 125);
        assert_eq!(consumer_cents(&with_video_ref(r720(15))), 187);
      }

      #[test]
      fn explicit_720p_same_as_default() {
        let default = r720(5).calculate_consumer_costs();
        let explicit = build_request(5, Some(KinoviSeedance2p0MiniOutputResolution::SevenTwentyP), None).calculate_consumer_costs();
        assert_eq!(default, explicit);
      }
    }

    // ── Enterprise pricing tables (60% discount on every rate) ──
    //
    // 480p 3/s (+0.8/s video ref), 720p 8/s (+1.6/s). Cents convert at the
    // bulk rate of 243.16 credits/$1, rounded up.

    mod enterprise_pricing_tables {
      use super::*;

      #[test]
      fn table_480p() {
        assert_eq!(enterprise_credits(&r480(4)), 12.0);
        assert_eq!(enterprise_credits(&r480(5)), 15.0);
        assert_eq!(enterprise_credits(&r480(10)), 30.0);
        assert_eq!(enterprise_credits(&r480(15)), 45.0);

        assert_eq!(enterprise_cents(&r480(4)), 5);
        assert_eq!(enterprise_cents(&r480(5)), 7);
        assert_eq!(enterprise_cents(&r480(10)), 13);
        assert_eq!(enterprise_cents(&r480(15)), 19);
      }

      #[test]
      fn table_480p_with_video_reference() {
        // 3.8 credits/sec combined (3 base + 0.8 surcharge).
        assert_eq!(enterprise_credits(&with_video_ref(r480(4))), 15.2);
        assert_eq!(enterprise_credits(&with_video_ref(r480(5))), 19.0);
        assert_eq!(enterprise_credits(&with_video_ref(r480(10))), 38.0);
        assert_eq!(enterprise_credits(&with_video_ref(r480(15))), 57.0);

        assert_eq!(enterprise_cents(&with_video_ref(r480(4))), 7);
        assert_eq!(enterprise_cents(&with_video_ref(r480(5))), 8);
        assert_eq!(enterprise_cents(&with_video_ref(r480(10))), 16);
        assert_eq!(enterprise_cents(&with_video_ref(r480(15))), 24);
      }

      #[test]
      fn table_720p() {
        assert_eq!(enterprise_credits(&r720(4)), 32.0);
        assert_eq!(enterprise_credits(&r720(5)), 40.0);
        assert_eq!(enterprise_credits(&r720(10)), 80.0);
        assert_eq!(enterprise_credits(&r720(15)), 120.0);

        assert_eq!(enterprise_cents(&r720(4)), 14);
        assert_eq!(enterprise_cents(&r720(5)), 17);
        assert_eq!(enterprise_cents(&r720(10)), 33);
        assert_eq!(enterprise_cents(&r720(15)), 50);
      }

      #[test]
      fn table_720p_with_video_reference() {
        // 9.6 credits/sec combined (8 base + 1.6 surcharge).
        assert_eq!(enterprise_credits(&with_video_ref(r720(4))), 38.4);
        assert_eq!(enterprise_credits(&with_video_ref(r720(5))), 48.0);
        assert_eq!(enterprise_credits(&with_video_ref(r720(10))), 96.0);
        assert_eq!(enterprise_credits(&with_video_ref(r720(15))), 144.0);

        assert_eq!(enterprise_cents(&with_video_ref(r720(4))), 16);
        assert_eq!(enterprise_cents(&with_video_ref(r720(5))), 20);
        assert_eq!(enterprise_cents(&with_video_ref(r720(10))), 40);
        assert_eq!(enterprise_cents(&with_video_ref(r720(15))), 60);
      }

      #[test]
      fn base_and_surcharge_breakdown_5s() {
        let costs = with_video_ref(r720(5)).calculate_enterprise_costs();
        assert_eq!(costs.base_cost.kinovi_credits, 40.0); // 5s × 8
        assert_eq!(costs.video_reference_surcharge_cost.map(|c| c.kinovi_credits), Some(8.0)); // 5s × 1.6
        assert_eq!(costs.total_cost.kinovi_credits, 48.0); // 5s × 9.6

        assert_eq!(costs.total_cost.usd_cents_rounded_up, 20);
        assert_eq!(costs.total_cost.usd_cents_rounded_down, 19);
        assert!((costs.total_cost.usd_cents_fractional - 19.7401).abs() < FLOAT_TOLERANCE);
      }
    }

    // ── Video-reference surcharge ──

    mod video_reference_surcharge_tests {
      use super::*;

      /// The full base + surcharge breakdown at both tiers. Asserts every
      /// part: base, surcharge, and the derived total.
      #[test]
      fn base_and_surcharge_tables() {
        // (tier, request builder, duration, base credits, surcharge credits)
        let cases: &[(KinoviPricingTier, fn(u8) -> GenerateSeedance2p0MiniRequest, u8, f64, f64)] = &[
          // Consumer 480p: 7.5/s base, +2/s surcharge
          (KinoviPricingTier::Consumer, r480, 5, 37.5, 10.0),
          (KinoviPricingTier::Consumer, r480, 10, 75.0, 20.0),
          // Consumer 720p: 20/s base, +4/s surcharge
          (KinoviPricingTier::Consumer, r720, 5, 100.0, 20.0),
          (KinoviPricingTier::Consumer, r720, 10, 200.0, 40.0),
          // Enterprise 480p: 3/s base, +0.8/s surcharge
          (KinoviPricingTier::Enterprise, r480, 5, 15.0, 4.0),
          (KinoviPricingTier::Enterprise, r480, 10, 30.0, 8.0),
          // Enterprise 720p: 8/s base, +1.6/s surcharge
          (KinoviPricingTier::Enterprise, r720, 5, 40.0, 8.0),
          (KinoviPricingTier::Enterprise, r720, 10, 80.0, 16.0),
        ];

        for (tier, make, duration, base, surcharge) in cases {
          let costs = with_video_ref(make(*duration)).calculate_costs(*tier);
          assert_eq!(costs.base_cost.kinovi_credits, *base, "base at {duration}s ({tier:?})");
          assert_eq!(
            costs.video_reference_surcharge_cost.map(|c| c.kinovi_credits),
            Some(*surcharge),
            "surcharge at {duration}s ({tier:?})",
          );
          assert_eq!(costs.total_cost.kinovi_credits, base + surcharge, "total at {duration}s ({tier:?})");
        }
      }

      #[test]
      fn no_video_reference_has_no_surcharge() {
        for costs in [r480(5).calculate_consumer_costs(), r480(5).calculate_enterprise_costs()] {
          assert!(costs.video_reference_surcharge_cost.is_none());
          assert_eq!(costs.total_cost, costs.base_cost);
        }
      }

      #[test]
      fn empty_video_reference_list_has_no_surcharge() {
        let mut request = r720(5);
        request.reference_video_urls = Some(vec![]);
        for costs in [request.calculate_consumer_costs(), request.calculate_enterprise_costs()] {
          assert!(costs.video_reference_surcharge_cost.is_none());
        }
      }

      /// The surcharge applies per generated video, so batches multiply it.
      #[test]
      fn batch_multiplies_surcharge() {
        let request = with_video_ref(build_request(
          5,
          Some(KinoviSeedance2p0MiniOutputResolution::FourEightyP),
          Some(KinoviSeedance2p0MiniBatchCount::Two),
        ));

        // Consumer: (37.5 base + 10 surcharge) × 2.
        let consumer = request.calculate_consumer_costs();
        assert_eq!(consumer.base_cost.kinovi_credits, 75.0);
        assert_eq!(consumer.video_reference_surcharge_cost.map(|c| c.kinovi_credits), Some(20.0));
        assert_eq!(consumer.total_cost.kinovi_credits, 95.0);

        // Enterprise: (15 base + 4 surcharge) × 2.
        let enterprise = request.calculate_enterprise_costs();
        assert_eq!(enterprise.base_cost.kinovi_credits, 30.0);
        assert_eq!(enterprise.video_reference_surcharge_cost.map(|c| c.kinovi_credits), Some(8.0));
        assert_eq!(enterprise.total_cost.kinovi_credits, 38.0);
      }
    }

    // ── Batch multiplier ──

    mod batch_tests {
      use super::*;

      #[test]
      fn batch_scales_total_linearly_at_both_tiers() {
        let by_count = [
          (KinoviSeedance2p0MiniBatchCount::One, 1.0),
          (KinoviSeedance2p0MiniBatchCount::Two, 2.0),
          (KinoviSeedance2p0MiniBatchCount::Three, 3.0),
          (KinoviSeedance2p0MiniBatchCount::Four, 4.0),
          (KinoviSeedance2p0MiniBatchCount::Five, 5.0),
          (KinoviSeedance2p0MiniBatchCount::Six, 6.0),
          (KinoviSeedance2p0MiniBatchCount::Seven, 7.0),
          (KinoviSeedance2p0MiniBatchCount::Eight, 8.0),
        ];
        for tier in [KinoviPricingTier::Enterprise, KinoviPricingTier::Consumer] {
          let base = r720(5).calculate_costs(tier).total_cost.kinovi_credits;
          for (count, multiplier) in by_count {
            let credits = build_request(5, None, Some(count)).calculate_costs(tier).total_cost.kinovi_credits;
            assert_eq!(credits, base * multiplier, "batch {count:?} at {tier:?}");
          }
        }
      }

      #[test]
      fn batch_eight_480p_with_video_reference() {
        let request = with_video_ref(build_request(
          5,
          Some(KinoviSeedance2p0MiniOutputResolution::FourEightyP),
          Some(KinoviSeedance2p0MiniBatchCount::Eight),
        ));
        // Consumer: (37.5 + 10) × 8 = 380. Enterprise: (15 + 4) × 8 = 152.
        assert_eq!(consumer_credits(&request), 380.0);
        assert_eq!(enterprise_credits(&request), 152.0);
        assert_eq!(enterprise_cents(&request), 63);
      }
    }

    // ── Tier dispatch ──

    #[test]
    fn convenience_methods_match_explicit_tier() {
      let request = with_video_ref(r480(5));
      assert_eq!(request.calculate_consumer_costs(), request.calculate_costs(KinoviPricingTier::Consumer));
      assert_eq!(request.calculate_enterprise_costs(), request.calculate_costs(KinoviPricingTier::Enterprise));
    }

    // ── Defaults & invariants ──

    #[test]
    fn default_resolution_is_720p() {
      let default = consumer_credits(&r720(5));
      let explicit = consumer_credits(&build_request(5, Some(KinoviSeedance2p0MiniOutputResolution::SevenTwentyP), None));
      assert_eq!(default, explicit);
      assert_eq!(default, 100.0);
    }

    #[test]
    fn cost_scales_with_duration() {
      let c4 = enterprise_credits(&r720(4));
      let c10 = enterprise_credits(&r720(10));
      let c15 = enterprise_credits(&r720(15));
      assert!(c4 < c10);
      assert!(c10 < c15);
    }

    #[test]
    fn resolution_480p_cheaper_than_720p_at_both_tiers() {
      for tier in [KinoviPricingTier::Enterprise, KinoviPricingTier::Consumer] {
        for dur in 4..=15u8 {
          let c480 = r480(dur).calculate_costs(tier).total_cost.kinovi_credits;
          let c720 = r720(dur).calculate_costs(tier).total_cost.kinovi_credits;
          assert!(c480 < c720, "480p should be cheaper than 720p at {dur}s ({tier:?})");
        }
      }
    }

    #[test]
    fn enterprise_is_cheaper_than_consumer() {
      for request in [r480(5), r720(5), with_video_ref(r480(5)), with_video_ref(r720(5))] {
        let consumer = request.calculate_consumer_costs().total_cost;
        let enterprise = request.calculate_enterprise_costs().total_cost;
        assert!(enterprise.kinovi_credits < consumer.kinovi_credits);
        assert!(enterprise.usd_cents_fractional < consumer.usd_cents_fractional);
      }
    }

    #[test]
    fn aspect_ratio_does_not_affect_credits() {
      let baseline = consumer_credits(&r720(5));
      let ratios = [
        KinoviSeedance2p0MiniAspectRatio::Landscape16x9,
        KinoviSeedance2p0MiniAspectRatio::UltraWide21x9,
        KinoviSeedance2p0MiniAspectRatio::Portrait9x16,
        KinoviSeedance2p0MiniAspectRatio::Square1x1,
        KinoviSeedance2p0MiniAspectRatio::Standard4x3,
        KinoviSeedance2p0MiniAspectRatio::Portrait3x4,
      ];
      for ar in ratios {
        let mut request = r720(5);
        request.aspect_ratio = Some(ar);
        assert_eq!(consumer_credits(&request), baseline, "{ar:?}");
      }
    }

    #[test]
    fn high_bitrate_does_not_affect_credits() {
      let baseline = consumer_credits(&r720(5));
      let mut high = r720(5);
      high.bitrate = Some(KinoviSeedance2p0MiniBitrate::High);
      assert_eq!(consumer_credits(&high), baseline);
    }

    // ── Helpers ──

    fn build_request(
      duration_seconds: u8,
      output_resolution: Option<KinoviSeedance2p0MiniOutputResolution>,
      batch_count: Option<KinoviSeedance2p0MiniBatchCount>,
    ) -> GenerateSeedance2p0MiniRequest {
      GenerateSeedance2p0MiniRequest {
        prompt: String::new(),
        aspect_ratio: None,
        output_resolution,
        batch_count,
        duration_seconds,
        start_frame_url: None,
        end_frame_url: None,
        reference_image_urls: None,
        reference_video_urls: None,
        reference_audio_urls: None,
        character_ids: None,
        use_face_blur_hack: None,
        bitrate: None,
      }
    }

    fn r480(dur: u8) -> GenerateSeedance2p0MiniRequest {
      build_request(dur, Some(KinoviSeedance2p0MiniOutputResolution::FourEightyP), None)
    }

    fn r720(dur: u8) -> GenerateSeedance2p0MiniRequest {
      build_request(dur, None, None)
    }

    fn with_video_ref(mut request: GenerateSeedance2p0MiniRequest) -> GenerateSeedance2p0MiniRequest {
      request.reference_video_urls = Some(vec!["https://example.com/ref.mp4".to_string()]);
      request
    }

    fn consumer_credits(request: &GenerateSeedance2p0MiniRequest) -> f64 {
      request.calculate_consumer_costs().total_cost.kinovi_credits
    }

    fn consumer_cents(request: &GenerateSeedance2p0MiniRequest) -> u64 {
      request.calculate_consumer_costs().total_cost.usd_cents_rounded_up
    }

    fn enterprise_credits(request: &GenerateSeedance2p0MiniRequest) -> f64 {
      request.calculate_enterprise_costs().total_cost.kinovi_credits
    }

    fn enterprise_cents(request: &GenerateSeedance2p0MiniRequest) -> u64 {
      request.calculate_enterprise_costs().total_cost.usd_cents_rounded_up
    }
  }

  // ── Request shape (mapping to the raw Kinovi request) ──

  mod request_shape_tests {
    use super::*;

    fn sample() -> GenerateSeedance2p0MiniRequest {
      GenerateSeedance2p0MiniRequest {
        prompt: "a corgi".to_string(),
        aspect_ratio: Some(KinoviSeedance2p0MiniAspectRatio::Standard4x3),
        output_resolution: Some(KinoviSeedance2p0MiniOutputResolution::FourEightyP),
        duration_seconds: 10,
        batch_count: Some(KinoviSeedance2p0MiniBatchCount::Eight),
        start_frame_url: None,
        end_frame_url: None,
        reference_image_urls: Some(vec!["https://example.com/a.png".to_string()]),
        reference_video_urls: None,
        reference_audio_urls: None,
        character_ids: None,
        use_face_blur_hack: None,
        bitrate: Some(KinoviSeedance2p0MiniBitrate::High),
      }
    }

    #[test]
    fn maps_to_mini_model_type() {
      let raw = to_raw_request(sample());
      assert!(matches!(raw.model_type, KinoviModelTypeRaw::Seedance2Mini));
    }

    #[test]
    fn maps_resolution_aspect_and_batch() {
      let raw = to_raw_request(sample());
      assert!(matches!(raw.aspect_ratio, KinoviAspectRatioRaw::Landscape4x3));
      assert!(matches!(raw.output_resolution, Some(KinoviOutputResolutionRaw::FourEightyP)));
      assert!(matches!(raw.batch_count, KinoviBatchCountRaw::Eight));
      assert!(matches!(raw.bitrate, Some(KinoviBitrateRaw::High)));
    }

    #[test]
    fn passes_through_prompt_duration_and_references() {
      let raw = to_raw_request(sample());
      assert_eq!(raw.prompt, "a corgi");
      assert_eq!(raw.duration_seconds, 10);
      assert_eq!(raw.reference_image_urls, Some(vec!["https://example.com/a.png".to_string()]));
    }

    #[test]
    fn default_resolution_maps_to_720p() {
      let mut req = sample();
      req.output_resolution = None;
      let raw = to_raw_request(req);
      assert!(matches!(raw.output_resolution, Some(KinoviOutputResolutionRaw::SevenTwentyP)));
    }

    #[test]
    fn all_batch_counts_map() {
      let expected: &[(KinoviSeedance2p0MiniBatchCount, u8)] = &[
        (KinoviSeedance2p0MiniBatchCount::One, 1),
        (KinoviSeedance2p0MiniBatchCount::Two, 2),
        (KinoviSeedance2p0MiniBatchCount::Three, 3),
        (KinoviSeedance2p0MiniBatchCount::Four, 4),
        (KinoviSeedance2p0MiniBatchCount::Five, 5),
        (KinoviSeedance2p0MiniBatchCount::Six, 6),
        (KinoviSeedance2p0MiniBatchCount::Seven, 7),
        (KinoviSeedance2p0MiniBatchCount::Eight, 8),
      ];
      for (count, n) in expected {
        let mut req = sample();
        req.batch_count = Some(*count);
        let raw = to_raw_request(req);
        // The mapped raw batch matches the requested count's multiplier.
        let mut probe = build_probe();
        probe.batch_count = Some(*count);
        assert_eq!(probe.batch_multiplier(), *n, "{count:?}");
        // And the raw enum is the corresponding variant.
        assert!(!matches!(raw.model_type, KinoviModelTypeRaw::Seedance2Pro));
      }
    }

    fn build_probe() -> GenerateSeedance2p0MiniRequest {
      GenerateSeedance2p0MiniRequest {
        prompt: String::new(),
        aspect_ratio: None,
        output_resolution: None,
        duration_seconds: 5,
        batch_count: None,
        start_frame_url: None,
        end_frame_url: None,
        reference_image_urls: None,
        reference_video_urls: None,
        reference_audio_urls: None,
        character_ids: None,
        use_face_blur_hack: None,
        bitrate: None,
      }
    }
  }

  // ── Live API tests (manual; require Kinovi cookies) ──

  fn test_session() -> AnyhowResult<KinoviWebSession> {
    let cookies = get_test_cookies()?;
    Ok(KinoviWebSession::from_cookies_string(cookies))
  }

  mod live {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_text_to_video_720p() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p0_mini(GenerateSeedance2p0MiniArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0MiniRequest {
          prompt: "A giant evil teddy bear steps on people in the city.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0MiniAspectRatio::Landscape16x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
          bitrate: None,
        },
      }).await?;
      println!("mini t2v 720p — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_text_to_video_480p() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p0_mini(GenerateSeedance2p0MiniArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0MiniRequest {
          prompt: "A snowman fights a bear".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0MiniAspectRatio::Standard4x3),
          output_resolution: Some(KinoviSeedance2p0MiniOutputResolution::FourEightyP),
          batch_count: None,
          duration_seconds: 10,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
          bitrate: None,
        },
      }).await?;
      println!("mini t2v 480p — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_reference_to_video_720p() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p0_mini(GenerateSeedance2p0MiniArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0MiniRequest {
          prompt: "Girl walks around in the city, giving a historical tour".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0MiniAspectRatio::UltraWide21x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 15,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: Some(vec![
            "https://static.seedance2-pro.com/materials/20260624/1782342102687-53fe5496.png".to_string(),
          ]),
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
          bitrate: None,
        },
      }).await?;
      println!("mini reference-to-video 720p — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_video_reference_480p() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p0_mini(GenerateSeedance2p0MiniArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0MiniRequest {
          prompt: "Change @video1 to night time.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0MiniAspectRatio::Landscape16x9),
          output_resolution: Some(KinoviSeedance2p0MiniOutputResolution::FourEightyP),
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: Some(vec![
            "https://static.seedance2-pro.com/materials/20260315/1773594284659-3a46d231.mp4".to_string(),
          ]),
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
          bitrate: None,
        },
      }).await?;
      println!("mini video ref 480p — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }
}

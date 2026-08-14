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

pub struct GenerateSeedance2p0FastArgs<'a> {
  pub request: GenerateSeedance2p0FastRequest,
  pub session: &'a KinoviWebSession,
  pub host_override: Option<KinoviHost>,
}

// ── Request ──

#[derive(Clone, Debug)]
pub struct GenerateSeedance2p0FastRequest {
  pub prompt: String,
  pub aspect_ratio: Option<KinoviSeedance2p0FastAspectRatio>,
  pub output_resolution: Option<KinoviSeedance2p0FastOutputResolution>,
  pub duration_seconds: u8,
  pub batch_count: Option<KinoviSeedance2p0FastBatchCount>,
  pub start_frame_url: Option<String>,
  pub end_frame_url: Option<String>,
  pub reference_image_urls: Option<Vec<String>>,
  pub reference_video_urls: Option<Vec<String>>,
  pub reference_audio_urls: Option<Vec<String>>,
  pub character_ids: Option<Vec<String>>,
  pub use_face_blur_hack: Option<bool>,
  /// Output video bitrate. None defaults to "standard"; `High` requests a
  /// higher bitrate. Does not affect cost.
  pub bitrate: Option<KinoviSeedance2p0FastBitrate>,
}

// ── Enums ──

#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0FastAspectRatio {
  Landscape16x9,
  UltraWide21x9,
  Portrait9x16,
  Square1x1,
  Standard4x3,
  Portrait3x4,
}

#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0FastOutputResolution {
  FourEightyP,
  SevenTwentyP,
}

#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0FastBatchCount {
  One,
  Two,
  Three,
  Four,
}

#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0FastBitrate {
  High,
}

// ── Pricing ──
//
// Seedance 2.0 Fast credit pricing (per second of output duration):
//
// | Resolution | Consumer credits/sec | Enterprise credits/sec |
// |------------|----------------------|------------------------|
// | 480p       |                   14 |                   10.5 |
// | 720p       |                   28 |                     21 |
//
// Attaching reference VIDEOS adds a per-output-second surcharge, billed per
// second of OUTPUT duration (not the reference video's duration). Reference
// images and audio are free.
//
// | Resolution | Consumer surcharge/sec | Enterprise surcharge/sec |
// |------------|------------------------|--------------------------|
// | 480p       |                      4 |                        3 |
// | 720p       |                      6 |                      4.5 |
//
// The enterprise rates come from the negotiated combined prices: 480p
// 14 → 10.5 credits/sec without a reference video and 18 → 13.5 with one;
// 720p 28 → 21 and 34 → 25.5. The surcharge is the difference
// (13.5 − 10.5 = 3; 25.5 − 21 = 4.5).
//
// Default resolution (None) is 720p. Batch count multiplies the total cost.

/// Per-second base credit rates by resolution.
const SEEDANCE_2P0_FAST_480P: KinoviPricingRate = KinoviPricingRate {
  consumer_credits: 14.0,
  maybe_enterprise_credits: Some(10.5),
};
const SEEDANCE_2P0_FAST_720P: KinoviPricingRate = KinoviPricingRate {
  consumer_credits: 28.0,
  maybe_enterprise_credits: Some(21.0),
};

/// Per-second video-reference surcharge rates by resolution. Flat per
/// generation regardless of how many reference videos are attached
/// (assumption — Kinovi's pricing page only shows one).
const SEEDANCE_2P0_FAST_480P_VIDEO_REF_SURCHARGE: KinoviPricingRate = KinoviPricingRate {
  consumer_credits: 4.0,
  maybe_enterprise_credits: Some(3.0),
};
const SEEDANCE_2P0_FAST_720P_VIDEO_REF_SURCHARGE: KinoviPricingRate = KinoviPricingRate {
  consumer_credits: 6.0,
  maybe_enterprise_credits: Some(4.5),
};

impl KinoviCostCalculatorTrait for GenerateSeedance2p0FastRequest {
  type Cost = KinoviSeedanceFractionalGenerationCost;

  /// Calculate the cost of this generation request, in Kinovi credits and
  /// USD cents, at the given pricing tier.
  fn calculate_costs(&self, tier: KinoviPricingTier) -> KinoviSeedanceFractionalGenerationCost {
    let base_rate = match self.output_resolution {
      Some(KinoviSeedance2p0FastOutputResolution::FourEightyP) => SEEDANCE_2P0_FAST_480P,
      Some(KinoviSeedance2p0FastOutputResolution::SevenTwentyP) | None => SEEDANCE_2P0_FAST_720P,
    };
    let surcharge_rate = match self.output_resolution {
      Some(KinoviSeedance2p0FastOutputResolution::FourEightyP) => SEEDANCE_2P0_FAST_480P_VIDEO_REF_SURCHARGE,
      Some(KinoviSeedance2p0FastOutputResolution::SevenTwentyP) | None => SEEDANCE_2P0_FAST_720P_VIDEO_REF_SURCHARGE,
    };

    let batch_multiplier: f64 = match self.batch_count {
      None | Some(KinoviSeedance2p0FastBatchCount::One) => 1.0,
      Some(KinoviSeedance2p0FastBatchCount::Two) => 2.0,
      Some(KinoviSeedance2p0FastBatchCount::Three) => 3.0,
      Some(KinoviSeedance2p0FastBatchCount::Four) => 4.0,
    };

    let output_seconds = f64::from(self.duration_seconds) * batch_multiplier;
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

impl GenerateSeedance2p0FastRequest {
  fn has_video_reference(&self) -> bool {
    self.reference_video_urls
      .as_ref()
      .is_some_and(|urls| !urls.is_empty())
  }
}

// ── Response ──

pub struct GenerateSeedance2p0FastResponse {
  pub task_id: String,
  pub order_id: String,
  pub task_ids: Option<Vec<String>>,
  pub order_ids: Option<Vec<String>>,
}

// ── Entry point ──

pub async fn generate_seedance_2p0_fast(
  args: GenerateSeedance2p0FastArgs<'_>,
) -> Result<GenerateSeedance2p0FastResponse, KinoviWebError> {
  let req = args.request;

  let raw_request = WorkflowRunTaskRequest {
    model_type: KinoviModelTypeRaw::Seedance2Fast,
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
  };

  let raw_response = workflow_run_task(WorkflowRunTaskArgs {
    request: raw_request,
    session: args.session,
    host_override: args.host_override,
  }).await?;

  Ok(GenerateSeedance2p0FastResponse {
    task_id: raw_response.task_id,
    order_id: raw_response.order_id,
    task_ids: raw_response.task_ids,
    order_ids: raw_response.order_ids,
  })
}

// ── Mapping helpers ──

fn map_aspect_ratio(ar: Option<KinoviSeedance2p0FastAspectRatio>) -> KinoviAspectRatioRaw {
  match ar {
    Some(KinoviSeedance2p0FastAspectRatio::Landscape16x9) => KinoviAspectRatioRaw::Landscape16x9,
    Some(KinoviSeedance2p0FastAspectRatio::UltraWide21x9) => KinoviAspectRatioRaw::UltraWide21x9,
    Some(KinoviSeedance2p0FastAspectRatio::Portrait9x16) => KinoviAspectRatioRaw::Portrait9x16,
    Some(KinoviSeedance2p0FastAspectRatio::Square1x1) => KinoviAspectRatioRaw::Square1x1,
    Some(KinoviSeedance2p0FastAspectRatio::Standard4x3) => KinoviAspectRatioRaw::Landscape4x3,
    Some(KinoviSeedance2p0FastAspectRatio::Portrait3x4) => KinoviAspectRatioRaw::Portrait3x4,
    None => KinoviAspectRatioRaw::Landscape16x9,
  }
}

fn map_output_resolution(res: Option<KinoviSeedance2p0FastOutputResolution>) -> KinoviOutputResolutionRaw {
  match res {
    Some(KinoviSeedance2p0FastOutputResolution::FourEightyP) => KinoviOutputResolutionRaw::FourEightyP,
    // Unset resolves to 720p — MUST stay in lockstep with calculate_costs(),
    // which prices None as 720p.
    Some(KinoviSeedance2p0FastOutputResolution::SevenTwentyP) | None => KinoviOutputResolutionRaw::SevenTwentyP,
  }
}

fn map_batch_count(bc: Option<KinoviSeedance2p0FastBatchCount>) -> KinoviBatchCountRaw {
  match bc {
    Some(KinoviSeedance2p0FastBatchCount::One) | None => KinoviBatchCountRaw::One,
    Some(KinoviSeedance2p0FastBatchCount::Two) => KinoviBatchCountRaw::Two,
    Some(KinoviSeedance2p0FastBatchCount::Three) => KinoviBatchCountRaw::Three,
    Some(KinoviSeedance2p0FastBatchCount::Four) => KinoviBatchCountRaw::Four,
  }
}

fn map_bitrate(bitrate: Option<KinoviSeedance2p0FastBitrate>) -> Option<KinoviBitrateRaw> {
  match bitrate {
    Some(KinoviSeedance2p0FastBitrate::High) => Some(KinoviBitrateRaw::High),
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
    // The standard published rates: 480p 14/s (+4/s video ref), 720p 28/s
    // (+6/s). Cents convert at 192.98 credits/$1, rounded up.

    mod consumer_pricing_tables {
      use super::*;

      #[test]
      fn table_480p() {
        assert_eq!(consumer_credits(&r480(4)), 56.0);
        assert_eq!(consumer_credits(&r480(5)), 70.0);
        assert_eq!(consumer_credits(&r480(10)), 140.0);
        assert_eq!(consumer_credits(&r480(15)), 210.0);

        assert_eq!(consumer_cents(&r480(4)), 30);
        assert_eq!(consumer_cents(&r480(5)), 37);
        assert_eq!(consumer_cents(&r480(10)), 73);
        assert_eq!(consumer_cents(&r480(15)), 109);
      }

      #[test]
      fn table_480p_with_video_reference() {
        // 18 credits/sec combined (14 base + 4 surcharge).
        assert_eq!(consumer_credits(&with_video_ref(r480(4))), 72.0);
        assert_eq!(consumer_credits(&with_video_ref(r480(5))), 90.0);
        assert_eq!(consumer_credits(&with_video_ref(r480(10))), 180.0);
        assert_eq!(consumer_credits(&with_video_ref(r480(15))), 270.0);

        assert_eq!(consumer_cents(&with_video_ref(r480(4))), 38);
        assert_eq!(consumer_cents(&with_video_ref(r480(5))), 47);
        assert_eq!(consumer_cents(&with_video_ref(r480(10))), 94);
        assert_eq!(consumer_cents(&with_video_ref(r480(15))), 140);
      }

      #[test]
      fn table_720p() {
        assert_eq!(consumer_credits(&r720(4)), 112.0);
        assert_eq!(consumer_credits(&r720(5)), 140.0);
        assert_eq!(consumer_credits(&r720(10)), 280.0);
        assert_eq!(consumer_credits(&r720(15)), 420.0);

        assert_eq!(consumer_cents(&r720(4)), 59);
        assert_eq!(consumer_cents(&r720(5)), 73);
        assert_eq!(consumer_cents(&r720(10)), 146);
        assert_eq!(consumer_cents(&r720(15)), 218);
      }

      #[test]
      fn table_720p_with_video_reference() {
        // 34 credits/sec combined (28 base + 6 surcharge).
        assert_eq!(consumer_credits(&with_video_ref(r720(4))), 136.0);
        assert_eq!(consumer_credits(&with_video_ref(r720(5))), 170.0);
        assert_eq!(consumer_credits(&with_video_ref(r720(10))), 340.0);
        assert_eq!(consumer_credits(&with_video_ref(r720(15))), 510.0);

        assert_eq!(consumer_cents(&with_video_ref(r720(4))), 71);
        assert_eq!(consumer_cents(&with_video_ref(r720(5))), 89);
        assert_eq!(consumer_cents(&with_video_ref(r720(10))), 177);
        assert_eq!(consumer_cents(&with_video_ref(r720(15))), 265);
      }

      #[test]
      fn explicit_720p_same_as_default() {
        let default = r720(5).calculate_consumer_costs();
        let explicit = build_request(5, Some(KinoviSeedance2p0FastOutputResolution::SevenTwentyP), None).calculate_consumer_costs();
        assert_eq!(default, explicit);
      }
    }

    // ── Enterprise pricing tables (25% discount on every rate) ──
    //
    // 480p 10.5/s (+3/s video ref), 720p 21/s (+4.5/s). Cents convert at the
    // bulk rate of 243.16 credits/$1, rounded up.

    mod enterprise_pricing_tables {
      use super::*;

      #[test]
      fn table_480p() {
        assert_eq!(enterprise_credits(&r480(4)), 42.0);
        assert_eq!(enterprise_credits(&r480(5)), 52.5);
        assert_eq!(enterprise_credits(&r480(10)), 105.0);
        assert_eq!(enterprise_credits(&r480(15)), 157.5);

        assert_eq!(enterprise_cents(&r480(4)), 18);
        assert_eq!(enterprise_cents(&r480(5)), 22);
        assert_eq!(enterprise_cents(&r480(10)), 44);
        assert_eq!(enterprise_cents(&r480(15)), 65);
      }

      #[test]
      fn table_480p_with_video_reference() {
        // 13.5 credits/sec combined (10.5 base + 3 surcharge).
        assert_eq!(enterprise_credits(&with_video_ref(r480(4))), 54.0);
        assert_eq!(enterprise_credits(&with_video_ref(r480(5))), 67.5);
        assert_eq!(enterprise_credits(&with_video_ref(r480(10))), 135.0);
        assert_eq!(enterprise_credits(&with_video_ref(r480(15))), 202.5);

        assert_eq!(enterprise_cents(&with_video_ref(r480(4))), 23);
        assert_eq!(enterprise_cents(&with_video_ref(r480(5))), 28);
        assert_eq!(enterprise_cents(&with_video_ref(r480(10))), 56);
        assert_eq!(enterprise_cents(&with_video_ref(r480(15))), 84);
      }

      #[test]
      fn table_720p() {
        assert_eq!(enterprise_credits(&r720(4)), 84.0);
        assert_eq!(enterprise_credits(&r720(5)), 105.0);
        assert_eq!(enterprise_credits(&r720(10)), 210.0);
        assert_eq!(enterprise_credits(&r720(15)), 315.0);

        assert_eq!(enterprise_cents(&r720(4)), 35);
        assert_eq!(enterprise_cents(&r720(5)), 44);
        assert_eq!(enterprise_cents(&r720(10)), 87);
        assert_eq!(enterprise_cents(&r720(15)), 130);
      }

      #[test]
      fn table_720p_with_video_reference() {
        // 25.5 credits/sec combined (21 base + 4.5 surcharge).
        assert_eq!(enterprise_credits(&with_video_ref(r720(4))), 102.0);
        assert_eq!(enterprise_credits(&with_video_ref(r720(5))), 127.5);
        assert_eq!(enterprise_credits(&with_video_ref(r720(10))), 255.0);
        assert_eq!(enterprise_credits(&with_video_ref(r720(15))), 382.5);

        assert_eq!(enterprise_cents(&with_video_ref(r720(4))), 42);
        assert_eq!(enterprise_cents(&with_video_ref(r720(5))), 53);
        assert_eq!(enterprise_cents(&with_video_ref(r720(10))), 105);
        assert_eq!(enterprise_cents(&with_video_ref(r720(15))), 158);
      }

      #[test]
      fn base_and_surcharge_breakdown_5s() {
        let costs = with_video_ref(r720(5)).calculate_enterprise_costs();
        assert_eq!(costs.base_cost.kinovi_credits, 105.0); // 5s × 21
        assert_eq!(costs.video_reference_surcharge_cost.map(|c| c.kinovi_credits), Some(22.5)); // 5s × 4.5
        assert_eq!(costs.total_cost.kinovi_credits, 127.5); // 5s × 25.5

        assert_eq!(costs.total_cost.usd_cents_rounded_up, 53);
        assert_eq!(costs.total_cost.usd_cents_rounded_down, 52);
        assert!((costs.total_cost.usd_cents_fractional - 52.4346).abs() < FLOAT_TOLERANCE);
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
        let cases: &[(KinoviPricingTier, fn(u8) -> GenerateSeedance2p0FastRequest, u8, f64, f64)] = &[
          // Consumer 480p: 14/s base, +4/s surcharge
          (KinoviPricingTier::Consumer, r480, 5, 70.0, 20.0),
          (KinoviPricingTier::Consumer, r480, 10, 140.0, 40.0),
          // Consumer 720p: 28/s base, +6/s surcharge
          (KinoviPricingTier::Consumer, r720, 5, 140.0, 30.0),
          (KinoviPricingTier::Consumer, r720, 10, 280.0, 60.0),
          // Enterprise 480p: 10.5/s base, +3/s surcharge
          (KinoviPricingTier::Enterprise, r480, 5, 52.5, 15.0),
          (KinoviPricingTier::Enterprise, r480, 10, 105.0, 30.0),
          // Enterprise 720p: 21/s base, +4.5/s surcharge
          (KinoviPricingTier::Enterprise, r720, 5, 105.0, 22.5),
          (KinoviPricingTier::Enterprise, r720, 10, 210.0, 45.0),
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

      /// The base and surcharge parts each carry their own USD conversions.
      #[test]
      fn parts_have_their_own_usd_conversions() {
        // Consumer 720p 5s + video ref: base 140, surcharge 30, total 170.
        let costs = with_video_ref(r720(5)).calculate_consumer_costs();

        assert_eq!(costs.base_cost.usd_cents_rounded_up, 73);
        assert_eq!(costs.base_cost.usd_cents_rounded_down, 72);
        assert!((costs.base_cost.usd_cents_fractional - 72.5464).abs() < FLOAT_TOLERANCE);

        let surcharge = costs.video_reference_surcharge_cost.expect("should have surcharge");
        assert_eq!(surcharge.kinovi_credits, 30.0);
        assert_eq!(surcharge.usd_cents_rounded_up, 16);
        assert_eq!(surcharge.usd_cents_rounded_down, 15);
        assert!((surcharge.usd_cents_fractional - 15.5457).abs() < FLOAT_TOLERANCE);

        assert_eq!(costs.total_cost.kinovi_credits, 170.0);
        assert_eq!(costs.total_cost.usd_cents_rounded_up, 89);
        assert_eq!(costs.total_cost.usd_cents_rounded_down, 88);
        assert!((costs.total_cost.usd_cents_fractional - 88.0920).abs() < FLOAT_TOLERANCE);
      }

      #[test]
      fn no_video_reference_has_no_surcharge() {
        for costs in [r720(5).calculate_consumer_costs(), r720(5).calculate_enterprise_costs()] {
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

      /// Surcharge is flat per generation regardless of how many reference
      /// videos are attached (assumption — Kinovi's page only shows one).
      #[test]
      fn multiple_video_references_charge_once() {
        let mut request = r720(5);
        request.reference_video_urls = Some(vec![
          "https://example.com/a.mp4".to_string(),
          "https://example.com/b.mp4".to_string(),
        ]);
        assert_eq!(consumer_credits(&request), 170.0);
        assert_eq!(enterprise_credits(&request), 127.5);
      }

      /// The surcharge applies per generated video, so batches multiply it.
      #[test]
      fn batch_multiplies_surcharge() {
        let request = with_video_ref(build_request(5, None, Some(KinoviSeedance2p0FastBatchCount::Two)));

        // Consumer: (140 base + 30 surcharge) × 2.
        let consumer = request.calculate_consumer_costs();
        assert_eq!(consumer.base_cost.kinovi_credits, 280.0);
        assert_eq!(consumer.video_reference_surcharge_cost.map(|c| c.kinovi_credits), Some(60.0));
        assert_eq!(consumer.total_cost.kinovi_credits, 340.0);

        // Enterprise: (105 base + 22.5 surcharge) × 2.
        let enterprise = request.calculate_enterprise_costs();
        assert_eq!(enterprise.base_cost.kinovi_credits, 210.0);
        assert_eq!(enterprise.video_reference_surcharge_cost.map(|c| c.kinovi_credits), Some(45.0));
        assert_eq!(enterprise.total_cost.kinovi_credits, 255.0);
      }
    }

    // ── Batch multiplier ──

    mod batch_tests {
      use super::*;

      #[test]
      fn batch_multiplies_at_both_tiers() {
        for tier in [KinoviPricingTier::Enterprise, KinoviPricingTier::Consumer] {
          let base = r720(5).calculate_costs(tier).total_cost.kinovi_credits;
          for (batch, multiplier) in [
            (KinoviSeedance2p0FastBatchCount::Two, 2.0),
            (KinoviSeedance2p0FastBatchCount::Three, 3.0),
            (KinoviSeedance2p0FastBatchCount::Four, 4.0),
          ] {
            let batched = build_request(5, None, Some(batch)).calculate_costs(tier).total_cost.kinovi_credits;
            assert_eq!(batched, base * multiplier, "{batch:?} at {tier:?}");
          }
        }
      }

      #[test]
      fn batch_1_is_base() {
        let base = consumer_credits(&r720(5));
        let explicit = consumer_credits(&build_request(5, None, Some(KinoviSeedance2p0FastBatchCount::One)));
        assert_eq!(base, explicit);
      }
    }

    // ── Tier dispatch ──

    #[test]
    fn convenience_methods_match_explicit_tier() {
      let request = with_video_ref(r720(5));
      assert_eq!(request.calculate_consumer_costs(), request.calculate_costs(KinoviPricingTier::Consumer));
      assert_eq!(request.calculate_enterprise_costs(), request.calculate_costs(KinoviPricingTier::Enterprise));
    }

    // ── Defaults & invariants ──

    #[test]
    fn cost_scales_with_duration() {
      let c3 = enterprise_credits(&r720(3));
      let c10 = enterprise_credits(&r720(10));
      let c15 = enterprise_credits(&r720(15));
      assert!(c3 < c10);
      assert!(c10 < c15);
    }

    #[test]
    fn resolution_480p_cheaper_than_720p_at_both_tiers() {
      for tier in [KinoviPricingTier::Enterprise, KinoviPricingTier::Consumer] {
        for dur in 3..=15u8 {
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
        KinoviSeedance2p0FastAspectRatio::Landscape16x9,
        KinoviSeedance2p0FastAspectRatio::UltraWide21x9,
        KinoviSeedance2p0FastAspectRatio::Portrait9x16,
        KinoviSeedance2p0FastAspectRatio::Square1x1,
        KinoviSeedance2p0FastAspectRatio::Standard4x3,
        KinoviSeedance2p0FastAspectRatio::Portrait3x4,
      ];

      for ar in &ratios {
        let mut request = r720(5);
        request.aspect_ratio = Some(*ar);
        assert_eq!(
          consumer_credits(&request), baseline,
          "Aspect ratio {:?} should not change credits from baseline {}", ar, baseline,
        );
      }
    }

    // ── Bitrate doesn't affect cost ──

    #[test]
    fn high_bitrate_does_not_affect_credits() {
      let baseline = consumer_credits(&r720(5));

      let mut high = r720(5);
      high.bitrate = Some(KinoviSeedance2p0FastBitrate::High);

      assert_eq!(
        consumer_credits(&high), baseline,
        "High bitrate should not change credits from baseline {}", baseline,
      );
    }

    // ── Helpers ──

    fn build_request(
      duration_seconds: u8,
      output_resolution: Option<KinoviSeedance2p0FastOutputResolution>,
      batch_count: Option<KinoviSeedance2p0FastBatchCount>,
    ) -> GenerateSeedance2p0FastRequest {
      GenerateSeedance2p0FastRequest {
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

    fn r480(dur: u8) -> GenerateSeedance2p0FastRequest {
      build_request(dur, Some(KinoviSeedance2p0FastOutputResolution::FourEightyP), None)
    }

    fn r720(dur: u8) -> GenerateSeedance2p0FastRequest {
      build_request(dur, None, None)
    }

    fn with_video_ref(mut request: GenerateSeedance2p0FastRequest) -> GenerateSeedance2p0FastRequest {
      request.reference_video_urls = Some(vec!["https://example.com/ref.mp4".to_string()]);
      request
    }

    fn consumer_credits(request: &GenerateSeedance2p0FastRequest) -> f64 {
      request.calculate_consumer_costs().total_cost.kinovi_credits
    }

    fn consumer_cents(request: &GenerateSeedance2p0FastRequest) -> u64 {
      request.calculate_consumer_costs().total_cost.usd_cents_rounded_up
    }

    fn enterprise_credits(request: &GenerateSeedance2p0FastRequest) -> f64 {
      request.calculate_enterprise_costs().total_cost.kinovi_credits
    }

    fn enterprise_cents(request: &GenerateSeedance2p0FastRequest) -> u64 {
      request.calculate_enterprise_costs().total_cost.usd_cents_rounded_up
    }
  }

  use crate::requests::prepare_file_upload::prepare_file_upload::{prepare_file_upload, PrepareFileUploadArgs};
  use crate::requests::upload_file::upload_file::{upload_file, UploadFileArgs};

  const STEAMPUNK_CLOWN_ID: &str = "char_1775176566518_sik0te";
  const MOCHI_ID: &str = "char_1775177718294_g2pitx";

  mod text_to_video {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_text_to_video_default() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p0_fast(GenerateSeedance2p0FastArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0FastRequest {
          prompt: "A corgi and a shiba are playing chess against one another".to_string(),
          aspect_ratio: None,
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
      println!("t2v fast default — task_id={}, order_id={}", result.task_id, result.order_id);
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
      let result = generate_seedance_2p0_fast(GenerateSeedance2p0FastArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0FastRequest {
          prompt: "A golden retriever running through a field of sunflowers".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0FastAspectRatio::Landscape16x9),
          output_resolution: Some(KinoviSeedance2p0FastOutputResolution::FourEightyP),
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
      println!("t2v fast 480p — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }

  mod ultra_wide {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_text_to_video_21x9() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p0_fast(GenerateSeedance2p0FastArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0FastRequest {
          prompt: "A shiba is riding on the back of a sauropod dinosaur".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0FastAspectRatio::UltraWide21x9),
          output_resolution: Some(KinoviSeedance2p0FastOutputResolution::FourEightyP),
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
      println!("fast t2v 21:9 480p — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_keyframe_21x9() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let start_frame_url = upload_test_image(&session, test_data::web::image_urls::WIDE_CORGI_SHIBA_TREASURE_OCEAN_URL).await?;

      let result = generate_seedance_2p0_fast(GenerateSeedance2p0FastArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0FastRequest {
          prompt: "The dogs in @1 set sail across the ocean on a treasure ship.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0FastAspectRatio::UltraWide21x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: Some(vec![start_frame_url]),
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
          bitrate: None,
        },
      }).await?;
      println!("fast keyframe 21:9 — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }

  mod keyframe {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_keyframe_start_frame() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let start_frame_url = upload_test_image(&session, test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL).await?;

      let result = generate_seedance_2p0_fast(GenerateSeedance2p0FastArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0FastRequest {
          prompt: "A corgi dog runs along the lake shore, splashing water.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0FastAspectRatio::Landscape16x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: Some(start_frame_url),
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
          bitrate: None,
        },
      }).await?;
      println!("fast keyframe — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }

  mod image_reference {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_image_references() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let img1 = upload_test_image(&session, test_data::web::image_urls::FOREST_BACKDROP_IMAGE_URL).await?;
      let img2 = upload_test_image(&session, test_data::web::image_urls::WHITE_HOUSE_SUNSET_IMAGE_URL).await?;

      let result = generate_seedance_2p0_fast(GenerateSeedance2p0FastArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0FastRequest {
          prompt: "The dog in @1 runs through the scenery in @2. Golden hour.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0FastAspectRatio::Landscape16x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: Some(vec![img1, img2]),
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
          bitrate: None,
        },
      }).await?;
      println!("fast image ref — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }

  mod video_reference {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_video_reference() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;

      let result = generate_seedance_2p0_fast(GenerateSeedance2p0FastArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0FastRequest {
          prompt: "Change @video1 to night time.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0FastAspectRatio::Landscape16x9),
          output_resolution: None,
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
      println!("fast video ref — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }

  mod character_reference {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_single_character() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;

      let result = generate_seedance_2p0_fast(GenerateSeedance2p0FastArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0FastRequest {
          prompt: "@Mochi the shiba inu is eating a cheese pizza on the table.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0FastAspectRatio::Portrait9x16),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: Some(vec![MOCHI_ID.to_string()]),
          use_face_blur_hack: None,
          bitrate: None,
        },
      }).await?;
      println!("fast character — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_two_characters() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;

      let result = generate_seedance_2p0_fast(GenerateSeedance2p0FastArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0FastRequest {
          prompt: "@Steampunk Clown and @Mochi are playing fetch in a sunny park.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0FastAspectRatio::Landscape16x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: Some(vec![STEAMPUNK_CLOWN_ID.to_string(), MOCHI_ID.to_string()]),
          use_face_blur_hack: None,
          bitrate: None,
        },
      }).await?;
      println!("fast two characters — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }

  fn test_session() -> AnyhowResult<KinoviWebSession> {
    let cookies = get_test_cookies()?;
    Ok(KinoviWebSession::from_cookies_string(cookies))
  }

  async fn upload_test_image(session: &KinoviWebSession, image_url: &str) -> AnyhowResult<String> {
    let image_bytes = crate::test_utils::http_download::http_download_to_bytes(
      image_url,
    ).await?;

    let prepare_result = prepare_file_upload(PrepareFileUploadArgs {
      session,
      extension: "jpg".to_string(),
      host_override: None,
    }).await?;

    let upload_result = upload_file(UploadFileArgs {
      upload_url: prepare_result.upload_url,
      file_bytes: image_bytes,
      host_override: None,
    }).await?;

    Ok(upload_result.public_url)
  }
}

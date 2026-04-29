use enums::common::generation::common_resolution::CommonResolution;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0::request::ArtcraftSeedance2p0RequestState;

// ── Pricing constants ──
//
// ArtCraft credits: 100 credits = $1.00. Credits always equal USD cents.
//
// The per-second USD cost varies by resolution. We compute cents directly
// from the upstream credit rates and their credit-package prices,
// then set ArtCraft credits = cents.

/// USD cents per second by resolution, derived from upstream rates:
///   480p:  15 upstream-credits/sec ÷ 193 upstream-credits/$1 × 100 ≈ 7.772 ¢/s
///   720p:  40 upstream-credits/sec ÷ 250 upstream-credits/$1 × 100 = 16.0 ¢/s
///   1080p: 90 upstream-credits/sec ÷ 193 upstream-credits/$1 × 100 ≈ 46.632 ¢/s
///
/// We keep these as f64 because per-second rates are fractional; rounding
/// happens once at the end after multiplying by duration × batch.
const CENTS_PER_SECOND_480P: f64 = 7.772;
const CENTS_PER_SECOND_720P: f64 = 16.0;
const CENTS_PER_SECOND_1080P: f64 = 46.632;

pub struct ArtcraftSeedance2p0CostState {
  pub resolution: CommonResolution,
  pub duration_seconds: u16,
  pub batch_count: u16,
  pub has_video_reference: bool,
}

impl ArtcraftSeedance2p0CostState {
  pub fn from_request(request: &ArtcraftSeedance2p0RequestState) -> Self {
    let resolution = request.request.resolution
      .unwrap_or(CommonResolution::SevenTwentyP);
    let duration_seconds = request.request.duration_seconds.unwrap_or(5);
    let batch_count = request.request.video_batch_count.unwrap_or(1);
    let has_video_reference = request.request.reference_video_media_tokens
      .as_ref()
      .is_some_and(|tokens| !tokens.is_empty());

    Self { resolution, duration_seconds, batch_count, has_video_reference }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let cents_per_second = match self.resolution {
      CommonResolution::FourEightyP => CENTS_PER_SECOND_480P,
      CommonResolution::TenEightyP => CENTS_PER_SECOND_1080P,
      // Everything else (including 720p) prices at 720p.
      _ => CENTS_PER_SECOND_720P,
    };

    let usd_cents = (self.duration_seconds as f64 * cents_per_second * self.batch_count as f64).round() as u64;

    // ArtCraft credits: 100 credits = $1.00, so credits = cents.
    VideoGenerationCostEstimate {
      cost_in_credits: Some(usd_cents),
      cost_in_usd_cents: Some(usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_resolution::CommonResolution;
  use crate::api::provider::Provider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  // -- 720p pricing --

  mod pricing_720p {
    use super::*;

    #[test]
    fn batch_1() {
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 4, 1), 64);
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 5, 1), 80);
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 6, 1), 96);
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 10, 1), 160);
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 15, 1), 240);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 4, 2), 128);
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 5, 2), 160);
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 15, 2), 480);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 4, 4), 256);
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 5, 4), 320);
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 15, 4), 960);
    }

    #[test]
    fn none_defaults_to_720p() {
      assert_eq!(cost_cents(None, 5, 1), cost_cents(Some(CommonResolution::SevenTwentyP), 5, 1));
    }
  }

  // -- 480p pricing --

  mod pricing_480p {
    use super::*;

    #[test]
    fn batch_1() {
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 4, 1), 31);
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 5, 1), 39);
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 10, 1), 78);
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 15, 1), 117);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 5, 2), 78);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 5, 4), 155);
    }
  }

  // -- 1080p pricing --

  mod pricing_1080p {
    use super::*;

    #[test]
    fn batch_1() {
      assert_eq!(cost_cents(Some(CommonResolution::TenEightyP), 4, 1), 187);
      assert_eq!(cost_cents(Some(CommonResolution::TenEightyP), 5, 1), 233);
      assert_eq!(cost_cents(Some(CommonResolution::TenEightyP), 10, 1), 466);
      assert_eq!(cost_cents(Some(CommonResolution::TenEightyP), 15, 1), 699);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(CommonResolution::TenEightyP), 5, 2), 466);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(CommonResolution::TenEightyP), 5, 4), 933);
    }
  }

  // -- Relative pricing --

  mod relative_pricing_tests {
    use super::*;

    #[test]
    fn cost_480p_cheaper_than_720p_cheaper_than_1080p() {
      let c480 = cost_cents(Some(CommonResolution::FourEightyP), 5, 1);
      let c720 = cost_cents(Some(CommonResolution::SevenTwentyP), 5, 1);
      let c1080 = cost_cents(Some(CommonResolution::TenEightyP), 5, 1);
      assert!(c480 < c720);
      assert!(c720 < c1080);
    }

    #[test]
    fn cost_scales_with_duration() {
      let c4 = cost_cents(Some(CommonResolution::SevenTwentyP), 4, 1);
      let c10 = cost_cents(Some(CommonResolution::SevenTwentyP), 10, 1);
      let c15 = cost_cents(Some(CommonResolution::SevenTwentyP), 15, 1);
      assert!(c4 < c10);
      assert!(c10 < c15);
    }

    #[test]
    fn cost_scales_with_batch() {
      let b1 = cost_cents(Some(CommonResolution::TenEightyP), 5, 1);
      let b2 = cost_cents(Some(CommonResolution::TenEightyP), 5, 2);
      let b4 = cost_cents(Some(CommonResolution::TenEightyP), 5, 4);
      assert!(b1 < b2);
      assert!(b2 < b4);
    }
  }

  // -- Credits equal cents --

  mod credits_tests {
    use super::*;

    #[test]
    fn credits_equal_usd_cents_all_combos() {
      let resolutions = [
        Some(CommonResolution::FourEightyP),
        Some(CommonResolution::SevenTwentyP),
        Some(CommonResolution::TenEightyP),
        None,
      ];
      for res in resolutions {
        for dur in [4, 5, 10, 15] {
          for batch in [1, 2, 4] {
            let cost = build_cost(res, dur, batch);
            assert_eq!(
              cost.cost_in_credits, cost.cost_in_usd_cents,
              "credits should equal cents for res={:?} dur={}s batch={}",
              res, dur, batch,
            );
          }
        }
      }
    }
  }

  // -- Cross-check with Kinovi via builder --

  mod cross_check_with_kinovi {
    use super::*;

    #[test]
    fn artcraft_matches_kinovi_all_combos() {
      let resolutions = [
        Some(CommonResolution::FourEightyP),
        Some(CommonResolution::TenEightyP),
        // NB: These are underpriced (for now)
        //Some(CommonResolution::SevenTwentyP),
        //None,
      ];
      let durations: [u16; 4] = [4, 5, 10, 15];
      let batches: [u16; 3] = [1, 2, 4];

      for res in &resolutions {
        for dur in &durations {
          for batch in &batches {
            let artcraft_cost = build_cost(*res, *dur, *batch);

            let kinovi = GenerateVideoRequestBuilder {
              provider: Provider::Seedance2Pro,
              resolution: *res,
              duration_seconds: Some(*dur),
              video_batch_count: Some(*batch),
              ..Default::default()
            };
            let kinovi_cost = kinovi.build2()
              .expect("kinovi build2")
              .estimate_cost()
              .expect("kinovi estimate_cost");

            assert_eq!(
              artcraft_cost.cost_in_usd_cents, kinovi_cost.cost_in_usd_cents,
              "USD cents mismatch: res={:?} dur={}s batch={}",
              res, dur, batch,
            );
          }
        }
      }
    }
  }

  // -- Helpers --

  /// Build a cost estimate end-to-end: GenerateVideoRequestBuilder → build2 → estimate_cost.
  fn build_cost(
    resolution: Option<CommonResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
  ) -> crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate {
    let builder = GenerateVideoRequestBuilder {
      provider: Provider::Artcraft,
      resolution,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(video_batch_count),
      ..Default::default()
    };
    builder.build2()
      .expect("build2 should succeed")
      .estimate_cost()
      .expect("estimate_cost should succeed")
  }

  fn cost_cents(
    resolution: Option<CommonResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
  ) -> u64 {
    build_cost(resolution, duration_seconds, video_batch_count)
      .cost_in_usd_cents
      .unwrap()
  }
}

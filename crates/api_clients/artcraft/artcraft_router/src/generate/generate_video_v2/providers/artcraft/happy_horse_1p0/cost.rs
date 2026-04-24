use enums::common::generation::common_resolution::CommonResolution;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::happy_horse_1p0::request::ArtcraftHappyHorse1p0RequestState;

// ── Pricing constants ──
//
// ArtCraft credits: 100 credits = $1.00. Credits always equal USD cents.
//
// Happy Horse supports 720p and 1080p. Pricing uses the new upstream rate
// (22,000 credits / $114 ≈ 193 credits/$1) for all resolutions.
//
//   720p:  40 upstream-credits/sec ÷ 193 upstream-credits/$1 × 100 ≈ 20.725 ¢/s
//   1080p: 90 upstream-credits/sec ÷ 193 upstream-credits/$1 × 100 ≈ 46.632 ¢/s

const CENTS_PER_SECOND_720P: f64 = 20.725;
const CENTS_PER_SECOND_1080P: f64 = 46.632;

pub struct ArtcraftHappyHorse1p0CostState {
  pub resolution: CommonResolution,
  pub duration_seconds: u16,
  pub batch_count: u16,
}

impl ArtcraftHappyHorse1p0CostState {
  pub fn from_request(request: &ArtcraftHappyHorse1p0RequestState) -> Self {
    let resolution = request.request.resolution
      .unwrap_or(CommonResolution::SevenTwentyP);
    let duration_seconds = request.request.duration_seconds.unwrap_or(5);
    let batch_count = request.request.video_batch_count.unwrap_or(1);

    Self { resolution, duration_seconds, batch_count }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let cents_per_second = match self.resolution {
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
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::provider::Provider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  // ── 720p pricing ──

  mod pricing_720p {
    use super::*;

    #[test]
    fn batch_1() {
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 4, 1), 83);
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 5, 1), 104);
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 10, 1), 207);
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 15, 1), 311);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 5, 2), 207);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 5, 4), 415);
    }

    #[test]
    fn none_defaults_to_720p() {
      assert_eq!(cost_cents(None, 5, 1), cost_cents(Some(CommonResolution::SevenTwentyP), 5, 1));
    }
  }

  // ── 1080p pricing ──

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

  // ── Relative pricing ──

  mod relative_pricing {
    use super::*;

    #[test]
    fn cost_720p_cheaper_than_1080p() {
      let c720 = cost_cents(Some(CommonResolution::SevenTwentyP), 5, 1);
      let c1080 = cost_cents(Some(CommonResolution::TenEightyP), 5, 1);
      assert!(c720 < c1080);
    }

    #[test]
    fn cost_scales_with_duration() {
      let c4 = cost_cents(None, 4, 1);
      let c10 = cost_cents(None, 10, 1);
      let c15 = cost_cents(None, 15, 1);
      assert!(c4 < c10);
      assert!(c10 < c15);
    }

    #[test]
    fn cost_scales_with_batch() {
      let b1 = cost_cents(None, 5, 1);
      let b2 = cost_cents(None, 5, 2);
      let b4 = cost_cents(None, 5, 4);
      assert!(b1 < b2);
      assert!(b2 < b4);
    }
  }

  // ── Credits equal cents ──

  mod credits_tests {
    use super::*;

    #[test]
    fn credits_equal_usd_cents() {
      let resolutions = [
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

  // ── Cross-check with Kinovi ──

  mod cross_check_with_kinovi {
    use super::*;

    #[test]
    fn artcraft_matches_kinovi_all_combos() {
      let resolutions = [
        Some(CommonResolution::SevenTwentyP),
        None,
        Some(CommonResolution::TenEightyP),
      ];
      let durations: [u16; 4] = [4, 5, 10, 15];
      let batches: [u16; 3] = [1, 2, 4];

      for res in &resolutions {
        for dur in &durations {
          for batch in &batches {
            let artcraft_cost = build_cost(*res, *dur, *batch);

            let kinovi = GenerateVideoRequestBuilder {
              model: CommonVideoModel::HappyHorse1p0,
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

  // ── Helpers ──

  fn build_cost(
    resolution: Option<CommonResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
  ) -> crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate {
    let builder = GenerateVideoRequestBuilder {
      model: CommonVideoModel::HappyHorse1p0,
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

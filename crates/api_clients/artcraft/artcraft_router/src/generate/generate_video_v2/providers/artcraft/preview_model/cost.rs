use enums::common::generation::common_resolution::CommonResolution;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::preview_model::request::ArtcraftPreviewModelRequestState;

// ── Pricing constants ──
//
// ArtCraft credits: 100 credits = $1.00. Credits always equal USD cents.

/// USD cents per second by resolution:
///   480p:  $0.10/s = 10.0 ¢/s
///   720p:  $0.25/s = 25.0 ¢/s
///   1080p: $0.50/s = 50.0 ¢/s
const CENTS_PER_SECOND_480P: f64 = 10.0;
const CENTS_PER_SECOND_720P: f64 = 25.0;
const CENTS_PER_SECOND_1080P: f64 = 50.0;

pub struct ArtcraftPreviewModelCostState {
  pub resolution: CommonResolution,
  pub duration_seconds: u16,
  pub batch_count: u16,
}

impl ArtcraftPreviewModelCostState {
  pub fn from_request(request: &ArtcraftPreviewModelRequestState) -> Self {
    let resolution = request.request.resolution
      .unwrap_or(CommonResolution::SevenTwentyP);
    let duration_seconds = request.request.duration_seconds.unwrap_or(5);
    let batch_count = request.request.video_batch_count.unwrap_or(1);

    Self { resolution, duration_seconds, batch_count }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let cents_per_second = match self.resolution {
      CommonResolution::FourEightyP => CENTS_PER_SECOND_480P,
      CommonResolution::TenEightyP => CENTS_PER_SECOND_1080P,
      // Everything else (including 720p) prices at 720p.
      _ => CENTS_PER_SECOND_720P,
    };

    let usd_cents = (self.duration_seconds as f64 * cents_per_second * self.batch_count as f64).round() as u64;

    VideoGenerationCostEstimate {
      cost_in_credits: Some(usd_cents),
      cost_in_usd_cents: Some(usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
      failures_are_refunded: None,
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_resolution::CommonResolution;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::provider::Provider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  // -- 720p pricing --

  mod pricing_720p {
    use super::*;

    #[test]
    fn batch_1() {
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 4, 1), 100);
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 5, 1), 125);
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 10, 1), 250);
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 15, 1), 375);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 5, 2), 250);
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 15, 2), 750);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 5, 4), 500);
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 15, 4), 1500);
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
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 4, 1), 40);
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 5, 1), 50);
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 10, 1), 100);
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 15, 1), 150);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 5, 2), 100);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 5, 4), 200);
    }
  }

  // -- 1080p pricing --

  mod pricing_1080p {
    use super::*;

    #[test]
    fn batch_1() {
      assert_eq!(cost_cents(Some(CommonResolution::TenEightyP), 4, 1), 200);
      assert_eq!(cost_cents(Some(CommonResolution::TenEightyP), 5, 1), 250);
      assert_eq!(cost_cents(Some(CommonResolution::TenEightyP), 10, 1), 500);
      assert_eq!(cost_cents(Some(CommonResolution::TenEightyP), 15, 1), 750);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(CommonResolution::TenEightyP), 5, 2), 500);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(CommonResolution::TenEightyP), 5, 4), 1000);
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

  // -- Helpers --

  fn build_cost(
    resolution: Option<CommonResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
  ) -> crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate {
    let builder = GenerateVideoRequestBuilder {
      model: CommonVideoModel::PreviewModel,
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

use enums::common::generation::common_resolution::CommonResolution;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_fast_g::request::ArtcraftSeedance2p0FastGRequestState;

// ── Pricing constants ──
//
// Based on GmiCloud Seedance 2.0 Fast costs + 30% margin.
//
// GmiCloud rates (cents per second):
//   480p: 1.0 ¢/s → with 30% margin: 1.3 ¢/s
//   720p: 3.1 ¢/s → with 30% margin: 4.03 ¢/s
//
// Formula: cost_cents = ceil(cents_per_second * duration) * batch_count

const CENTS_PER_SECOND_480P: f64 = 1.3;
const CENTS_PER_SECOND_720P: f64 = 4.03;

pub struct ArtcraftSeedance2p0FastGCostState {
  pub resolution: CommonResolution,
  pub duration_seconds: u16,
  pub batch_count: u16,
}

impl ArtcraftSeedance2p0FastGCostState {
  pub fn from_request(request: &ArtcraftSeedance2p0FastGRequestState) -> Self {
    let resolution = request.request.resolution
      .unwrap_or(CommonResolution::SevenTwentyP);
    let duration_seconds = request.request.duration_seconds.unwrap_or(5);
    let batch_count = request.request.video_batch_count.unwrap_or(1);

    Self { resolution, duration_seconds, batch_count }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let cents_per_second = match self.resolution {
      CommonResolution::FourEightyP => CENTS_PER_SECOND_480P,
      // Fast model doesn't support 1080p; all non-480p resolves to 720p pricing
      _ => CENTS_PER_SECOND_720P,
    };

    let cents_per_video = (cents_per_second * self.duration_seconds as f64).ceil() as u64;
    let usd_cents = cents_per_video * self.batch_count as u64;

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

  mod pricing_720p {
    use super::*;

    #[test]
    fn batch_1() {
      // 4.03 * 5 = 20.15 → ceil = 21¢
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 5, 1), 21);
      // 4.03 * 10 = 40.3 → ceil = 41¢
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 10, 1), 41);
      // 4.03 * 15 = 60.45 → ceil = 61¢
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 15, 1), 61);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 10, 2), 82);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 10, 4), 164);
    }

    #[test]
    fn none_defaults_to_720p() {
      assert_eq!(cost_cents(None, 10, 1), cost_cents(Some(CommonResolution::SevenTwentyP), 10, 1));
    }
  }

  mod pricing_480p {
    use super::*;

    #[test]
    fn batch_1() {
      // 1.3 * 5 = 6.5 → ceil = 7¢
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 5, 1), 7);
      // 1.3 * 10 = 13¢
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 10, 1), 13);
      // 1.3 * 15 = 19.5 → ceil = 20¢
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 15, 1), 20);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 10, 4), 52);
    }
  }

  mod relative_pricing {
    use super::*;

    #[test]
    fn cost_480p_cheaper_than_720p() {
      let c480 = cost_cents(Some(CommonResolution::FourEightyP), 10, 1);
      let c720 = cost_cents(Some(CommonResolution::SevenTwentyP), 10, 1);
      assert!(c480 < c720, "480p ({c480}) should be < 720p ({c720})");
    }

    #[test]
    fn cost_scales_with_duration() {
      let c5 = cost_cents(None, 5, 1);
      let c10 = cost_cents(None, 10, 1);
      let c15 = cost_cents(None, 15, 1);
      assert!(c5 < c10);
      assert!(c10 < c15);
    }

    #[test]
    fn fast_g_cheaper_than_standard_g() {
      let fast = cost_cents(Some(CommonResolution::SevenTwentyP), 10, 1);
      let standard = {
        let builder = GenerateVideoRequestBuilder {
          model: CommonVideoModel::Seedance2p0Global,
          provider: Provider::Artcraft,
          resolution: Some(CommonResolution::SevenTwentyP),
          duration_seconds: Some(10),
          video_batch_count: Some(1),
          ..Default::default()
        };
        builder.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
      };
      assert!(fast < standard, "Fast ({fast}¢) should be < Standard ({standard}¢)");
    }

    #[test]
    fn credits_equal_usd_cents() {
      let cost = build_cost(None, 10, 1);
      assert_eq!(cost.cost_in_credits, cost.cost_in_usd_cents);
    }
  }

  fn build_cost(
    resolution: Option<CommonResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
  ) -> crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate {
    let builder = GenerateVideoRequestBuilder {
      model: CommonVideoModel::Seedance2p0FastGlobal,
      provider: Provider::Artcraft,
      resolution,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(video_batch_count),
      ..Default::default()
    };
    builder.build2().expect("build2").estimate_cost().expect("estimate_cost")
  }

  fn cost_cents(resolution: Option<CommonResolution>, duration_seconds: u16, batch: u16) -> u64 {
    build_cost(resolution, duration_seconds, batch).cost_in_usd_cents.unwrap()
  }
}

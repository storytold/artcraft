use enums::common::generation::common_resolution::CommonResolution;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_g::request::ArtcraftSeedance2p0GRequestState;

// ── Pricing constants ──
//
// Based on GmiCloud Seedance 2.0 costs + 30% margin.
//
// GmiCloud rates (tenths of a cent per second):
//   480p:  2.4 → with 30% margin: 3.12
//   720p:  5.2 → with 30% margin: 6.76
//   1080p: 11.6 → with 30% margin: 15.08
//
// Formula: cost_cents = ceil(ceil(tenths_per_second * duration) / 10) * batch_count

const TENTHS_PER_SECOND_480P: f64 = 3.12;
const TENTHS_PER_SECOND_720P: f64 = 6.76;
const TENTHS_PER_SECOND_1080P: f64 = 15.08;

pub struct ArtcraftSeedance2p0GCostState {
  pub resolution: CommonResolution,
  pub duration_seconds: u16,
  pub batch_count: u16,
}

impl ArtcraftSeedance2p0GCostState {
  pub fn from_request(request: &ArtcraftSeedance2p0GRequestState) -> Self {
    let resolution = request.request.resolution
      .unwrap_or(CommonResolution::SevenTwentyP);
    let duration_seconds = request.request.duration_seconds.unwrap_or(5);
    let batch_count = request.request.video_batch_count.unwrap_or(1);

    Self { resolution, duration_seconds, batch_count }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let tenths_per_second = match self.resolution {
      CommonResolution::FourEightyP => TENTHS_PER_SECOND_480P,
      CommonResolution::TenEightyP => TENTHS_PER_SECOND_1080P,
      _ => TENTHS_PER_SECOND_720P,
    };

    let tenths = (tenths_per_second * self.duration_seconds as f64).ceil() as u64;
    let cents_per_video = tenths.div_ceil(10);
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
      // 6.76 * 4 = 27.04 → ceil = 28 tenths → 3¢
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 4, 1), 3);
      // 6.76 * 5 = 33.8 → ceil = 34 tenths → 4¢
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 5, 1), 4);
      // 6.76 * 10 = 67.6 → ceil = 68 → 7¢
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 10, 1), 7);
      // 6.76 * 15 = 101.4 → ceil = 102 → 11¢
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 15, 1), 11);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 5, 2), 8);
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 10, 2), 14);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 5, 4), 16);
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 15, 4), 44);
    }

    #[test]
    fn none_defaults_to_720p() {
      assert_eq!(cost_cents(None, 5, 1), cost_cents(Some(CommonResolution::SevenTwentyP), 5, 1));
    }
  }

  mod pricing_480p {
    use super::*;

    #[test]
    fn batch_1() {
      // 3.12 * 5 = 15.6 → ceil = 16 → 2¢
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 5, 1), 2);
      // 3.12 * 10 = 31.2 → ceil = 32 → 4¢
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 10, 1), 4);
      // 3.12 * 15 = 46.8 → ceil = 47 → 5¢
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 15, 1), 5);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 10, 4), 16);
    }
  }

  mod pricing_1080p {
    use super::*;

    #[test]
    fn batch_1() {
      // 15.08 * 5 = 75.4 → ceil = 76 → 8¢
      assert_eq!(cost_cents(Some(CommonResolution::TenEightyP), 5, 1), 8);
      // 15.08 * 10 = 150.8 → ceil = 151 → 16¢
      assert_eq!(cost_cents(Some(CommonResolution::TenEightyP), 10, 1), 16);
      // 15.08 * 15 = 226.2 → ceil = 227 → 23¢
      assert_eq!(cost_cents(Some(CommonResolution::TenEightyP), 15, 1), 23);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(CommonResolution::TenEightyP), 10, 4), 64);
    }
  }

  mod relative_pricing {
    use super::*;

    #[test]
    fn cost_480p_cheaper_than_720p_cheaper_than_1080p() {
      let c480 = cost_cents(Some(CommonResolution::FourEightyP), 10, 1);
      let c720 = cost_cents(Some(CommonResolution::SevenTwentyP), 10, 1);
      let c1080 = cost_cents(Some(CommonResolution::TenEightyP), 10, 1);
      assert!(c480 < c720);
      assert!(c720 < c1080);
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
    fn cost_scales_with_batch() {
      let b1 = cost_cents(None, 10, 1);
      let b2 = cost_cents(None, 10, 2);
      let b4 = cost_cents(None, 10, 4);
      assert!(b1 < b2);
      assert!(b2 < b4);
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
      model: CommonVideoModel::Seedance2p0Global,
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

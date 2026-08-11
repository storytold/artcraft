use enums::common::generation::common_resolution::CommonResolution;

use crate::generate::generate_video::providers::artcraft::seedance_common::seedance_2p0_four_k_usd_cents;
use crate::generate::generate_video::providers::artcraft::seedance_2p0_bp::request::ArtcraftSeedance2p0BytePlusRequestState;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

/// USD cents per second by resolution:
///   480p:  $0.10/s = 10.0 ¢/s
///   720p:  $0.25/s = 25.0 ¢/s
///   1080p: $0.50/s = 50.0 ¢/s
const CENTS_PER_SECOND_480P: f64 = 10.0;
const CENTS_PER_SECOND_720P: f64 = 25.0;
const CENTS_PER_SECOND_1080P: f64 = 50.0;

/// USD cents per second, in hundredths of a cent, when one or more
/// reference videos are attached. Held as integer hundredths so the math is
/// exact; rounded up to whole cents once, after multiplying by
/// duration × batch.
///   480p:  10.20 ¢/s
///   720p:  25.70 ¢/s
///   1080p: 57.80 ¢/s
///   4K:   113.80 ¢/s
const WITH_VIDEO_REFERENCE_CENTI_CENTS_PER_SECOND_480P: u64 = 1_020;
const WITH_VIDEO_REFERENCE_CENTI_CENTS_PER_SECOND_720P: u64 = 2_570;
const WITH_VIDEO_REFERENCE_CENTI_CENTS_PER_SECOND_1080P: u64 = 5_780;
const WITH_VIDEO_REFERENCE_CENTI_CENTS_PER_SECOND_4K: u64 = 11_380;

pub struct ArtcraftSeedance2p0BytePlusCostState {
  pub resolution: CommonResolution,
  pub duration_seconds: u16,
  pub batch_count: u16,
  pub has_video_reference: bool,
}

impl ArtcraftSeedance2p0BytePlusCostState {
  pub fn from_request(request: &ArtcraftSeedance2p0BytePlusRequestState) -> Self {
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
    if self.has_video_reference {
      let usd_cents = self.with_video_reference_usd_cents();
      return VideoGenerationCostEstimate {
        cost_in_credits: Some(usd_cents),
        cost_in_usd_cents: Some(usd_cents),
        is_free: false,
        is_unlimited: false,
        is_rate_limited: false,
        has_watermark: false,
        failures_are_refunded: None,
      };
    }

    if self.resolution == CommonResolution::FourK {
      let usd_cents = seedance_2p0_four_k_usd_cents(
        self.duration_seconds,
        self.batch_count,
      );
      return VideoGenerationCostEstimate {
        cost_in_credits: Some(usd_cents),
        cost_in_usd_cents: Some(usd_cents),
        is_free: false,
        is_unlimited: false,
        is_rate_limited: false,
        has_watermark: false,
        failures_are_refunded: None,
      };
    }

    let cents_per_second = match self.resolution {
      CommonResolution::FourEightyP => CENTS_PER_SECOND_480P,
      CommonResolution::TenEightyP => CENTS_PER_SECOND_1080P,
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

  /// Price when one or more reference videos are attached.
  fn with_video_reference_usd_cents(&self) -> u64 {
    let centi_cents_per_second = match self.resolution {
      CommonResolution::FourEightyP => WITH_VIDEO_REFERENCE_CENTI_CENTS_PER_SECOND_480P,
      CommonResolution::TenEightyP => WITH_VIDEO_REFERENCE_CENTI_CENTS_PER_SECOND_1080P,
      CommonResolution::FourK => WITH_VIDEO_REFERENCE_CENTI_CENTS_PER_SECOND_4K,
      // Everything else (including 720p) prices at 720p.
      _ => WITH_VIDEO_REFERENCE_CENTI_CENTS_PER_SECOND_720P,
    };

    let seconds = self.duration_seconds as u64 * self.batch_count as u64;

    // Round up to whole cents.
    (centi_cents_per_second * seconds).div_ceil(100)
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  mod pricing_720p {
    use super::*;

    #[test]
    fn batch_1() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 4, 1), 100);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1), 125);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 10, 1), 250);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 15, 1), 375);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 2), 250);
    }

        #[test]
    fn batch_3() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 3), 375);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 4), 500);
    }

    #[test]
    fn none_defaults_to_720p() {
      assert_eq!(cost_cents(None, 5, 1), cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1));
    }
  }

  mod pricing_480p {
    use super::*;

    #[test]
    fn batch_1() {
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 4, 1), 40);
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 1), 50);
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 10, 1), 100);
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 15, 1), 150);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 2), 100);
    }

        #[test]
    fn batch_3() {
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 3), 150);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 4), 200);
    }
  }

  mod pricing_1080p {
    use super::*;

    #[test]
    fn batch_1() {
      assert_eq!(cost_cents(Some(RouterResolution::TenEightyP), 4, 1), 200);
      assert_eq!(cost_cents(Some(RouterResolution::TenEightyP), 5, 1), 250);
      assert_eq!(cost_cents(Some(RouterResolution::TenEightyP), 10, 1), 500);
      assert_eq!(cost_cents(Some(RouterResolution::TenEightyP), 15, 1), 750);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(RouterResolution::TenEightyP), 5, 2), 500);
    }

        #[test]
    fn batch_3() {
      assert_eq!(cost_cents(Some(RouterResolution::TenEightyP), 5, 3), 750);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(RouterResolution::TenEightyP), 5, 4), 1000);
    }
  }

  mod four_k_pricing {
    use enums::common::generation::common_resolution::CommonResolution;

    fn artcraft_4k_cents(duration_seconds: u16, batch_count: u16, has_video_reference: bool) -> u64 {
      super::super::ArtcraftSeedance2p0BytePlusCostState {
        resolution: CommonResolution::FourK,
        duration_seconds,
        batch_count,
        has_video_reference,
      }
      .estimate_cost()
      .cost_in_usd_cents
      .unwrap()
    }

    #[test]
    fn explicit_4k_without_video_reference() {
      assert_eq!(artcraft_4k_cents(4, 1, false), 347);
      assert_eq!(artcraft_4k_cents(5, 1, false), 433);
      assert_eq!(artcraft_4k_cents(10, 1, false), 866);
      assert_eq!(artcraft_4k_cents(15, 1, false), 1299);
    }

    #[test]
    fn explicit_4k_with_video_reference() {
      // 113.80 ¢/s with-reference card, rounded up to whole cents.
      assert_eq!(artcraft_4k_cents(4, 1, true), 456);
      assert_eq!(artcraft_4k_cents(5, 1, true), 569);
      assert_eq!(artcraft_4k_cents(10, 1, true), 1138);
      assert_eq!(artcraft_4k_cents(15, 1, true), 1707);
    }
  }

  mod relative_pricing_tests {
    use super::*;

    #[test]
    fn cost_480p_cheaper_than_720p_cheaper_than_1080p() {
      let c480 = cost_cents(Some(RouterResolution::FourEightyP), 5, 1);
      let c720 = cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1);
      let c1080 = cost_cents(Some(RouterResolution::TenEightyP), 5, 1);
      assert!(c480 < c720);
      assert!(c720 < c1080);
    }
  }

  mod credits_tests {
    use super::*;

    #[test]
    fn credits_equal_usd_cents() {
      for res in [Some(RouterResolution::FourEightyP), Some(RouterResolution::SevenTwentyP), Some(RouterResolution::TenEightyP), None] {
        for dur in [4, 5, 10, 15] {
          for batch in [1, 2, 4] {
            let cost = build_cost(res, dur, batch);
            assert_eq!(cost.cost_in_credits, cost.cost_in_usd_cents);
          }
        }
      }
    }
  }

  // -- Helpers --

  fn build_cost(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
  ) -> crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance2p0BytePlus,
      provider: RouterProvider::Artcraft,
      resolution,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(video_batch_count),
      ..Default::default()
    }.build2().expect("build2").estimate_cost().expect("estimate_cost")
  }

  fn cost_cents(resolution: Option<RouterResolution>, duration_seconds: u16, video_batch_count: u16) -> u64 {
    build_cost(resolution, duration_seconds, video_batch_count).cost_in_usd_cents.unwrap()
  }

  // ── Video reference deltas ──
  //
  // References price on the with-reference rate card (10.20/25.70/57.80/113.80 ¢/s); the delta must be positive at every resolution and duration.

  mod video_reference_deltas {
    use enums::common::generation::common_resolution::CommonResolution;

    use super::super::ArtcraftSeedance2p0BytePlusCostState;

    #[test]
    fn refs_cost_more_at_480p() {
      assert_ref_delta(CommonResolution::FourEightyP, 5, 50, 51, 1);
      assert_ref_delta(CommonResolution::FourEightyP, 10, 100, 102, 2);
      assert_ref_delta(CommonResolution::FourEightyP, 15, 150, 153, 3);
    }

    #[test]
    fn refs_cost_more_at_720p() {
      assert_ref_delta(CommonResolution::SevenTwentyP, 5, 125, 129, 4);
      assert_ref_delta(CommonResolution::SevenTwentyP, 10, 250, 257, 7);
      assert_ref_delta(CommonResolution::SevenTwentyP, 15, 375, 386, 11);
    }

    #[test]
    fn refs_cost_more_at_1080p() {
      assert_ref_delta(CommonResolution::TenEightyP, 5, 250, 289, 39);
      assert_ref_delta(CommonResolution::TenEightyP, 10, 500, 578, 78);
      assert_ref_delta(CommonResolution::TenEightyP, 15, 750, 867, 117);
    }

    #[test]
    fn refs_cost_more_at_4k() {
      assert_ref_delta(CommonResolution::FourK, 5, 433, 569, 136);
      assert_ref_delta(CommonResolution::FourK, 10, 866, 1138, 272);
      assert_ref_delta(CommonResolution::FourK, 15, 1299, 1707, 408);
    }

    /// Price the same generation with and without a reference video; pin
    /// both prices and the delta, in USD cents AND credits (credits equal
    /// cents, and both must show references costing more).
    fn assert_ref_delta(
      resolution: CommonResolution,
      duration_seconds: u16,
      expected_no_ref: u64,
      expected_with_ref: u64,
      expected_delta: u64,
    ) {
      let no_ref = ArtcraftSeedance2p0BytePlusCostState {
        resolution, duration_seconds, batch_count: 1, has_video_reference: false,
      }.estimate_cost();
      let with_ref = ArtcraftSeedance2p0BytePlusCostState {
        resolution, duration_seconds, batch_count: 1, has_video_reference: true,
      }.estimate_cost();

      let no_ref_cents = no_ref.cost_in_usd_cents.unwrap();
      let with_ref_cents = with_ref.cost_in_usd_cents.unwrap();
      assert_eq!(no_ref_cents, expected_no_ref);
      assert_eq!(with_ref_cents, expected_with_ref);
      assert_eq!(with_ref_cents - no_ref_cents, expected_delta);
      assert!(with_ref_cents > no_ref_cents, "references must cost more");

      let no_ref_credits = no_ref.cost_in_credits.unwrap();
      let with_ref_credits = with_ref.cost_in_credits.unwrap();
      assert_eq!(no_ref_credits, expected_no_ref);
      assert_eq!(with_ref_credits, expected_with_ref);
      assert_eq!(with_ref_credits - no_ref_credits, expected_delta);
    }
  }

}

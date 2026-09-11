use enums::common::generation::common_resolution::CommonResolution;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::seedance_2p0_bp_fast::request::ArtcraftSeedance2p0BytePlusFastRequestState;

/// USD cents per second by resolution:
///   480p:  $0.09/s = 9.0 ¢/s
///   720p:  $0.20/s = 20.0 ¢/s
const CENTS_PER_SECOND_480P: f64 = 9.0;
const CENTS_PER_SECOND_720P: f64 = 20.0;

/// USD cents per second, in hundredths of a cent, when one or more
/// reference videos are attached. Held as integer hundredths so the math is
/// exact; rounded up to whole cents once, after multiplying by
/// duration × batch.
///   480p:  9.65 ¢/s
///   720p: 20.50 ¢/s
const WITH_VIDEO_REFERENCE_CENTI_CENTS_PER_SECOND_480P: u64 = 965;
const WITH_VIDEO_REFERENCE_CENTI_CENTS_PER_SECOND_720P: u64 = 2_050;

pub struct ArtcraftSeedance2p0BytePlusFastCostState {
  pub resolution: CommonResolution,
  pub duration_seconds: u16,
  pub batch_count: u16,
  pub has_video_reference: bool,
}

impl ArtcraftSeedance2p0BytePlusFastCostState {
  pub fn from_request(request: &ArtcraftSeedance2p0BytePlusFastRequestState) -> Self {
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

    let cents_per_second = match self.resolution {
      CommonResolution::FourEightyP => CENTS_PER_SECOND_480P,
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
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  mod pricing_720p {
    use super::*;

    #[test]
    fn batch_1() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 4, 1), 80);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1), 100);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 10, 1), 200);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 15, 1), 300);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 2), 200);
    }

        #[test]
    fn batch_3() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 3), 300);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 4), 400);
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
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 4, 1), 36);
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 1), 45);
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 10, 1), 90);
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 15, 1), 135);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 2), 90);
    }

        #[test]
    fn batch_3() {
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 3), 135);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 4), 180);
    }
  }

  mod relative_pricing_tests {
    use super::*;

    #[test]
    fn cost_480p_cheaper_than_720p() {
      assert!(cost_cents(Some(RouterResolution::FourEightyP), 5, 1) < cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1));
    }
  }

  mod credits_tests {
    use super::*;

    #[test]
    fn credits_equal_usd_cents() {
      for res in [Some(RouterResolution::FourEightyP), Some(RouterResolution::SevenTwentyP), None] {
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
      model: RouterVideoModel::Seedance2p0BytePlusFast,
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
}

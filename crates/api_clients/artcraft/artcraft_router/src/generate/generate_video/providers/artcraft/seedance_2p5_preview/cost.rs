use enums::common::generation::common_resolution::CommonResolution;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::seedance_common::seedance_2p5_preview_usd_cents;
use crate::generate::generate_video::providers::artcraft::seedance_2p5_preview::request::ArtcraftSeedance2p5PreviewRequestState;

/// Only the resolution and duration matter — 2.5 Preview has no
/// video-reference surcharge and no batching.
pub struct ArtcraftSeedance2p5PreviewCostState {
  pub resolution: CommonResolution,
  pub duration_seconds: u16,
}

impl ArtcraftSeedance2p5PreviewCostState {
  pub fn from_request(request: &ArtcraftSeedance2p5PreviewRequestState) -> Self {
    let resolution = request.request.resolution
      .unwrap_or(CommonResolution::SevenTwentyP);
    let duration_seconds = request.request.duration_seconds.unwrap_or(5);

    Self { resolution, duration_seconds }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let usd_cents = seedance_2p5_preview_usd_cents(
      self.resolution,
      self.duration_seconds,
    );

    // ArtCraft credits: 100 credits = $1.00, so credits = cents.
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
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::video_list_ref::VideoListRef;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

  use tokens::tokens::media_files::MediaFileToken;

  mod pricing_480p {
    use super::*;

    #[test]
    fn full_duration_table() {
      assert_eq!(cents(Some(RouterResolution::FourEightyP), 4), 86);
      assert_eq!(cents(Some(RouterResolution::FourEightyP), 10), 214);
      assert_eq!(cents(Some(RouterResolution::FourEightyP), 15), 321);
      assert_eq!(cents(Some(RouterResolution::FourEightyP), 20), 428);
      assert_eq!(cents(Some(RouterResolution::FourEightyP), 25), 535);
      assert_eq!(cents(Some(RouterResolution::FourEightyP), 30), 642);
    }
  }

  mod pricing_720p {
    use super::*;

    #[test]
    fn full_duration_table() {
      assert_eq!(cents(Some(RouterResolution::SevenTwentyP), 4), 172);
      assert_eq!(cents(Some(RouterResolution::SevenTwentyP), 10), 428);
      assert_eq!(cents(Some(RouterResolution::SevenTwentyP), 15), 642);
      assert_eq!(cents(Some(RouterResolution::SevenTwentyP), 20), 856);
      assert_eq!(cents(Some(RouterResolution::SevenTwentyP), 25), 1070);
      assert_eq!(cents(Some(RouterResolution::SevenTwentyP), 30), 1283);
    }

    #[test]
    fn none_defaults_to_720p() {
      assert_eq!(cents(None, 10), cents(Some(RouterResolution::SevenTwentyP), 10));
    }
  }

  mod reference_invariance_tests {
    use super::*;

    /// References never affect 2.5 Preview pricing.
    #[test]
    fn video_reference_does_not_change_price() {
      let without = cents(Some(RouterResolution::SevenTwentyP), 10);
      let estimate = estimate_with(|b| {
        b.resolution = Some(RouterResolution::SevenTwentyP);
        b.duration_seconds = Some(10);
        b.reference_videos = Some(VideoListRef::MediaFileTokens(vec![
          MediaFileToken::new("mf_ref".to_string()),
        ]));
      });
      assert_eq!(estimate.cost_in_usd_cents, Some(without));
    }
  }

  mod credits_tests {
    use super::*;

    #[test]
    fn credits_equal_usd_cents() {
      for dur in [4u16, 10, 15, 20, 25, 30] {
        let estimate = estimate_with(|b| {
          b.resolution = Some(RouterResolution::FourEightyP);
          b.duration_seconds = Some(dur);
        });
        assert_eq!(estimate.cost_in_credits, estimate.cost_in_usd_cents);
      }
    }
  }

  // ── Helpers ──

  fn estimate_with(f: impl FnOnce(&mut GenerateVideoRequestBuilder)) -> VideoGenerationCostEstimate {
    let mut builder = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance2p5Preview,
      provider: RouterProvider::Artcraft,
      duration_seconds: Some(5),
      video_batch_count: Some(1),
      ..Default::default()
    };
    f(&mut builder);
    builder.build2()
      .expect("build should succeed")
      .estimate_cost()
      .expect("estimate should succeed")
  }

  fn cents(resolution: Option<RouterResolution>, duration_seconds: u16) -> u64 {
    estimate_with(|b| {
      b.resolution = resolution;
      b.duration_seconds = Some(duration_seconds);
    }).cost_in_usd_cents.unwrap()
  }
}

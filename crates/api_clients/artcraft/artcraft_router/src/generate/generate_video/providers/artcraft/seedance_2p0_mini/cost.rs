use enums::common::generation::common_resolution::CommonResolution;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::seedance_common::seedance_2p0_mini_usd_cents;
use crate::generate::generate_video::providers::artcraft::seedance_2p0_mini::request::ArtcraftSeedance2p0MiniRequestState;

pub struct ArtcraftSeedance2p0MiniCostState {
  pub resolution: CommonResolution,
  pub duration_seconds: u16,
  pub batch_count: u16,
  pub has_video_reference: bool,
}

impl ArtcraftSeedance2p0MiniCostState {
  pub fn from_request(request: &ArtcraftSeedance2p0MiniRequestState) -> Self {
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
    // Seedance 2.0 Mini is priced uniformly across its variants; see
    // seedance_common::seedance_2p0_mini_usd_cents.
    let usd_cents = seedance_2p0_mini_usd_cents(
      self.resolution,
      self.duration_seconds,
      self.batch_count,
      self.has_video_reference,
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
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::api::video_list_ref::VideoListRef;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

  // Every combination, driven through the full build pipeline. These prices are
  // the supplier's per-combo cost plus a 5% margin, rounded up to whole cents.

  mod pricing_480p {
    use super::*;

    #[test]
    fn without_video_reference() {
      assert_eq!(cents(RouterResolution::FourEightyP, 4, 1, false), 13);
      assert_eq!(cents(RouterResolution::FourEightyP, 5, 1, false), 17);
      assert_eq!(cents(RouterResolution::FourEightyP, 10, 1, false), 33);
      assert_eq!(cents(RouterResolution::FourEightyP, 15, 1, false), 49);
    }

    #[test]
    fn with_video_reference() {
      assert_eq!(cents(RouterResolution::FourEightyP, 4, 1, true), 17);
      assert_eq!(cents(RouterResolution::FourEightyP, 5, 1, true), 21);
      assert_eq!(cents(RouterResolution::FourEightyP, 10, 1, true), 42);
      assert_eq!(cents(RouterResolution::FourEightyP, 15, 1, true), 62);
    }
  }

  mod pricing_720p {
    use super::*;

    #[test]
    fn without_video_reference() {
      assert_eq!(cents(RouterResolution::SevenTwentyP, 4, 1, false), 35);
      assert_eq!(cents(RouterResolution::SevenTwentyP, 5, 1, false), 44);
      assert_eq!(cents(RouterResolution::SevenTwentyP, 10, 1, false), 87);
      assert_eq!(cents(RouterResolution::SevenTwentyP, 15, 1, false), 130);
    }

    #[test]
    fn with_video_reference() {
      assert_eq!(cents(RouterResolution::SevenTwentyP, 4, 1, true), 42);
      assert_eq!(cents(RouterResolution::SevenTwentyP, 5, 1, true), 52);
      assert_eq!(cents(RouterResolution::SevenTwentyP, 10, 1, true), 104);
      assert_eq!(cents(RouterResolution::SevenTwentyP, 15, 1, true), 156);
    }

    #[test]
    fn none_defaults_to_720p() {
      assert_eq!(cents_no_ref(None, 5, 1), cents(RouterResolution::SevenTwentyP, 5, 1, false));
    }
  }

  mod credits_tests {
    use super::*;

    #[test]
    fn credits_equal_usd_cents_all_combos() {
      let resolutions = [
        Some(RouterResolution::FourEightyP),
        Some(RouterResolution::SevenTwentyP),
        None,
      ];
      for res in resolutions {
        for dur in [4u16, 5, 10, 15] {
          for batch in [1u16, 2, 4] {
            for has_ref in [false, true] {
              let cost = build_cost(res, dur, batch, has_ref);
              assert_eq!(cost.cost_in_credits, cost.cost_in_usd_cents);
            }
          }
        }
      }
    }
  }

  fn build_cost(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
    with_video_reference: bool,
  ) -> VideoGenerationCostEstimate {
    let reference_videos = with_video_reference.then(|| {
      VideoListRef::MediaFileTokens(vec![MediaFileToken::new("mf_ref".to_string())])
    });
    let builder = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance2p0Mini,
      provider: RouterProvider::Artcraft,
      resolution,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(video_batch_count),
      reference_videos,
      ..Default::default()
    };
    builder.build2()
      .expect("build2 should succeed")
      .estimate_cost()
      .expect("estimate_cost should succeed")
  }

  fn cents(
    resolution: RouterResolution,
    duration_seconds: u16,
    video_batch_count: u16,
    with_video_reference: bool,
  ) -> u64 {
    build_cost(Some(resolution), duration_seconds, video_batch_count, with_video_reference)
      .cost_in_usd_cents
      .unwrap()
  }

  fn cents_no_ref(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
  ) -> u64 {
    build_cost(resolution, duration_seconds, video_batch_count, false)
      .cost_in_usd_cents
      .unwrap()
  }
}

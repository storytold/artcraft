use enums::common::generation::common_resolution::CommonResolution;
use kinovi_web_client::generate::video::generate_seedance_2p5::MAX_BILLED_INPUT_SECONDS;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::seedance_common::seedance_2p5_usd_cents;
use crate::generate::generate_video::providers::artcraft::seedance_2p5::request::ArtcraftSeedance2p5RequestState;

/// Seedance 2.5 pricing depends on the resolution, the output duration, and
/// — when reference videos are attached — the total seconds of reference
/// video input, which are billed on top of the output duration (at a lower
/// per-second rate). Input seconds are clamped to
/// [`MAX_BILLED_INPUT_SECONDS`] — the model accepts at most 30 seconds of
/// video. No batching.
pub struct ArtcraftSeedance2p5CostState {
  pub resolution: CommonResolution,
  pub duration_seconds: u16,
  pub has_video_references: bool,
  pub total_input_seconds: u16,
}

impl ArtcraftSeedance2p5CostState {
  pub fn from_request(request: &ArtcraftSeedance2p5RequestState) -> Self {
    let resolution = request.request.resolution
      .unwrap_or(CommonResolution::SevenTwentyP);
    let duration_seconds = request.request.duration_seconds.unwrap_or(5);

    let has_video_references = request.request.reference_video_media_tokens
      .as_ref()
      .is_some_and(|tokens| !tokens.is_empty());

    Self {
      resolution,
      duration_seconds,
      has_video_references,
      total_input_seconds: request.total_input_seconds.unwrap_or(0),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let total_input_seconds = self.total_input_seconds
      .min(u16::from(MAX_BILLED_INPUT_SECONDS));

    let usd_cents = seedance_2p5_usd_cents(
      self.resolution,
      self.duration_seconds,
      self.has_video_references,
      total_input_seconds,
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

  mod pricing_without_video_references {
    use super::*;

    #[test]
    fn table_480p() {
      // 11.76954733 ¢/s, rounded up.
      assert_eq!(cents(Some(RouterResolution::FourEightyP), 4), 48);
      assert_eq!(cents(Some(RouterResolution::FourEightyP), 5), 59);
      assert_eq!(cents(Some(RouterResolution::FourEightyP), 10), 118);
      assert_eq!(cents(Some(RouterResolution::FourEightyP), 30), 354);
    }

    #[test]
    fn table_720p() {
      // 26.70781893 ¢/s, rounded up.
      assert_eq!(cents(Some(RouterResolution::SevenTwentyP), 4), 107);
      assert_eq!(cents(Some(RouterResolution::SevenTwentyP), 5), 134);
      assert_eq!(cents(Some(RouterResolution::SevenTwentyP), 10), 268);
      assert_eq!(cents(Some(RouterResolution::SevenTwentyP), 30), 802);
    }

    #[test]
    fn none_defaults_to_720p() {
      assert_eq!(cents(None, 10), cents(Some(RouterResolution::SevenTwentyP), 10));
    }
  }

  mod pricing_with_video_references {
    use super::*;

    #[test]
    fn thirty_second_output_with_ten_input_seconds_bills_forty() {
      // 7.24279835 ¢/s × 40 = 289.71 → 290¢.
      assert_eq!(cents_with_video_refs(Some(RouterResolution::FourEightyP), 30, Some(10)), 290);
      // 15.84362140 ¢/s × 40 = 633.74 → 634¢.
      assert_eq!(cents_with_video_refs(Some(RouterResolution::SevenTwentyP), 30, Some(10)), 634);
    }

    #[test]
    fn fourteen_input_seconds_bill_forty_four() {
      // 7.24279835 ¢/s × 44 = 318.68 → 319¢.
      assert_eq!(cents_with_video_refs(Some(RouterResolution::FourEightyP), 30, Some(14)), 319);
    }

    #[test]
    fn missing_input_seconds_bill_output_duration_only() {
      // 7.24279835 ¢/s × 10 = 72.43 → 73¢.
      assert_eq!(cents_with_video_refs(Some(RouterResolution::FourEightyP), 10, None), 73);
    }

    #[test]
    fn input_seconds_clamp_to_max_billed_input_seconds() {
      // 200 input seconds clamp to 30: 7.24279835 ¢/s × (30+30) = 434.57 → 435¢.
      assert_eq!(cents_with_video_refs(Some(RouterResolution::FourEightyP), 30, Some(200)), 435);
      assert_eq!(
        cents_with_video_refs(Some(RouterResolution::FourEightyP), 30, Some(200)),
        cents_with_video_refs(Some(RouterResolution::FourEightyP), 30, Some(30)),
      );
    }
  }

  mod credits_tests {
    use super::*;

    #[test]
    fn credits_equal_usd_cents() {
      for dur in [4u16, 10, 30] {
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
      model: RouterVideoModel::Seedance2p5,
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

  fn cents_with_video_refs(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    total_input_seconds: Option<u16>,
  ) -> u64 {
    estimate_with(|b| {
      b.resolution = resolution;
      b.duration_seconds = Some(duration_seconds);
      b.reference_videos = Some(VideoListRef::MediaFileTokens(vec![
        MediaFileToken::new("mf_ref".to_string()),
      ]));
      b.total_reference_video_input_seconds = total_input_seconds;
    }).cost_in_usd_cents.unwrap()
  }
}

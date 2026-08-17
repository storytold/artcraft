use enums::common::generation::common_resolution::CommonResolution;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::seedance_common::seedance_2p5_ultra_usd_cents;
use crate::generate::generate_video::providers::artcraft::seedance_2p5_u::request::ArtcraftSeedance2p5UltraRequestState;

/// Seedance 2.5 Ultra pricing depends on the resolution, the output
/// duration, and — when reference videos are attached — the total seconds of
/// reference video input, which are billed on top of the output duration (at
/// a lower per-second rate). Input seconds are clamped to
/// [`MAX_BILLED_INPUT_SECONDS`] — the model accepts at most 30 seconds of
/// video. No batching.
pub struct ArtcraftSeedance2p5UltraCostState {
  pub resolution: CommonResolution,
  pub duration_seconds: u16,
  pub has_video_references: bool,
  pub maybe_total_input_seconds: Option<u16>,
}

impl ArtcraftSeedance2p5UltraCostState {
  pub fn from_request(request: &ArtcraftSeedance2p5UltraRequestState) -> Self {
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
      maybe_total_input_seconds: request.total_input_seconds,
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Input-second clamping (the 4..=30 billing range) and the
    // unknown-or-zero-input failsafe happen inside the shared pricing
    // function.
    let maybe_total_input_seconds = self.maybe_total_input_seconds;

    let usd_cents = seedance_2p5_ultra_usd_cents(
      self.resolution,
      self.duration_seconds,
      self.has_video_references,
      maybe_total_input_seconds,
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
      // 13.90946502 ¢/s, rounded up.
      assert_eq!(cents(Some(RouterResolution::FourEightyP), 4), 56);
      assert_eq!(cents(Some(RouterResolution::FourEightyP), 5), 70);
      assert_eq!(cents(Some(RouterResolution::FourEightyP), 10), 140);
      assert_eq!(cents(Some(RouterResolution::FourEightyP), 30), 418);
    }

    #[test]
    fn table_720p() {
      // 31.56378601 ¢/s, rounded up.
      assert_eq!(cents(Some(RouterResolution::SevenTwentyP), 4), 127);
      assert_eq!(cents(Some(RouterResolution::SevenTwentyP), 5), 158);
      assert_eq!(cents(Some(RouterResolution::SevenTwentyP), 10), 316);
      assert_eq!(cents(Some(RouterResolution::SevenTwentyP), 30), 947);
    }

    #[test]
    fn table_1080p() {
      // 50.10486922 ¢/s, rounded up.
      assert_eq!(cents(Some(RouterResolution::TenEightyP), 4), 201);
      assert_eq!(cents(Some(RouterResolution::TenEightyP), 5), 251);
      assert_eq!(cents(Some(RouterResolution::TenEightyP), 10), 502);
      assert_eq!(cents(Some(RouterResolution::TenEightyP), 30), 1504);
    }

    #[test]
    fn four_k_downgrades_to_1080p_and_prices_accordingly() {
      assert_eq!(cents(Some(RouterResolution::FourK), 10), cents(Some(RouterResolution::TenEightyP), 10));
    }

    #[test]
    fn none_defaults_to_720p() {
      assert_eq!(cents(None, 10), cents(Some(RouterResolution::SevenTwentyP), 10));
    }

    #[test]
    fn ultra_prices_above_regular_seedance_2p5() {
      for (resolution, duration) in [
        (RouterResolution::FourEightyP, 5u16),
        (RouterResolution::FourEightyP, 30),
        (RouterResolution::SevenTwentyP, 5),
        (RouterResolution::SevenTwentyP, 30),
        (RouterResolution::TenEightyP, 5),
        (RouterResolution::TenEightyP, 30),
      ] {
        let ultra = cents(Some(resolution), duration);
        let regular = estimate_for_model(RouterVideoModel::Seedance2p5, |b| {
          b.resolution = Some(resolution);
          b.duration_seconds = Some(duration);
        }).cost_in_usd_cents.unwrap();
        assert!(ultra > regular, "{resolution:?} {duration}s: ultra {ultra} <= regular {regular}");
      }
    }
  }

  mod pricing_with_video_references {
    use super::*;

    #[test]
    fn thirty_second_output_with_ten_input_seconds_bills_forty() {
      // 8.55967078 ¢/s × 40 = 342.39 → 343¢.
      assert_eq!(cents_with_video_refs(Some(RouterResolution::FourEightyP), 30, Some(10)), 343);
      // 18.72427984 ¢/s × 40 = 748.97 → 749¢.
      assert_eq!(cents_with_video_refs(Some(RouterResolution::SevenTwentyP), 30, Some(10)), 749);
      // 29.93674947 ¢/s × 40 = 1197.47 → 1198¢.
      assert_eq!(cents_with_video_refs(Some(RouterResolution::TenEightyP), 30, Some(10)), 1198);
    }

    #[test]
    fn table_1080p_with_ten_input_seconds() {
      // 29.93674947 ¢/s over (output + 10) billed seconds, rounded up.
      assert_eq!(cents_with_video_refs(Some(RouterResolution::TenEightyP), 5, Some(10)), 450);
      assert_eq!(cents_with_video_refs(Some(RouterResolution::TenEightyP), 10, Some(10)), 599);
      assert_eq!(cents_with_video_refs(Some(RouterResolution::TenEightyP), 30, Some(10)), 1198);
    }

    #[test]
    fn fourteen_input_seconds_bill_forty_four() {
      // 8.55967078 ¢/s × 44 = 376.63 → 377¢.
      assert_eq!(cents_with_video_refs(Some(RouterResolution::FourEightyP), 30, Some(14)), 377);
    }

    #[test]
    fn missing_or_zero_input_seconds_bill_the_thirty_second_maximum() {
      // FAILSAFE: an unmeasured (or zero) input bills the 30-second MAXIMUM,
      // matching the provider client's fallback:
      // 8.55967078 ¢/s × (10+30) = 342.39 → 343¢.
      assert_eq!(cents_with_video_refs(Some(RouterResolution::FourEightyP), 10, None), 343);
      assert_eq!(cents_with_video_refs(Some(RouterResolution::FourEightyP), 10, Some(0)), 343);
    }

    #[test]
    fn input_totals_under_four_seconds_clamp_to_four() {
      let at_minimum = cents_with_video_refs(Some(RouterResolution::FourEightyP), 10, Some(4));
      assert_eq!(cents_with_video_refs(Some(RouterResolution::FourEightyP), 10, Some(1)), at_minimum);
      assert_eq!(cents_with_video_refs(Some(RouterResolution::FourEightyP), 10, Some(3)), at_minimum);
      assert!(cents_with_video_refs(Some(RouterResolution::FourEightyP), 10, Some(5)) > at_minimum);
    }

    #[test]
    fn input_seconds_clamp_to_max_billed_input_seconds() {
      // 200 input seconds clamp to 30: 8.55967078 ¢/s × (30+30) = 513.58 → 514¢.
      assert_eq!(cents_with_video_refs(Some(RouterResolution::FourEightyP), 30, Some(200)), 514);
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
    estimate_for_model(RouterVideoModel::Seedance2p5Ultra, f)
  }

  fn estimate_for_model(
    model: RouterVideoModel,
    f: impl FnOnce(&mut GenerateVideoRequestBuilder),
  ) -> VideoGenerationCostEstimate {
    let mut builder = GenerateVideoRequestBuilder {
      model,
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

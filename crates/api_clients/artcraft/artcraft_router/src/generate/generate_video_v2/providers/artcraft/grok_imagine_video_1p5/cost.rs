use enums::common::generation::common_resolution::CommonResolution;

use grok_api_client::api::requests::videos::video_generation::video_generation::{
  VideoGenerationRequest as GrokVideoGenerationRequest,
  VideoImageSource as GrokVideoImageSource,
};
use grok_api_client::api::traits::grok_request_cost_calculator_trait::GrokRequestCostCalculator;
use grok_api_client::api::types::video_types::video_model::VideoModel as GrokVideoModel;
use grok_api_client::api::types::video_types::video_resolution::VideoResolution as GrokResolution;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::grok_imagine_video_1p5::request::ArtcraftGrokImagineVideo1p5RequestState;

// ── Markup ──
//
// ArtCraft adds a modest 5% markup over the underlying xAI v1.5 pricing. The
// markup is applied at cent granularity with ceiling rounding so the final
// charge always covers the upstream cost (we never bill the user less than
// the cost of the API call we forwarded).
const MARKUP_NUMERATOR: u64 = 105;
const MARKUP_DENOMINATOR: u64 = 100;

pub struct ArtcraftGrokImagineVideo1p5CostState {
  pub resolution: CommonResolution,
  pub duration_seconds: u16,
  pub batch_count: u16,
  pub input_image_count: u64,
}

impl ArtcraftGrokImagineVideo1p5CostState {
  pub fn from_request(request: &ArtcraftGrokImagineVideo1p5RequestState) -> Self {
    let resolution = request.request.resolution.unwrap_or(CommonResolution::SevenTwentyP);
    let duration_seconds = request.request.duration_seconds.unwrap_or(8);
    let batch_count = request.request.video_batch_count.unwrap_or(1);

    // Mirror grok_api_client's input-image counting: start_frame + reference_images.
    let input_image_count = (request.request.start_frame_image_media_token.is_some() as u64)
      + (request.request.reference_image_media_tokens
        .as_ref()
        .map(|v| v.len() as u64)
        .unwrap_or(0));

    Self { resolution, duration_seconds, batch_count, input_image_count }
  }

  /// Base cost in cents for a single video at this state's resolution,
  /// duration, and input-image count. Computed via grok_api_client's
  /// official cost calculator (with the model pinned to the v1.5 preview),
  /// so this number tracks upstream pricing automatically and never drifts
  /// from what xAI bills.
  ///
  /// Does NOT include the per-batch multiplier and does NOT include the
  /// ArtCraft markup. Used by tests to assert parity with grok_api_client.
  pub fn base_cost_in_cents_for_one_video(&self) -> u64 {
    self.build_equivalent_grok_request().calculate_cost_in_cents()
  }

  /// Total base cost (across the batch) in cents, before markup.
  /// Each video in the batch costs [`Self::base_cost_in_cents_for_one_video`].
  pub fn base_cost_in_cents_for_batch(&self) -> u64 {
    self.base_cost_in_cents_for_one_video()
      .saturating_mul(self.batch_count as u64)
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let base = self.base_cost_in_cents_for_batch();
    // 5% markup, ceil so the user is always charged enough to cover the
    // upstream grok cost regardless of rounding.
    let usd_cents = base.saturating_mul(MARKUP_NUMERATOR).div_ceil(MARKUP_DENOMINATOR);

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

  /// Build a `GrokVideoGenerationRequest` whose pricing-relevant fields
  /// exactly mirror this cost state, so the grok_api_client calculator
  /// produces the same number ArtCraft would owe for one video. Non-pricing
  /// fields (prompt, aspect_ratio, user) are left empty — they don't affect
  /// cost.
  fn build_equivalent_grok_request(&self) -> GrokVideoGenerationRequest {
    let resolution = Some(match self.resolution {
      CommonResolution::FourEightyP => GrokResolution::FourEightyP,
      // Grok Imagine caps at 720p (and our build step downgrades higher
      // tiers via SupportedResolutions::Fast); price anything else as 720p.
      _ => GrokResolution::SevenTwentyP,
    });

    // Grok's calculator only counts the TOTAL number of input images — it
    // doesn't care how they're split between `image` and `reference_images`
    // — so we put one in `image` (if any) and the rest in `reference_images`.
    let image = (self.input_image_count >= 1)
      .then(|| GrokVideoImageSource::Url(String::new()));
    let reference_images = if self.input_image_count >= 2 {
      Some(
        (1..self.input_image_count)
          .map(|_| GrokVideoImageSource::Url(String::new()))
          .collect()
      )
    } else { None };

    GrokVideoGenerationRequest {
      prompt: String::new(),
      model: Some(GrokVideoModel::GrokImagineVideo1p5Preview),
      image,
      reference_images,
      aspect_ratio: None,
      duration: Some(self.duration_seconds as u32),
      resolution,
      user: None,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

  // ── Base cost parity with grok_api_client ─────────────────────────────
  //
  // The base cost (before ArtCraft markup, batch=1) must equal exactly what
  // grok_api_client's calculator returns for an equivalent direct-Grok
  // request. This protects against the artcraft and grok-api implementations
  // silently drifting apart.

  mod grok_api_parity {
    use super::*;

    // (resolution, duration, image_count)
    //
    // Durations are confined to [4, 15] because the ArtCraft pipeline clamps
    // outside that range (see `plan_duration` in artcraft/build_common.rs).
    const PARITY_CASES: &[(Option<RouterResolution>, u16, u64)] = &[
      // 480p variations
      (Some(RouterResolution::FourEightyP),  4, 0),
      (Some(RouterResolution::FourEightyP),  5, 0),
      (Some(RouterResolution::FourEightyP),  8, 0),
      (Some(RouterResolution::FourEightyP), 15, 0),
      (Some(RouterResolution::FourEightyP),  5, 1),
      (Some(RouterResolution::FourEightyP),  5, 3),
      // 720p variations
      (Some(RouterResolution::SevenTwentyP),  4, 0),
      (Some(RouterResolution::SevenTwentyP),  5, 0),
      (Some(RouterResolution::SevenTwentyP),  8, 0),
      (Some(RouterResolution::SevenTwentyP), 15, 0),
      (Some(RouterResolution::SevenTwentyP),  5, 1),
      (Some(RouterResolution::SevenTwentyP),  5, 3),
      // None defaults to 720p in our `from_request`, which matches the
      // assumption Grok's calculator makes when fed a 720p request.
      (None,                                  5, 0),
      (None,                                  5, 2),
    ];

    #[test]
    fn base_cost_for_one_video_matches_grok_api_client() {
      for &(router_res, duration, image_count) in PARITY_CASES {
        let artcraft = artcraft_state(router_res, duration, image_count, 1);
        let grok_cents = grok_cents(router_res, duration, image_count);

        assert_eq!(
          artcraft.base_cost_in_cents_for_one_video(),
          grok_cents,
          "parity mismatch at res={router_res:?} dur={duration} images={image_count}: \
           artcraft_base={} grok={}",
          artcraft.base_cost_in_cents_for_one_video(),
          grok_cents,
        );
      }
    }

    #[test]
    fn batch_one_base_total_equals_one_video_base() {
      let s = artcraft_state(Some(RouterResolution::SevenTwentyP), 5, 1, 1);
      assert_eq!(s.base_cost_in_cents_for_batch(), s.base_cost_in_cents_for_one_video());
    }

    #[test]
    fn batch_scales_base_linearly() {
      // The ArtCraft pipeline only accepts batch counts of 1, 2, or 4 (see
      // `plan_batch_count` in artcraft/build_common.rs); anything else gets
      // clamped, so we can only meaningfully test those values.
      let per_one = artcraft_state(Some(RouterResolution::SevenTwentyP), 5, 1, 1)
        .base_cost_in_cents_for_one_video();
      for batch in [1u16, 2, 4] {
        let s = artcraft_state(Some(RouterResolution::SevenTwentyP), 5, 1, batch);
        assert_eq!(
          s.base_cost_in_cents_for_batch(),
          per_one * batch as u64,
          "batch={batch}",
        );
      }
    }

    /// Builder-driven parity — exercises the full pipeline (build2 →
    /// estimate_cost) on both providers and compares ArtCraft's base cost
    /// (final / 1.05, accounting for ceiling) against GrokApi's direct
    /// cost.
    ///
    /// We verify the markup rather than the base here because the public
    /// `estimate_cost()` returns the marked-up number; the explicit
    /// `base_cost_in_cents_*` API is tested above.
    #[test]
    fn end_to_end_markup_is_at_least_five_percent_over_grok() {
      let cases: &[(Option<RouterResolution>, u16, bool, usize)] = &[
        (Some(RouterResolution::FourEightyP),  5, false, 0),
        (Some(RouterResolution::FourEightyP), 10, true,  0),
        (Some(RouterResolution::SevenTwentyP), 5, false, 0),
        (Some(RouterResolution::SevenTwentyP), 5, false, 3),
        (Some(RouterResolution::SevenTwentyP), 8, true,  0),
        (Some(RouterResolution::SevenTwentyP),15, false, 0),
      ];
      for &(res, duration, has_start, refs) in cases {
        let artcraft_cents = artcraft_end_to_end_cents(res, duration, 1, has_start, refs);
        let grok_cents = grok_cents(res, duration, has_start as u64 + refs as u64);
        let want_minimum = grok_cents.saturating_mul(MARKUP_NUMERATOR).div_ceil(MARKUP_DENOMINATOR);
        assert_eq!(
          artcraft_cents, want_minimum,
          "res={res:?} dur={duration} start={has_start} refs={refs}: \
           artcraft={artcraft_cents}¢ vs ceil(grok({grok_cents})×1.05)={want_minimum}¢",
        );
      }
    }
  }

  // ── Markup correctness ─────────────────────────────────────────────────

  mod markup {
    use super::*;

    #[test]
    fn estimate_cost_equals_ceil_of_base_times_1p05() {
      for &(res, dur, imgs, batch) in MARKUP_CASES {
        let state = artcraft_state(res, dur, imgs, batch);
        let base = state.base_cost_in_cents_for_batch();
        let want = base.saturating_mul(MARKUP_NUMERATOR).div_ceil(MARKUP_DENOMINATOR);
        let got = state.estimate_cost().cost_in_usd_cents.unwrap();
        assert_eq!(
          got, want,
          "res={res:?} dur={dur} imgs={imgs} batch={batch} base={base}",
        );
      }
    }

    #[test]
    fn final_cost_is_always_at_least_base() {
      for &(res, dur, imgs, batch) in MARKUP_CASES {
        let state = artcraft_state(res, dur, imgs, batch);
        let base = state.base_cost_in_cents_for_batch();
        let final_ = state.estimate_cost().cost_in_usd_cents.unwrap();
        assert!(
          final_ >= base,
          "final {final_}¢ < base {base}¢ at res={res:?} dur={dur} imgs={imgs} batch={batch}",
        );
      }
    }

    #[test]
    fn known_value_at_720p_5s_batch_1() {
      // grok v1.5 720p × 5s = 700 mills = 70¢
      // 70 × 1.05 = 73.5 → ceil = 74¢
      let state = artcraft_state(Some(RouterResolution::SevenTwentyP), 5, 0, 1);
      assert_eq!(state.base_cost_in_cents_for_one_video(), 70);
      assert_eq!(state.estimate_cost().cost_in_usd_cents.unwrap(), 74);
    }

    #[test]
    fn known_value_at_480p_5s_batch_1() {
      // grok v1.5 480p × 5s = 400 mills = 40¢
      // 40 × 1.05 = 42 → ceil = 42¢
      let state = artcraft_state(Some(RouterResolution::FourEightyP), 5, 0, 1);
      assert_eq!(state.base_cost_in_cents_for_one_video(), 40);
      assert_eq!(state.estimate_cost().cost_in_usd_cents.unwrap(), 42);
    }

    #[test]
    fn known_value_at_720p_5s_batch_2() {
      // base for batch 2 = 70 × 2 = 140¢
      // 140 × 1.05 = 147 → ceil 147¢
      let state = artcraft_state(Some(RouterResolution::SevenTwentyP), 5, 0, 2);
      assert_eq!(state.base_cost_in_cents_for_batch(), 140);
      assert_eq!(state.estimate_cost().cost_in_usd_cents.unwrap(), 147);
    }

    // (resolution, duration, image_count, batch)
    const MARKUP_CASES: &[(Option<RouterResolution>, u16, u64, u16)] = &[
      (Some(RouterResolution::FourEightyP),   5, 0, 1),
      (Some(RouterResolution::FourEightyP),   5, 0, 2),
      (Some(RouterResolution::FourEightyP),   5, 0, 4),
      (Some(RouterResolution::FourEightyP),   8, 0, 1),
      (Some(RouterResolution::FourEightyP),  15, 0, 1),
      (Some(RouterResolution::FourEightyP),   5, 1, 1),
      (Some(RouterResolution::FourEightyP),   5, 3, 1),
      (Some(RouterResolution::SevenTwentyP),  5, 0, 1),
      (Some(RouterResolution::SevenTwentyP),  5, 0, 2),
      (Some(RouterResolution::SevenTwentyP),  5, 0, 4),
      (Some(RouterResolution::SevenTwentyP),  8, 0, 1),
      (Some(RouterResolution::SevenTwentyP), 15, 0, 1),
      (Some(RouterResolution::SevenTwentyP),  5, 1, 1),
      (Some(RouterResolution::SevenTwentyP),  5, 3, 1),
      (None,                                  5, 0, 1),
    ];
  }

  // ── Relative pricing / monotonicity sanity ─────────────────────────────

  mod monotonicity {
    use super::*;

    #[test]
    fn higher_resolution_costs_more() {
      let p480 = artcraft_state(Some(RouterResolution::FourEightyP), 5, 0, 1)
        .estimate_cost().cost_in_usd_cents.unwrap();
      let p720 = artcraft_state(Some(RouterResolution::SevenTwentyP), 5, 0, 1)
        .estimate_cost().cost_in_usd_cents.unwrap();
      assert!(p480 < p720, "480p ({p480}¢) should be < 720p ({p720}¢)");
    }

    #[test]
    fn longer_duration_costs_more() {
      let c5  = artcraft_state(Some(RouterResolution::SevenTwentyP),  5, 0, 1)
        .estimate_cost().cost_in_usd_cents.unwrap();
      let c10 = artcraft_state(Some(RouterResolution::SevenTwentyP), 10, 0, 1)
        .estimate_cost().cost_in_usd_cents.unwrap();
      let c15 = artcraft_state(Some(RouterResolution::SevenTwentyP), 15, 0, 1)
        .estimate_cost().cost_in_usd_cents.unwrap();
      assert!(c5 < c10);
      assert!(c10 < c15);
    }

    #[test]
    fn more_images_cost_more_or_equal() {
      // Each image is +10 mills = +1¢ before markup, so 1+ image always
      // strictly increases final cost (the markup ceil pushes us up enough).
      let zero = artcraft_state(Some(RouterResolution::SevenTwentyP), 5, 0, 1)
        .estimate_cost().cost_in_usd_cents.unwrap();
      let three = artcraft_state(Some(RouterResolution::SevenTwentyP), 5, 3, 1)
        .estimate_cost().cost_in_usd_cents.unwrap();
      assert!(zero < three, "zero={zero}¢ vs three={three}¢");
    }

    #[test]
    fn more_batch_costs_more() {
      let b1 = artcraft_state(Some(RouterResolution::SevenTwentyP), 5, 0, 1)
        .estimate_cost().cost_in_usd_cents.unwrap();
      let b4 = artcraft_state(Some(RouterResolution::SevenTwentyP), 5, 0, 4)
        .estimate_cost().cost_in_usd_cents.unwrap();
      assert!(b1 < b4);
    }
  }

  // ── End-to-end through the public builder API ──────────────────────────

  mod end_to_end {
    use super::*;

    #[test]
    fn credits_equal_usd_cents() {
      // ArtCraft credits == USD cents, as in the v1 module.
      let resolutions = [
        None,
        Some(RouterResolution::FourEightyP),
        Some(RouterResolution::SevenTwentyP),
        Some(RouterResolution::TenEightyP), // clamps to 720p
      ];
      for res in resolutions {
        for dur in [4u16, 5, 10, 15] {
          for batch in [1u16, 2, 4] {
            let cost = build_cost_via_builder(res, dur, batch);
            assert_eq!(
              cost.cost_in_credits, cost.cost_in_usd_cents,
              "credits should equal cents at res={res:?} dur={dur}s batch={batch}",
            );
          }
        }
      }
    }

    #[test]
    fn ten_eighty_p_request_clamps_to_720p_pricing() {
      let p1080 = build_cost_via_builder(Some(RouterResolution::TenEightyP), 10, 1)
        .cost_in_usd_cents.unwrap();
      let p720 = build_cost_via_builder(Some(RouterResolution::SevenTwentyP), 10, 1)
        .cost_in_usd_cents.unwrap();
      assert_eq!(p1080, p720);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  fn artcraft_state(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    input_image_count: u64,
    batch_count: u16,
  ) -> ArtcraftGrokImagineVideo1p5CostState {
    // Build a state directly from a synthesized request — avoids the full
    // build2() pipeline so we can construct arbitrary image counts without
    // worrying about builder validation rules.
    let state = unwrap_request_via_builder(resolution, duration_seconds, input_image_count, batch_count);
    ArtcraftGrokImagineVideo1p5CostState::from_request(&state)
  }

  fn unwrap_request_via_builder(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    input_image_count: u64,
    batch_count: u16,
  ) -> ArtcraftGrokImagineVideo1p5RequestState {
    // Split input_image_count into start_frame (1 if any) + reference_images (the rest),
    // mirroring how `from_request` counts source images.
    let start_frame = if input_image_count >= 1 {
      Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_start".to_string())))
    } else { None };
    let reference_images = if input_image_count >= 2 {
      Some(ImageListRef::MediaFileTokens(
        (1..input_image_count).map(|i| MediaFileToken::new(format!("mf_ref_{i}"))).collect(),
      ))
    } else { None };

    let builder = GenerateVideoRequestBuilder {
      model: RouterVideoModel::GrokImagineVideo1p5,
      provider: RouterProvider::Artcraft,
      resolution,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(batch_count),
      start_frame,
      reference_images,
      ..Default::default()
    };
    let result = builder.build2().expect("build2 should succeed");
    match result {
      crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest::Request(
        crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest::ArtcraftGrokImagineVideo1p5(s)
      ) => s,
      _ => panic!("expected ArtcraftGrokImagineVideo1p5 request"),
    }
  }

  fn artcraft_end_to_end_cents(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    batch_count: u16,
    has_start_frame: bool,
    num_reference_images: usize,
  ) -> u64 {
    let start_frame = if has_start_frame {
      Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_start".to_string())))
    } else { None };
    let reference_images = if num_reference_images > 0 {
      Some(ImageListRef::MediaFileTokens(
        (0..num_reference_images)
          .map(|i| MediaFileToken::new(format!("mf_ref_{i}")))
          .collect(),
      ))
    } else { None };

    let builder = GenerateVideoRequestBuilder {
      model: RouterVideoModel::GrokImagineVideo1p5,
      provider: RouterProvider::Artcraft,
      resolution,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(batch_count),
      start_frame,
      reference_images,
      ..Default::default()
    };
    builder.build2()
      .expect("build2 should succeed")
      .estimate_cost()
      .expect("estimate_cost should succeed")
      .cost_in_usd_cents
      .unwrap()
  }

  fn build_cost_via_builder(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
  ) -> VideoGenerationCostEstimate {
    let builder = GenerateVideoRequestBuilder {
      model: RouterVideoModel::GrokImagineVideo1p5,
      provider: RouterProvider::Artcraft,
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

  /// Reference value: what GrokApi's own pipeline would charge for one
  /// equivalent video. Used by parity tests.
  ///
  /// The Grok build step prefers `start_frame` over `reference_images` when
  /// both are supplied and drops the latter (see grok_api/grok_imagine_video_1p5/build.rs).
  /// To keep parity with the ArtCraft input-image *count*, we put all source
  /// images in `reference_images` only — the cost calculator counts the total
  /// either way.
  fn grok_cents(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    image_count: u64,
  ) -> u64 {
    let reference_images = if image_count >= 1 {
      Some(ImageListRef::Urls(
        (0..image_count).map(|i| format!("https://example.com/ref_{i}.png")).collect(),
      ))
    } else { None };

    let builder = GenerateVideoRequestBuilder {
      model: RouterVideoModel::GrokImagineVideo1p5,
      provider: RouterProvider::GrokApi,
      resolution,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(1),
      start_frame: None,
      reference_images,
      ..Default::default()
    };
    builder.build2()
      .expect("build2 (grokapi) should succeed")
      .estimate_cost()
      .expect("estimate_cost (grokapi) should succeed")
      .cost_in_usd_cents
      .unwrap()
  }
}

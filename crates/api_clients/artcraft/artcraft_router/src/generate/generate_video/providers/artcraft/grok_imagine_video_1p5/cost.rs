use enums::common::generation::common_resolution::CommonResolution;

use grok_api_client::api::requests::videos::video_generation::video_generation::{
  VideoGenerationRequest as GrokVideoGenerationRequest,
  VideoImageSource as GrokVideoImageSource,
};
use grok_api_client::api::traits::grok_request_cost_calculator_trait::GrokRequestCostCalculator;
use grok_api_client::api::types::video_types::video_model::VideoModel as GrokVideoModel;
use grok_api_client::api::types::video_types::video_resolution::VideoResolution as GrokResolution;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::grok_imagine_video_1p5::request::ArtcraftGrokImagineVideo1p5RequestState;

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

  pub fn estimate_cost(&self) -> Result<VideoGenerationCostEstimate, ArtcraftRouterError> {
    // Defense in depth: `build()` already enforces this, but a state
    // constructed by hand must not get a quote for an operation xAI will
    // reject.
    if self.input_image_count == 0 {
      return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "image_inputs",
        value: "text-to-video isn't supported by grok-imagine-video-1.5-preview; supply a start_frame or at least one reference image".to_string(),
      }));
    }

    let base = self.base_cost_in_cents_for_batch();
    // 5% markup, ceil so the user is always charged enough to cover the
    // upstream grok cost regardless of rounding.
    let usd_cents = base.saturating_mul(MARKUP_NUMERATOR).div_ceil(MARKUP_DENOMINATOR);

    Ok(VideoGenerationCostEstimate {
      cost_in_credits: Some(usd_cents),
      cost_in_usd_cents: Some(usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
      failures_are_refunded: None,
    })
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

  // ── Markup correctness ─────────────────────────────────────────────────

  mod markup {
    use super::*;

    #[test]
    fn estimate_cost_equals_ceil_of_base_times_1p05() {
      for &(res, dur, imgs, batch) in MARKUP_CASES {
        let state = artcraft_state(res, dur, imgs, batch);
        let base = state.base_cost_in_cents_for_batch();
        let want = base.saturating_mul(MARKUP_NUMERATOR).div_ceil(MARKUP_DENOMINATOR);
        let got = state.estimate_cost().expect("estimate_cost").cost_in_usd_cents.unwrap();
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
        let final_ = state.estimate_cost().expect("estimate_cost").cost_in_usd_cents.unwrap();
        assert!(
          final_ >= base,
          "final {final_}¢ < base {base}¢ at res={res:?} dur={dur} imgs={imgs} batch={batch}",
        );
      }
    }

    #[test]
    fn known_value_at_720p_5s_batch_1() {
      // grok v1.5 720p × 5s + 1 image = 700 + 10 = 710 mills = 71¢
      // 71 × 1.05 = 74.55 → ceil = 75¢
      let state = artcraft_state(Some(RouterResolution::SevenTwentyP), 5, 1, 1);
      assert_eq!(state.base_cost_in_cents_for_one_video(), 71);
      assert_eq!(state.estimate_cost().expect("estimate_cost").cost_in_usd_cents.unwrap(), 75);
    }

    #[test]
    fn known_value_at_480p_5s_batch_1() {
      // grok v1.5 480p × 5s + 1 image = 400 + 10 = 410 mills = 41¢
      // 41 × 1.05 = 43.05 → ceil = 44¢
      let state = artcraft_state(Some(RouterResolution::FourEightyP), 5, 1, 1);
      assert_eq!(state.base_cost_in_cents_for_one_video(), 41);
      assert_eq!(state.estimate_cost().expect("estimate_cost").cost_in_usd_cents.unwrap(), 44);
    }

    #[test]
    fn known_value_at_720p_5s_batch_2() {
      // base per video at 720p 5s + 1 image = 71¢. Batch 2 = 142¢.
      // 142 × 1.05 = 149.1 → ceil 150¢.
      let state = artcraft_state(Some(RouterResolution::SevenTwentyP), 5, 1, 2);
      assert_eq!(state.base_cost_in_cents_for_batch(), 142);
      assert_eq!(state.estimate_cost().expect("estimate_cost").cost_in_usd_cents.unwrap(), 150);
    }

    /// v1.5 doesn't support text-to-video. The cost calculator must refuse
    /// to quote an image-less request even if a state is constructed
    /// directly.
    #[test]
    fn estimate_cost_rejects_text_only_request() {
      let state = ArtcraftGrokImagineVideo1p5CostState {
        resolution: CommonResolution::SevenTwentyP,
        duration_seconds: 5,
        batch_count: 1,
        input_image_count: 0,
      };
      let err = state.estimate_cost().expect_err("text-only should be rejected");
      match err {
        ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { field, .. }) => {
          assert_eq!(field, "image_inputs");
        }
        other => panic!("expected Client(ModelDoesNotSupportOption), got {:?}", other),
      }
    }

    // (resolution, duration, image_count, batch) — every case has at least
    // one image since v1.5 rejects text-to-video.
    const MARKUP_CASES: &[(Option<RouterResolution>, u16, u64, u16)] = &[
      (Some(RouterResolution::FourEightyP),   5, 1, 1),
      (Some(RouterResolution::FourEightyP),   5, 1, 2),
      (Some(RouterResolution::FourEightyP),   5, 1, 4),
      (Some(RouterResolution::FourEightyP),   8, 1, 1),
      (Some(RouterResolution::FourEightyP),  15, 1, 1),
      (Some(RouterResolution::FourEightyP),   5, 3, 1),
      (Some(RouterResolution::SevenTwentyP),  5, 1, 1),
      (Some(RouterResolution::SevenTwentyP),  5, 1, 2),
      (Some(RouterResolution::SevenTwentyP),  5, 1, 4),
      (Some(RouterResolution::SevenTwentyP),  8, 1, 1),
      (Some(RouterResolution::SevenTwentyP), 15, 1, 1),
      (Some(RouterResolution::SevenTwentyP),  5, 3, 1),
      (None,                                  5, 1, 1),
    ];
  }

  // ── Relative pricing / monotonicity sanity ─────────────────────────────

  mod monotonicity {
    use super::*;

    #[test]
    fn higher_resolution_costs_more() {
      let p480 = artcraft_state(Some(RouterResolution::FourEightyP), 5, 1, 1)
        .estimate_cost().expect("estimate_cost").cost_in_usd_cents.unwrap();
      let p720 = artcraft_state(Some(RouterResolution::SevenTwentyP), 5, 1, 1)
        .estimate_cost().expect("estimate_cost").cost_in_usd_cents.unwrap();
      assert!(p480 < p720, "480p ({p480}¢) should be < 720p ({p720}¢)");
    }

    #[test]
    fn longer_duration_costs_more() {
      let c5  = artcraft_state(Some(RouterResolution::SevenTwentyP),  5, 1, 1)
        .estimate_cost().expect("estimate_cost").cost_in_usd_cents.unwrap();
      let c10 = artcraft_state(Some(RouterResolution::SevenTwentyP), 10, 1, 1)
        .estimate_cost().expect("estimate_cost").cost_in_usd_cents.unwrap();
      let c15 = artcraft_state(Some(RouterResolution::SevenTwentyP), 15, 1, 1)
        .estimate_cost().expect("estimate_cost").cost_in_usd_cents.unwrap();
      assert!(c5 < c10);
      assert!(c10 < c15);
    }

    #[test]
    fn more_images_cost_more_or_equal() {
      // Each image is +10 mills = +1¢ before markup, so additional images
      // monotonically increase cost.
      let one = artcraft_state(Some(RouterResolution::SevenTwentyP), 5, 1, 1)
        .estimate_cost().expect("estimate_cost").cost_in_usd_cents.unwrap();
      let three = artcraft_state(Some(RouterResolution::SevenTwentyP), 5, 3, 1)
        .estimate_cost().expect("estimate_cost").cost_in_usd_cents.unwrap();
      assert!(one < three, "one={one}¢ vs three={three}¢");
    }

    #[test]
    fn more_batch_costs_more() {
      let b1 = artcraft_state(Some(RouterResolution::SevenTwentyP), 5, 1, 1)
        .estimate_cost().expect("estimate_cost").cost_in_usd_cents.unwrap();
      let b4 = artcraft_state(Some(RouterResolution::SevenTwentyP), 5, 1, 4)
        .estimate_cost().expect("estimate_cost").cost_in_usd_cents.unwrap();
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
      crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest::Request(
        crate::generate::generate_video::video_generation_request::VideoGenerationRequest::ArtcraftGrokImagineVideo1p5(s)
      ) => s,
      _ => panic!("expected ArtcraftGrokImagineVideo1p5 request"),
    }
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
      // v1.5 requires an input image — the no-image guard in build()
      // rejects T2V.
      start_frame: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_default".to_string()))),
      ..Default::default()
    };
    builder.build2()
      .expect("build2 should succeed")
      .estimate_cost()
      .expect("estimate_cost should succeed")
  }

}

use grok_api_client::api::traits::grok_request_cost_calculator_trait::GrokRequestCostCalculator;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::grok_api::grok_imagine_video_1p5::request::GrokApiGrokImagineVideo1p5RequestState;

pub struct GrokApiGrokImagineVideo1p5CostState {
  request: GrokApiGrokImagineVideo1p5RequestState,
}

impl GrokApiGrokImagineVideo1p5CostState {
  pub fn from_request(request: &GrokApiGrokImagineVideo1p5RequestState) -> Self {
    Self { request: request.clone() }
  }

  pub fn estimate_cost(&self) -> Result<VideoGenerationCostEstimate, ArtcraftRouterError> {
    // Defense in depth: `build()` already enforces this, but a request state
    // constructed by hand must not get a cost quote for an operation the
    // model will reject.
    if self.request.request.image.is_none() && self.request.request.reference_images.is_none() {
      return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "image_inputs",
        value: "text-to-video isn't supported by grok-imagine-video-1.5-preview; supply a start_frame or at least one reference image".to_string(),
      }));
    }

    // grok_api_client's calculator picks the v1.5 pricing tier from the
    // request's `model` field (see VideoModel::pricing_tier). The build step
    // sets `model = Some(GrokImagineVideo1p5Preview)`, so this returns the
    // v1.5 rates:
    //   Output: 80 mills/s @ 480p, 140 mills/s @ 720p
    //   Input:  10 mills per source image
    let cost_in_usd_cents = self.request.request.calculate_cost_in_cents();

    Ok(VideoGenerationCostEstimate {
      cost_in_credits: None,
      cost_in_usd_cents: Some(cost_in_usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
      failures_are_refunded: None,
    })
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_aspect_ratio::RouterAspectRatio;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  // v1.5 pricing reference (from grok_api_client/video_generation/cost.rs):
  //   Output: 480p 80 mills/s ($0.08/s), 720p 140 mills/s ($0.14/s)
  //   Input:  10 mills per source image ($0.01/img)
  //
  // Cost in cents = ceil(mills / 10).

  // ── 720p pricing ──

  mod pricing_720p {
    use super::*;

    // Note: build_for() injects a default start_frame when no image source
    // is given (v1.5 requires an image), so every "no explicit image" case
    // here actually includes 1 image worth of input surcharge (+10 mills = +1¢).

    #[test]
    fn five_s_with_default_image() {
      // 140 × 5 + 10 = 710 mills → 71¢
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, None, None), 71);
    }

    #[test]
    fn ten_s_with_default_image() {
      // 140 × 10 + 10 = 1410 mills → 141¢
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 10, None, None), 141);
    }

    #[test]
    fn fifteen_s_with_default_image() {
      // 140 × 15 + 10 = 2110 mills → 211¢
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 15, None, None), 211);
    }
  }

  // ── 480p pricing ──

  mod pricing_480p {
    use super::*;

    #[test]
    fn five_s_with_default_image() {
      // 80 × 5 + 10 = 410 mills → 41¢
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, None, None), 41);
    }

    #[test]
    fn ten_s_with_default_image() {
      // 80 × 10 + 10 = 810 mills → 81¢
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 10, None, None), 81);
    }

    #[test]
    fn fifteen_s_with_default_image() {
      // 80 × 15 + 10 = 1210 mills → 121¢
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 15, None, None), 121);
    }
  }

  // ── Image input pricing (10 mills/image, NOT 2 mills as in v1) ──

  mod image_inputs_add_to_cost {
    use super::*;

    #[test]
    fn single_start_frame_image_adds_10_mills() {
      // 5s @ 720p output 700 mills + 1 input image 10 mills = 710 mills → 71¢
      let cents = cost_cents(
        Some(RouterResolution::SevenTwentyP),
        5,
        Some(ImageRef::Url("https://example.com/a.png".to_string())),
        None,
      );
      assert_eq!(cents, 71);
    }

    #[test]
    fn three_reference_images_collapse_to_one_image() {
      // v1.5 rejects reference_images, so the build step promotes the first
      // reference to `image` and drops the rest (see promote_first_reference_to_image
      // in build.rs). Effective input image count = 1 regardless of how
      // many were submitted as references.
      //
      // 5s @ 720p output 700 mills + 1 effective input image 10 mills = 710 mills → 71¢
      let cents = cost_cents(
        Some(RouterResolution::SevenTwentyP),
        5,
        None,
        Some(ImageListRef::Urls(vec![
          "https://example.com/a.png".to_string(),
          "https://example.com/b.png".to_string(),
          "https://example.com/c.png".to_string(),
        ])),
      );
      assert_eq!(cents, 71);
    }

    #[test]
    fn reference_image_count_does_not_scale_cost() {
      // Promote-first collapses any number of reference_images down to one
      // `image` on the wire, so the cost stays flat at the 1-image surcharge.
      let baseline = cost_cents(
        Some(RouterResolution::SevenTwentyP),
        5,
        None,
        Some(ImageListRef::Urls(vec!["https://example.com/0.png".to_string()])),
      );
      for n in 1u64..=5 {
        let images: Vec<String> = (0..n)
          .map(|i| format!("https://example.com/{i}.png"))
          .collect();
        let cents = cost_cents(
          Some(RouterResolution::SevenTwentyP),
          5,
          None,
          Some(ImageListRef::Urls(images)),
        );
        assert_eq!(cents, baseline, "n={n} should still cost the same after promote-first");
      }
    }
  }

  // ── Relative pricing sanity ──

  mod relative_pricing {
    use super::*;

    #[test]
    fn higher_resolution_costs_more() {
      let p480 = cost_cents(Some(RouterResolution::FourEightyP), 10, None, None);
      let p720 = cost_cents(Some(RouterResolution::SevenTwentyP), 10, None, None);
      assert!(p480 < p720, "480p ({p480}) should be < 720p ({p720})");
    }

    #[test]
    fn longer_duration_costs_more() {
      let c5 = cost_cents(Some(RouterResolution::SevenTwentyP), 5, None, None);
      let c10 = cost_cents(Some(RouterResolution::SevenTwentyP), 10, None, None);
      let c15 = cost_cents(Some(RouterResolution::SevenTwentyP), 15, None, None);
      assert!(c5 < c10);
      assert!(c10 < c15);
    }

    #[test]
    fn one_k_request_clamps_to_480p_pricing() {
      let one_k = cost_cents(Some(RouterResolution::OneK), 10, None, None);
      let p480 = cost_cents(Some(RouterResolution::FourEightyP), 10, None, None);
      assert_eq!(one_k, p480);
    }

    #[test]
    fn ten_eighty_p_request_clamps_to_720p_pricing() {
      let p1080 = cost_cents(Some(RouterResolution::TenEightyP), 10, None, None);
      let p720 = cost_cents(Some(RouterResolution::SevenTwentyP), 10, None, None);
      assert_eq!(p1080, p720);
    }
  }

  // ── Cross-tier sanity: 1.5 must cost more than v1 at same settings ──

  mod cross_tier {
    use super::*;

    #[test]
    fn v1p5_costs_more_than_v1_at_720p() {
      let v1p5 = cost_cents(Some(RouterResolution::SevenTwentyP), 5, None, None);
      let v1 = v1_cost_cents(Some(RouterResolution::SevenTwentyP), 5, None, None);
      assert!(v1 < v1p5, "v1={v1} v1p5={v1p5}");
    }

    #[test]
    fn v1p5_costs_more_than_v1_at_480p() {
      let v1p5 = cost_cents(Some(RouterResolution::FourEightyP), 5, None, None);
      let v1 = v1_cost_cents(Some(RouterResolution::FourEightyP), 5, None, None);
      assert!(v1 < v1p5, "v1={v1} v1p5={v1p5}");
    }
  }

  // ── Exhaustive matrix ──

  mod exhaustive_matrix {
    use super::*;

    // (resolution, duration_s, has_image, ref_count, expected_cents)
    //
    // Mills math:
    //   480p output: 80 mills/s    720p output: 140 mills/s
    //   per input image: 10 mills
    //   cents = ceil(mills / 10)
    //
    // v1.5 requires at least one image, so every "has_image=false,
    // ref_count=0" row would be rejected. Those rows are gone; everything
    // else uses an explicit image source.
    const CASES: &[(RouterResolution, u16, bool, usize, u64)] = &[
      // 480p with image-to-video (1 input image, +10 mills)
      (RouterResolution::FourEightyP,  1, true,  0,   9),  //  80 + 10
      (RouterResolution::FourEightyP,  5, true,  0,  41),  // 400 + 10
      (RouterResolution::FourEightyP,  8, true,  0,  65),  // 640 + 10
      (RouterResolution::FourEightyP, 15, true,  0, 121),  // 1200 + 10
      // 720p with image-to-video (1 input image, +10 mills)
      (RouterResolution::SevenTwentyP, 1, true,  0,  15),  //  140 + 10
      (RouterResolution::SevenTwentyP, 5, true,  0,  71),  //  700 + 10
      (RouterResolution::SevenTwentyP, 8, true,  0, 113),  // 1120 + 10
      (RouterResolution::SevenTwentyP,15, true,  0, 211),  // 2100 + 10
      (RouterResolution::SevenTwentyP,10, true,  0, 141),  // 1400 + 10
      // 720p reference-to-video. Promote-first collapses any non-empty refs
      // list down to ONE effective image on the wire, so all of these cost
      // the same regardless of ref_count.
      (RouterResolution::SevenTwentyP, 5, false, 1,  71),  //  700 + 10
      (RouterResolution::SevenTwentyP, 5, false, 2,  71),  //  700 + 10 (promote-first)
      (RouterResolution::SevenTwentyP, 5, false, 3,  71),  //  700 + 10 (promote-first)
    ];

    #[test]
    fn all_matrix_cases() {
      for &(res, duration, has_image, ref_count, expected_cents) in CASES {
        let start_frame = if has_image {
          Some(ImageRef::Url("https://example.com/start.png".to_string()))
        } else { None };
        let reference_images = if ref_count > 0 {
          Some(ImageListRef::Urls(
            (0..ref_count).map(|i| format!("https://example.com/ref_{i}.png")).collect(),
          ))
        } else { None };
        let cents = cost_cents(Some(res), duration, start_frame, reference_images);
        assert_eq!(
          cents, expected_cents,
          "res={res:?} dur={duration} has_image={has_image} ref_count={ref_count}",
        );
      }
    }
  }

  // ── No-image rejection (defense in depth) ─────────────────────────────

  mod rejects_text_only {
    use super::*;
    use crate::errors::artcraft_router_error::ArtcraftRouterError;
    use crate::errors::client_error::ClientError;
    use crate::generate::generate_video::providers::grok_api::grok_imagine_video_1p5::cost::GrokApiGrokImagineVideo1p5CostState;
    use crate::generate::generate_video::providers::grok_api::grok_imagine_video_1p5::request::GrokApiGrokImagineVideo1p5RequestState;
    use grok_api_client::api::requests::videos::video_generation::video_generation::VideoGenerationRequest as GrokVideoGenerationRequest;
    use grok_api_client::api::types::video_types::video_model::VideoModel as GrokVideoModel;

    /// A cost-state hand-built around a text-only Grok request must return
    /// Err when estimate_cost is called. This guards against a state
    /// constructed outside of `build()` (e.g. in a misuse).
    #[test]
    fn estimate_cost_returns_err_when_no_image_sources() {
      let request = GrokVideoGenerationRequest {
        prompt: "text only".to_string(),
        model: Some(GrokVideoModel::GrokImagineVideo1p5Preview),
        image: None,
        reference_images: None,
        aspect_ratio: None,
        duration: Some(5),
        resolution: None,
        user: None,
      };
      let state = GrokApiGrokImagineVideo1p5CostState::from_request(
        &GrokApiGrokImagineVideo1p5RequestState { request },
      );
      let err = state.estimate_cost().expect_err("text-only must be rejected");
      match err {
        ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { field, .. }) => {
          assert_eq!(field, "image_inputs");
        }
        other => panic!("expected Client(ModelDoesNotSupportOption), got {:?}", other),
      }
    }
  }

  // ── Helpers ──

  fn cost_cents(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    start_frame: Option<ImageRef>,
    reference_images: Option<ImageListRef>,
  ) -> u64 {
    build_for(RouterVideoModel::GrokImagineVideo1p5, resolution, duration_seconds, start_frame, reference_images)
  }

  fn v1_cost_cents(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    start_frame: Option<ImageRef>,
    reference_images: Option<ImageListRef>,
  ) -> u64 {
    build_for(RouterVideoModel::GrokImagineVideo, resolution, duration_seconds, start_frame, reference_images)
  }

  fn build_for(
    model: RouterVideoModel,
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    start_frame: Option<ImageRef>,
    reference_images: Option<ImageListRef>,
  ) -> u64 {
    // v1.5 rejects text-to-video at build time. To keep pricing tests
    // focused on duration/resolution/batch scaling (rather than constantly
    // duplicating an image input in every call site), the helper injects a
    // single default start_frame URL when neither image source is supplied.
    // That adds a 10-mill / 1¢ input-image surcharge to every "no-image"
    // case — all the expected values below account for it.
    let start_frame = match (start_frame, &reference_images) {
      (Some(sf), _) => Some(sf),
      (None, Some(_)) => None,
      (None, None) => Some(ImageRef::Url("https://example.com/default.png".to_string())),
    };
    let builder = GenerateVideoRequestBuilder {
      model,
      provider: RouterProvider::GrokApi,
      aspect_ratio: Some(RouterAspectRatio::WideSixteenByNine),
      resolution,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(1),
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
}

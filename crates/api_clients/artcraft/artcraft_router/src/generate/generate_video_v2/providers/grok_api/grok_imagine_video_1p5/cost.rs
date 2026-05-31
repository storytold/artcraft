use grok_api_client::api::traits::grok_request_cost_calculator_trait::GrokRequestCostCalculator;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::grok_api::grok_imagine_video_1p5::request::GrokApiGrokImagineVideo1p5RequestState;

pub struct GrokApiGrokImagineVideo1p5CostState {
  request: GrokApiGrokImagineVideo1p5RequestState,
}

impl GrokApiGrokImagineVideo1p5CostState {
  pub fn from_request(request: &GrokApiGrokImagineVideo1p5RequestState) -> Self {
    Self { request: request.clone() }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // grok_api_client's calculator picks the v1.5 pricing tier from the
    // request's `model` field (see VideoModel::pricing_tier). The build step
    // sets `model = Some(GrokImagineVideo1p5Preview)`, so this returns the
    // v1.5 rates:
    //   Output: 80 mills/s @ 480p, 140 mills/s @ 720p
    //   Input:  10 mills per source image
    let cost_in_usd_cents = self.request.request.calculate_cost_in_cents();

    VideoGenerationCostEstimate {
      cost_in_credits: None,
      cost_in_usd_cents: Some(cost_in_usd_cents),
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

    #[test]
    fn five_s_no_image_ref() {
      // 140 × 5 = 700 mills → 70¢
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, None, None), 70);
    }

    #[test]
    fn ten_s_no_image_ref() {
      // 140 × 10 = 1400 mills → 140¢
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 10, None, None), 140);
    }

    #[test]
    fn fifteen_s_no_image_ref() {
      // 140 × 15 = 2100 mills → 210¢
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 15, None, None), 210);
    }
  }

  // ── 480p pricing ──

  mod pricing_480p {
    use super::*;

    #[test]
    fn five_s_no_image_ref() {
      // 80 × 5 = 400 mills → 40¢
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, None, None), 40);
    }

    #[test]
    fn ten_s_no_image_ref() {
      // 80 × 10 = 800 mills → 80¢
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 10, None, None), 80);
    }

    #[test]
    fn fifteen_s_no_image_ref() {
      // 80 × 15 = 1200 mills → 120¢
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 15, None, None), 120);
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
    fn three_reference_images_adds_30_mills() {
      // 5s @ 720p output 700 mills + 3 input images 30 mills = 730 mills → 73¢
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
      assert_eq!(cents, 73);
    }

    #[test]
    fn image_input_count_scales_linearly() {
      // Fix 5s @ 720p (700 mills base); vary ref image count 1..=5.
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
        let expected_mills = 700 + 10 * n;
        let expected_cents = expected_mills.div_ceil(10);
        assert_eq!(cents, expected_cents, "n={n}");
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
    const CASES: &[(RouterResolution, u16, bool, usize, u64)] = &[
      // 480p text-only
      (RouterResolution::FourEightyP,  1, false, 0,   8),  //  80
      (RouterResolution::FourEightyP,  5, false, 0,  40),  // 400
      (RouterResolution::FourEightyP,  8, false, 0,  64),  // 640
      (RouterResolution::FourEightyP, 15, false, 0, 120),  // 1200
      // 720p text-only
      (RouterResolution::SevenTwentyP, 1, false, 0,  14),  //  140
      (RouterResolution::SevenTwentyP, 5, false, 0,  70),  //  700
      (RouterResolution::SevenTwentyP, 8, false, 0, 112),  // 1120
      (RouterResolution::SevenTwentyP,15, false, 0, 210),  // 2100
      // 480p with image-to-video (1 input image, +10 mills)
      (RouterResolution::FourEightyP,  5, true,  0,  41),  // 410
      (RouterResolution::FourEightyP, 10, true,  0,  81),  // 810
      // 720p with image-to-video (1 input image, +10 mills)
      (RouterResolution::SevenTwentyP, 5, true,  0,  71),  //  710
      (RouterResolution::SevenTwentyP,10, true,  0, 141),  // 1410
      // 720p reference-to-video (no start frame, N reference images)
      (RouterResolution::SevenTwentyP, 5, false, 1,  71),  //  710
      (RouterResolution::SevenTwentyP, 5, false, 2,  72),  //  720
      (RouterResolution::SevenTwentyP, 5, false, 3,  73),  //  730
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

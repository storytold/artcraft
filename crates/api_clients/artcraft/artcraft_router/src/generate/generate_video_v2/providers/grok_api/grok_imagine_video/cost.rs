use grok_api_client::api::traits::grok_request_cost_calculator_trait::GrokRequestCostCalculator;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::grok_api::grok_imagine_video::request::GrokApiGrokImagineVideoRequestState;

pub struct GrokApiGrokImagineVideoCostState {
  request: GrokApiGrokImagineVideoRequestState,
}

impl GrokApiGrokImagineVideoCostState {
  pub fn from_request(request: &GrokApiGrokImagineVideoRequestState) -> Self {
    Self { request: request.clone() }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // grok_api_client's GrokRequestCostCalculator does the math:
    // - Output: resolution × duration (50 mills/s @ 480p, 70 mills/s @ 720p)
    // - Input:  2 mills × source image count
    // No source-video duration to factor in for `video_generation` — it's
    // text/image → video, not edit/extension.
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
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  // Pricing reference (from grok_api_client/cost.rs, mirrors xAI's table):
  //   Output:  480p 50 mills/s   ($0.05/s)
  //            720p 70 mills/s   ($0.07/s)
  //   Input:   2 mills per source image  ($0.002/img)
  //
  // Cost in cents = ceil(mills / 10).

  mod pricing_720p {
    use super::*;

    #[test]
    fn five_s_no_image_ref() {
      // 70 × 5 = 350 mills → 35¢
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 5, None, None), 35);
    }

    #[test]
    fn ten_s_no_image_ref() {
      // 70 × 10 = 700 mills → 70¢
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 10, None, None), 70);
    }

    #[test]
    fn fifteen_s_no_image_ref() {
      // 70 × 15 = 1050 mills → 105¢
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 15, None, None), 105);
    }
  }

  mod pricing_480p {
    use super::*;

    #[test]
    fn five_s_no_image_ref() {
      // 50 × 5 = 250 mills → 25¢
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 5, None, None), 25);
    }

    #[test]
    fn ten_s_no_image_ref() {
      // 50 × 10 = 500 mills → 50¢
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 10, None, None), 50);
    }

    #[test]
    fn fifteen_s_no_image_ref() {
      // 50 × 15 = 750 mills → 75¢
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 15, None, None), 75);
    }
  }

  mod image_inputs_add_to_cost {
    use super::*;

    #[test]
    fn single_start_frame_image_adds_2_mills() {
      // 5s @ 720p output 350 mills + 1 input image 2 mills = 352 mills → 36¢ (ceil)
      let cents = cost_cents(
        Some(CommonResolution::SevenTwentyP),
        5,
        Some(ImageRef::Url("https://example.com/a.png".to_string())),
        None,
      );
      assert_eq!(cents, 36);
    }

    #[test]
    fn three_reference_images_adds_6_mills() {
      // 5s @ 720p output 350 mills + 3 input images 6 mills = 356 mills → 36¢ (ceil)
      let cents = cost_cents(
        Some(CommonResolution::SevenTwentyP),
        5,
        None,
        Some(ImageListRef::Urls(vec![
          "https://example.com/a.png".to_string(),
          "https://example.com/b.png".to_string(),
          "https://example.com/c.png".to_string(),
        ])),
      );
      assert_eq!(cents, 36);
    }
  }

  mod relative_pricing {
    use super::*;

    #[test]
    fn higher_resolution_costs_more() {
      let p480 = cost_cents(Some(CommonResolution::FourEightyP), 10, None, None);
      let p720 = cost_cents(Some(CommonResolution::SevenTwentyP), 10, None, None);
      assert!(p480 < p720, "480p ({p480}) should be < 720p ({p720})");
    }

    #[test]
    fn longer_duration_costs_more() {
      let c5 = cost_cents(Some(CommonResolution::SevenTwentyP), 5, None, None);
      let c10 = cost_cents(Some(CommonResolution::SevenTwentyP), 10, None, None);
      let c15 = cost_cents(Some(CommonResolution::SevenTwentyP), 15, None, None);
      assert!(c5 < c10);
      assert!(c10 < c15);
    }

    #[test]
    fn one_k_request_clamps_to_480p_pricing() {
      // OneK gets bumped to 480p in plan_resolution, so cost equals 480p cost.
      let one_k = cost_cents(Some(CommonResolution::OneK), 10, None, None);
      let p480 = cost_cents(Some(CommonResolution::FourEightyP), 10, None, None);
      assert_eq!(one_k, p480);
    }

    #[test]
    fn ten_eighty_p_request_clamps_to_720p_pricing() {
      // TenEightyP gets clamped to 720p in plan_resolution.
      let p1080 = cost_cents(Some(CommonResolution::TenEightyP), 10, None, None);
      let p720 = cost_cents(Some(CommonResolution::SevenTwentyP), 10, None, None);
      assert_eq!(p1080, p720);
    }
  }

  fn cost_cents(
    resolution: Option<CommonResolution>,
    duration_seconds: u16,
    start_frame: Option<ImageRef>,
    reference_images: Option<ImageListRef>,
  ) -> u64 {
    let builder = GenerateVideoRequestBuilder {
      model: CommonVideoModel::GrokImagineVideo,
      provider: Provider::GrokApi,
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
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

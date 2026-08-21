use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;
use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests_old::webhook::video::image::enqueue_seedance_1_lite_image_to_video_webhook::{
  Seedance1LiteDuration, Seedance1LiteRequest, Seedance1LiteResolution,
};

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::seedance_1p0_lite::request::ArtcraftSeedance10LiteRequestState;

#[derive(Clone, Debug)]
pub struct ArtcraftSeedance10LiteCostState {
  pub duration: Seedance1LiteDuration,
  pub resolution: Seedance1LiteResolution,
}

impl ArtcraftSeedance10LiteCostState {
  pub fn from_request(request: &ArtcraftSeedance10LiteRequestState) -> Self {
    // Legacy handler defaults: 5 seconds, 720p.
    let duration = if request.request.duration_seconds == Some(10) {
      Seedance1LiteDuration::TenSeconds
    } else {
      Seedance1LiteDuration::FiveSeconds
    };
    let resolution = match request.request.resolution {
      Some(CommonResolutionEnum::FourEightyP) => Seedance1LiteResolution::FourEightyP,
      Some(CommonResolutionEnum::TenEightyP) => Seedance1LiteResolution::TenEightyP,
      _ => Seedance1LiteResolution::SevenTwentyP,
    };
    Self { duration, resolution }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Derived from the Fal client's cost calculator so the price tracks
    // upstream pricing across every resolution and duration.
    let req = Seedance1LiteRequest {
      image_url: String::new(),
      end_frame_image_url: None,
      prompt: String::new(),
      duration: self.duration,
      resolution: self.resolution,
      aspect_ratio: None,
      camera_fixed: false,
      seed: None,
    };
    let cost_in_usd_cents = (req.calculate_cost_in_cents() * 21).div_ceil(20);

    VideoGenerationCostEstimate {
      cost_in_credits: Some(cost_in_usd_cents),
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
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn cost_cents(duration_seconds: Option<u16>, resolution: Option<RouterResolution>) -> u64 {
    let b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance10Lite,
      provider: RouterProvider::Artcraft,
      prompt: Some("test".to_string()),
      duration_seconds,
      resolution,
      ..Default::default()
    };
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn default_is_720p_5s_priced_at_19() {
    assert_eq!(cost_cents(None, None), 19);
  }

  #[test]
  fn p480_5s_is_10() { assert_eq!(cost_cents(Some(5), Some(RouterResolution::FourEightyP)), 10); }

  #[test]
  fn p480_10s_is_18() { assert_eq!(cost_cents(Some(10), Some(RouterResolution::FourEightyP)), 18); }

  #[test]
  fn p720_5s_is_19() { assert_eq!(cost_cents(Some(5), Some(RouterResolution::SevenTwentyP)), 19); }

  #[test]
  fn p720_10s_is_52() { assert_eq!(cost_cents(Some(10), Some(RouterResolution::SevenTwentyP)), 52); }

  #[test]
  fn p1080_5s_is_58() { assert_eq!(cost_cents(Some(5), Some(RouterResolution::TenEightyP)), 58); }

  #[test]
  fn p1080_10s_is_116() { assert_eq!(cost_cents(Some(10), Some(RouterResolution::TenEightyP)), 116); }

  #[test]
  fn p480_5s_cheaper_than_p720_5s() {
    assert!(
      cost_cents(Some(5), Some(RouterResolution::FourEightyP))
        < cost_cents(Some(5), Some(RouterResolution::SevenTwentyP))
    );
  }
}

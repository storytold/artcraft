use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_video::providers::fal::veo_3p1_lite::request::{
  FalVeo3p1LiteMode, FalVeo3p1LiteRequestState,
};
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

#[derive(Clone, Debug)]
pub struct FalVeo3p1LiteCostState {
  pub cost_in_usd_cents: u64,
}

impl FalVeo3p1LiteCostState {
  pub fn from_request(request: &FalVeo3p1LiteRequestState) -> Self {
    // Cost math is owned by fal_client's per-endpoint
    // `FalRequestCostCalculator` implementations. The router state just
    // forwards the result so router cost ≡ fal_client cost by construction.
    let cost_in_usd_cents = match &request.mode {
      FalVeo3p1LiteMode::TextToVideo(req) => req.calculate_cost_in_cents(),
      FalVeo3p1LiteMode::ImageToVideo(req) => req.calculate_cost_in_cents(),
      FalVeo3p1LiteMode::FirstLastFrameToVideo(req) => req.calculate_cost_in_cents(),
    };
    Self { cost_in_usd_cents }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    VideoGenerationCostEstimate {
      cost_in_credits: Some(self.cost_in_usd_cents),
      cost_in_usd_cents: Some(self.cost_in_usd_cents),
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
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::providers::fal::veo_3p1_lite::build::build_fal_veo_3p1_lite_state;

  use super::*;

  // Veo 3.1 Lite pricing (both resolution and audio move the rate; no 4k):
  //   720p:  $0.03/sec (audio off), $0.05/sec (audio on)
  //   1080p: $0.05/sec (audio off), $0.08/sec (audio on)

  mod text_to_video {
    use super::*;

    #[test]
    fn t2v_8s_audio_on_720p_is_40() {
      assert_eq!(cost_cents(Some(8), Some(RouterResolution::SevenTwentyP), Some(true), 0), 40);
    }

    #[test]
    fn t2v_8s_audio_off_720p_is_24() {
      assert_eq!(cost_cents(Some(8), Some(RouterResolution::SevenTwentyP), Some(false), 0), 24);
    }

    #[test]
    fn t2v_8s_audio_on_1080p_is_64() {
      assert_eq!(cost_cents(Some(8), Some(RouterResolution::TenEightyP), Some(true), 0), 64);
    }

    #[test]
    fn t2v_8s_audio_off_1080p_is_40() {
      assert_eq!(cost_cents(Some(8), Some(RouterResolution::TenEightyP), Some(false), 0), 40);
    }

    #[test]
    fn t2v_4s_audio_on_720p_is_20() {
      assert_eq!(cost_cents(Some(4), Some(RouterResolution::SevenTwentyP), Some(true), 0), 20);
    }

    #[test]
    fn t2v_6s_audio_on_720p_is_30() {
      assert_eq!(cost_cents(Some(6), Some(RouterResolution::SevenTwentyP), Some(true), 0), 30);
    }

    #[test]
    fn t2v_defaults_are_8s_720p_audio_on_40() {
      // duration=None→8s, resolution=None→720p, audio=None→on.
      assert_eq!(cost_cents(None, None, None, 0), 40);
    }
  }

  mod image_to_video {
    use super::*;

    #[test]
    fn i2v_8s_audio_off_720p_is_24() {
      assert_eq!(cost_cents(Some(8), Some(RouterResolution::SevenTwentyP), Some(false), 1), 24);
    }

    #[test]
    fn i2v_6s_audio_on_720p_is_30() {
      assert_eq!(cost_cents(Some(6), Some(RouterResolution::SevenTwentyP), Some(true), 1), 30);
    }
  }

  mod first_last_frame_to_video {
    use super::*;

    #[test]
    fn flf_8s_audio_on_1080p_is_64() {
      assert_eq!(cost_cents(Some(8), Some(RouterResolution::TenEightyP), Some(true), 2), 64);
    }

    #[test]
    fn flf_4s_audio_off_720p_is_12() {
      assert_eq!(cost_cents(Some(4), Some(RouterResolution::SevenTwentyP), Some(false), 2), 12);
    }
  }

  #[test]
  fn all_three_modes_price_identically() {
    let t2v = cost_cents(Some(6), Some(RouterResolution::TenEightyP), Some(true), 0);
    let i2v = cost_cents(Some(6), Some(RouterResolution::TenEightyP), Some(true), 1);
    let flf = cost_cents(Some(6), Some(RouterResolution::TenEightyP), Some(true), 2);
    assert_eq!(t2v, i2v);
    assert_eq!(i2v, flf);
  }

  #[test]
  fn audio_costs_more_than_no_audio() {
    assert!(
      cost_cents(Some(8), Some(RouterResolution::SevenTwentyP), Some(false), 0)
        < cost_cents(Some(8), Some(RouterResolution::SevenTwentyP), Some(true), 0)
    );
  }

  #[test]
  fn ten_eighty_costs_more_than_seven_twenty() {
    assert!(
      cost_cents(Some(8), Some(RouterResolution::SevenTwentyP), Some(true), 0)
        < cost_cents(Some(8), Some(RouterResolution::TenEightyP), Some(true), 0)
    );
  }

  fn cost_cents(
    duration_seconds: Option<u16>,
    resolution: Option<RouterResolution>,
    generate_audio: Option<bool>,
    frames: u8,
  ) -> u64 {
    let mut b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Veo3p1Lite,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      duration_seconds,
      resolution,
      generate_audio,
      ..Default::default()
    };
    if frames >= 1 {
      b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
    }
    if frames == 2 {
      b.end_frame = Some(ImageRef::Url("https://example.com/b.png".to_string()));
    }
    let state = build_fal_veo_3p1_lite_state(b).expect("build state");
    FalVeo3p1LiteCostState::from_request(&state)
      .estimate_cost()
      .cost_in_usd_cents
      .expect("cost")
  }
}

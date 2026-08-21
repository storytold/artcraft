use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::fal::veo_3::request::{FalVeo3Mode, FalVeo3RequestState};

#[derive(Clone, Debug)]
pub struct FalVeo3CostState {
  pub cost_in_usd_cents: u64,
}

impl FalVeo3CostState {
  pub fn from_request(request: &FalVeo3RequestState) -> Self {
    // Cost math is owned by fal_client's per-endpoint
    // `FalRequestCostCalculator` implementations. The router state just
    // forwards the result so router cost ≡ fal_client cost by construction.
    let cost_in_usd_cents = match &request.mode {
      FalVeo3Mode::TextToVideo(req) => req.calculate_cost_in_cents(),
      FalVeo3Mode::ImageToVideo(req) => req.calculate_cost_in_cents(),
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
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::providers::fal::veo_3::build::build_fal_veo_3_state;

  use super::*;

  // Pricing (fal): $0.20/sec audio off, $0.40/sec audio on. Flat across
  // modalities; resolution (720p/1080p) does not change the price.

  mod numeric_literal_pricing {
    use super::*;

    #[test]
    fn audio_on_4s_is_160() {
      // $0.40/sec audio on × 4s = 160¢.
      assert_eq!(cost_cents(Some(4), Some(true), false), 160);
    }

    #[test]
    fn audio_on_6s_is_240() { assert_eq!(cost_cents(Some(6), Some(true), false), 240); }

    #[test]
    fn audio_on_8s_is_320() { assert_eq!(cost_cents(Some(8), Some(true), false), 320); }

    #[test]
    fn audio_off_4s_is_80() {
      // $0.20/sec audio off × 4s = 80¢.
      assert_eq!(cost_cents(Some(4), Some(false), false), 80);
    }

    #[test]
    fn audio_off_8s_is_160() { assert_eq!(cost_cents(Some(8), Some(false), false), 160); }

    #[test]
    fn duration_default_is_8s() {
      // No duration → fal default 8s.
      assert_eq!(cost_cents(None, Some(true), false), 320);
    }

    #[test]
    fn audio_default_is_true() {
      // None → defaults to audio=true via builder.
      assert_eq!(cost_cents(Some(6), None, false), 240);
    }

    #[test]
    fn i2v_matches_t2v() {
      assert_eq!(cost_cents(Some(6), Some(true), false), cost_cents(Some(6), Some(true), true));
    }
  }

  #[test]
  fn audio_costs_more_than_no_audio() {
    assert!(cost_cents(Some(8), Some(false), false) < cost_cents(Some(8), Some(true), false));
  }

  fn cost_cents(duration_seconds: Option<u16>, generate_audio: Option<bool>, has_start_frame: bool) -> u64 {
    let mut b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Veo3,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      duration_seconds,
      generate_audio,
      ..Default::default()
    };
    if has_start_frame {
      b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
    }
    let state = build_fal_veo_3_state(b).expect("build_fal_veo_3_state");
    FalVeo3CostState::from_request(&state)
      .estimate_cost()
      .cost_in_usd_cents
      .expect("cost_in_usd_cents")
  }
}

use fal_client::requests::webhook::video::image::enqueue_veo_2_image_to_video_webhook::Veo2Duration;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::fal::veo_2::request::{FalVeo2Mode, FalVeo2RequestState};

#[derive(Clone, Debug)]
pub struct FalVeo2CostState {
  pub duration: Veo2Duration,
}

impl FalVeo2CostState {
  pub fn from_request(request: &FalVeo2RequestState) -> Self {
    let duration = match &request.mode {
      FalVeo2Mode::TextToVideo(req) => req.duration,
      FalVeo2Mode::ImageToVideo(req) => req.duration,
    };
    Self { duration }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // 5s = $2.50, +$0.50 per additional second.
    let seconds = duration_seconds_for_cost(self.duration);
    let extra = seconds.saturating_sub(5);
    let cost_in_usd_cents = 250 + extra * 50;

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

fn duration_seconds_for_cost(d: Veo2Duration) -> u64 {
  match d {
    Veo2Duration::Default | Veo2Duration::FiveSeconds => 5,
    Veo2Duration::SixSeconds => 6,
    Veo2Duration::SevenSeconds => 7,
    Veo2Duration::EightSeconds => 8,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn cost_cents(duration_seconds: Option<u16>, has_start_frame: bool) -> u64 {
    let mut b = GenerateVideoRequestBuilder {
      model: CommonVideoModel::Veo2,
      provider: Provider::Fal,
      prompt: Some("test".to_string()),
      duration_seconds,
      ..Default::default()
    };
    if has_start_frame {
      b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
    }
    b.build2()
      .expect("build2")
      .estimate_cost()
      .expect("estimate_cost")
      .cost_in_usd_cents
      .expect("cost_in_usd_cents")
  }

  mod numeric_literal_pricing {
    use super::*;

    #[test]
    fn default_duration_is_5s_priced_at_250() {
      // 5s = $2.50 baseline.
      assert_eq!(cost_cents(None, false), 250);
    }

    #[test]
    fn five_seconds_is_250() {
      assert_eq!(cost_cents(Some(5), false), 250);
    }

    #[test]
    fn six_seconds_is_300() {
      // +$0.50 per second past 5s.
      assert_eq!(cost_cents(Some(6), false), 300);
    }

    #[test]
    fn seven_seconds_is_350() {
      assert_eq!(cost_cents(Some(7), false), 350);
    }

    #[test]
    fn eight_seconds_is_400() {
      assert_eq!(cost_cents(Some(8), false), 400);
    }

    #[test]
    fn i2v_matches_t2v() {
      assert_eq!(cost_cents(Some(7), false), cost_cents(Some(7), true));
    }
  }

  #[test]
  fn longer_duration_costs_more() {
    assert!(cost_cents(Some(5), false) < cost_cents(Some(6), false));
    assert!(cost_cents(Some(6), false) < cost_cents(Some(7), false));
    assert!(cost_cents(Some(7), false) < cost_cents(Some(8), false));
  }
}

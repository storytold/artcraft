use fal_client::requests::webhook::video::image::enqueue_veo_3_fast_image_to_video_webhook::Veo3FastDuration;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::fal::veo_3_fast::request::FalVeo3FastRequestState;

#[derive(Clone, Debug)]
pub struct FalVeo3FastCostState {
  pub duration_seconds: u64,
  pub generate_audio: bool,
}

impl FalVeo3FastCostState {
  pub fn from_request(request: &FalVeo3FastRequestState) -> Self {
    Self {
      duration_seconds: duration_seconds_for_cost(request.request.duration),
      generate_audio: request.request.generate_audio,
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // $0.10/sec audio off, $0.15/sec audio on (720p/1080p).
    let per_second_cents: u64 = if self.generate_audio { 15 } else { 10 };
    let cost_in_usd_cents = per_second_cents * self.duration_seconds;

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

fn duration_seconds_for_cost(d: Veo3FastDuration) -> u64 {
  match d {
    Veo3FastDuration::Default | Veo3FastDuration::EightSeconds => 8,
    Veo3FastDuration::SixSeconds => 6,
    Veo3FastDuration::FourSeconds => 4,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn cost_cents(duration_seconds: Option<u16>, generate_audio: Option<bool>) -> u64 {
    let b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Veo3Fast,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      start_frame: Some(ImageRef::Url("https://example.com/a.png".to_string())),
      duration_seconds,
      generate_audio,
      ..Default::default()
    };
    b.build2().expect("build2").estimate_cost().expect("estimate_cost").cost_in_usd_cents.expect("cost")
  }

  mod numeric_literal_pricing {
    use super::*;

    #[test]
    fn audio_on_4s_is_60() {
      // $0.15/sec × 4s = 60¢.
      assert_eq!(cost_cents(Some(4), Some(true)), 60);
    }

    #[test]
    fn audio_on_6s_is_90() { assert_eq!(cost_cents(Some(6), Some(true)), 90); }

    #[test]
    fn audio_on_8s_is_120() { assert_eq!(cost_cents(Some(8), Some(true)), 120); }

    #[test]
    fn audio_off_4s_is_40() {
      // $0.10/sec × 4s = 40¢.
      assert_eq!(cost_cents(Some(4), Some(false)), 40);
    }

    #[test]
    fn audio_off_8s_is_80() { assert_eq!(cost_cents(Some(8), Some(false)), 80); }

    #[test]
    fn default_duration_is_8s() {
      assert_eq!(cost_cents(None, Some(true)), 120);
    }
  }

  #[test]
  fn audio_costs_more_than_no_audio() {
    assert!(cost_cents(Some(8), Some(false)) < cost_cents(Some(8), Some(true)));
  }

  #[test]
  fn longer_duration_costs_more() {
    assert!(cost_cents(Some(4), Some(true)) < cost_cents(Some(6), Some(true)));
    assert!(cost_cents(Some(6), Some(true)) < cost_cents(Some(8), Some(true)));
  }
}

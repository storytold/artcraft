use fal_client::requests::webhook::video::image::enqueue_veo_3_image_to_video_webhook::Veo3I2vDuration;
use fal_client::requests::webhook::video::text::enqueue_veo_3_text_to_video_webhook::Veo3T2vDuration;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::fal::veo_3::request::{FalVeo3Mode, FalVeo3RequestState};

#[derive(Clone, Debug)]
pub struct FalVeo3CostState {
  pub duration_seconds: u64,
  pub generate_audio: bool,
}

impl FalVeo3CostState {
  pub fn from_request(request: &FalVeo3RequestState) -> Self {
    let (duration_seconds, generate_audio) = match &request.mode {
      FalVeo3Mode::TextToVideo(req) => (t2v_duration_seconds(req.duration), req.generate_audio),
      FalVeo3Mode::ImageToVideo(req) => (i2v_duration_seconds(req.duration), req.generate_audio),
    };
    Self { duration_seconds, generate_audio }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // $0.20/sec audio off, $0.40/sec audio on (720p/1080p).
    let per_second_cents: u64 = if self.generate_audio { 40 } else { 20 };
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

fn t2v_duration_seconds(d: Veo3T2vDuration) -> u64 {
  match d {
    Veo3T2vDuration::Default | Veo3T2vDuration::EightSeconds => 8,
    Veo3T2vDuration::SixSeconds => 6,
    Veo3T2vDuration::FourSeconds => 4,
  }
}

fn i2v_duration_seconds(d: Veo3I2vDuration) -> u64 {
  match d {
    Veo3I2vDuration::Default | Veo3I2vDuration::EightSeconds => 8,
    Veo3I2vDuration::SixSeconds => 6,
    Veo3I2vDuration::FourSeconds => 4,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

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
    b.build2().expect("build2").estimate_cost().expect("estimate_cost").cost_in_usd_cents.expect("cost")
  }

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
      // No duration → Default → 8s.
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
}

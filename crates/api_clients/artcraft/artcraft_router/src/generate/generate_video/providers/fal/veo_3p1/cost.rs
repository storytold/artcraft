use fal_client::requests_old::webhook::video::image::enqueue_veo_3p1_first_last_frame_image_to_video_webhook::EnqueueVeo3p1FirstLastFrameImageToVideoDurationSeconds;
use fal_client::requests_old::webhook::video::image::enqueue_veo_3p1_image_to_video_webhook::EnqueueVeo3p1ImageToVideoDurationSeconds;
use fal_client::requests_old::webhook::video::text::enqueue_veo_3p1_text_to_video_webhook::EnqueueVeo3p1TextToVideoDurationSeconds;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::fal::veo_3p1::request::{FalVeo3p1Mode, FalVeo3p1RequestState};

#[derive(Clone, Debug)]
pub struct FalVeo3p1CostState {
  pub duration_seconds: u64,
  pub generate_audio: bool,
}

impl FalVeo3p1CostState {
  pub fn from_request(request: &FalVeo3p1RequestState) -> Self {
    let (duration_seconds, generate_audio) = extract_duration_and_audio(&request.mode);
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

pub(crate) fn extract_duration_and_audio(mode: &FalVeo3p1Mode) -> (u64, bool) {
  match mode {
    FalVeo3p1Mode::TextToVideo(req) => (t2v_duration_seconds(req.duration), req.generate_audio.unwrap_or(true)),
    FalVeo3p1Mode::ImageToVideo(req) => (i2v_duration_seconds(req.duration), req.generate_audio.unwrap_or(true)),
    FalVeo3p1Mode::FirstLastFrame(req) => (flf_duration_seconds(req.duration), req.generate_audio.unwrap_or(true)),
  }
}

fn t2v_duration_seconds(d: Option<EnqueueVeo3p1TextToVideoDurationSeconds>) -> u64 {
  match d {
    Some(EnqueueVeo3p1TextToVideoDurationSeconds::Four) => 4,
    Some(EnqueueVeo3p1TextToVideoDurationSeconds::Six) => 6,
    Some(EnqueueVeo3p1TextToVideoDurationSeconds::Eight) | None => 8,
  }
}

fn i2v_duration_seconds(d: Option<EnqueueVeo3p1ImageToVideoDurationSeconds>) -> u64 {
  match d {
    Some(EnqueueVeo3p1ImageToVideoDurationSeconds::Four) => 4,
    Some(EnqueueVeo3p1ImageToVideoDurationSeconds::Six) => 6,
    Some(EnqueueVeo3p1ImageToVideoDurationSeconds::Eight) | None => 8,
  }
}

fn flf_duration_seconds(d: Option<EnqueueVeo3p1FirstLastFrameImageToVideoDurationSeconds>) -> u64 {
  match d {
    Some(EnqueueVeo3p1FirstLastFrameImageToVideoDurationSeconds::Four) => 4,
    Some(EnqueueVeo3p1FirstLastFrameImageToVideoDurationSeconds::Six) => 6,
    Some(EnqueueVeo3p1FirstLastFrameImageToVideoDurationSeconds::Eight) | None => 8,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn cost_cents(
    duration_seconds: Option<u16>,
    generate_audio: Option<bool>,
    frames: u8,
  ) -> u64 {
    let mut b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Veo3p1,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      duration_seconds,
      generate_audio,
      ..Default::default()
    };
    if frames >= 1 {
      b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
    }
    if frames == 2 {
      b.end_frame = Some(ImageRef::Url("https://example.com/b.png".to_string()));
    }
    b.build2().expect("build2").estimate_cost().expect("estimate_cost").cost_in_usd_cents.expect("cost")
  }

  mod numeric_literal_pricing {
    use super::*;

    #[test]
    fn t2v_audio_on_4s_is_160() { assert_eq!(cost_cents(Some(4), Some(true), 0), 160); }

    #[test]
    fn t2v_audio_on_6s_is_240() { assert_eq!(cost_cents(Some(6), Some(true), 0), 240); }

    #[test]
    fn t2v_audio_on_8s_is_320() { assert_eq!(cost_cents(Some(8), Some(true), 0), 320); }

    #[test]
    fn t2v_audio_off_4s_is_80() { assert_eq!(cost_cents(Some(4), Some(false), 0), 80); }

    #[test]
    fn t2v_audio_off_8s_is_160() { assert_eq!(cost_cents(Some(8), Some(false), 0), 160); }

    #[test]
    fn t2v_no_duration_defaults_to_8s() {
      assert_eq!(cost_cents(None, Some(true), 0), 320);
    }

    #[test]
    fn t2v_no_audio_defaults_to_audio_on() {
      assert_eq!(cost_cents(Some(6), None, 0), 240);
    }
  }

  #[test]
  fn all_three_modes_price_identically() {
    let t2v = cost_cents(Some(6), Some(true), 0);
    let i2v = cost_cents(Some(6), Some(true), 1);
    let flf = cost_cents(Some(6), Some(true), 2);
    assert_eq!(t2v, i2v);
    assert_eq!(i2v, flf);
  }

  #[test]
  fn audio_costs_more_than_no_audio() {
    assert!(cost_cents(Some(8), Some(false), 0) < cost_cents(Some(8), Some(true), 0));
  }
}

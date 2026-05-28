use fal_client::requests::webhook::video::image::enqueue_kling_v2p6_pro_image_to_video_webhook::EnqueueKlingV2p6ProImageToVideoDurationSeconds;
use fal_client::requests::webhook::video::text::enqueue_kling_v2p6_pro_text_to_video_webhook::EnqueueKlingV2p6ProTextToVideoDurationSeconds;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::fal::kling_2_6_pro::request::{
  FalKling2p6ProMode, FalKling2p6ProRequestState,
};

#[derive(Clone, Debug)]
pub struct FalKling2p6ProCostState {
  pub is_ten_seconds: bool,
  pub generate_audio: bool,
}

impl FalKling2p6ProCostState {
  pub fn from_request(request: &FalKling2p6ProRequestState) -> Self {
    let (is_ten_seconds, generate_audio) = match &request.mode {
      FalKling2p6ProMode::TextToVideo(req) => (
        matches!(req.duration, Some(EnqueueKlingV2p6ProTextToVideoDurationSeconds::Ten)),
        req.generate_audio.unwrap_or(true),
      ),
      FalKling2p6ProMode::ImageToVideo(req) => (
        matches!(req.duration, Some(EnqueueKlingV2p6ProImageToVideoDurationSeconds::Ten)),
        req.generate_audio.unwrap_or(true),
      ),
    };
    Self { is_ten_seconds, generate_audio }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Mirrors fal_client kling_v2p6_pro:
    //   audio off: $0.07/sec → 5s=35¢, 10s=70¢
    //   audio on:  $0.14/sec → 5s=70¢, 10s=140¢
    let cost_in_usd_cents: u64 = match (self.generate_audio, self.is_ten_seconds) {
      (false, false) => 35,
      (false, true) => 70,
      (true, false) => 70,
      (true, true) => 140,
    };

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
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn cost_cents(duration_seconds: Option<u16>, generate_audio: Option<bool>) -> u64 {
    let b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Kling2p6Pro,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      duration_seconds,
      generate_audio,
      ..Default::default()
    };
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn audio_off_5s_is_35() { assert_eq!(cost_cents(Some(5), Some(false)), 35); }

  #[test]
  fn audio_off_10s_is_70() { assert_eq!(cost_cents(Some(10), Some(false)), 70); }

  #[test]
  fn audio_on_5s_is_70() { assert_eq!(cost_cents(Some(5), Some(true)), 70); }

  #[test]
  fn audio_on_10s_is_140() { assert_eq!(cost_cents(Some(10), Some(true)), 140); }

  #[test]
  fn audio_default_is_on() {
    // None → audio defaults to true.
    assert_eq!(cost_cents(Some(5), None), cost_cents(Some(5), Some(true)));
  }
}

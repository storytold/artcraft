use fal_client::requests::webhook::video::image::enqueue_kling_v2p5_turbo_pro_image_to_video_webhook::EnqueueKlingV2p5TurboProImageToVideoDurationSeconds;
use fal_client::requests::webhook::video::text::enqueue_kling_v2p5_turbo_pro_text_to_video_webhook::EnqueueKlingV2p5TurboProTextToVideoDurationSeconds;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::fal::kling_2_5_turbo_pro::request::{
  FalKling2p5TurboProMode, FalKling2p5TurboProRequestState,
};

#[derive(Clone, Debug)]
pub struct FalKling2p5TurboProCostState {
  pub is_ten_seconds: bool,
}

impl FalKling2p5TurboProCostState {
  pub fn from_request(request: &FalKling2p5TurboProRequestState) -> Self {
    let is_ten_seconds = match &request.mode {
      FalKling2p5TurboProMode::TextToVideo(req) => {
        matches!(req.duration, Some(EnqueueKlingV2p5TurboProTextToVideoDurationSeconds::Ten))
      }
      FalKling2p5TurboProMode::ImageToVideo(req) => {
        matches!(req.duration, Some(EnqueueKlingV2p5TurboProImageToVideoDurationSeconds::Ten))
      }
    };
    Self { is_ten_seconds }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Mirrors fal_client kling_v2p5_turbo_pro: 5s = 35¢, 10s = 70¢. None → 5s.
    let cost_in_usd_cents: u64 = if self.is_ten_seconds { 70 } else { 35 };

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
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn cost_cents(duration_seconds: Option<u16>, has_start: bool) -> u64 {
    let mut b = GenerateVideoRequestBuilder {
      model: CommonVideoModel::Kling2p5TurboPro,
      provider: Provider::Fal,
      prompt: Some("test".to_string()),
      duration_seconds,
      ..Default::default()
    };
    if has_start {
      b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
    }
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn t2v_5s_is_35() { assert_eq!(cost_cents(Some(5), false), 35); }

  #[test]
  fn t2v_10s_is_70() { assert_eq!(cost_cents(Some(10), false), 70); }

  #[test]
  fn i2v_5s_is_35() { assert_eq!(cost_cents(Some(5), true), 35); }

  #[test]
  fn default_is_5s_priced_at_35() { assert_eq!(cost_cents(None, false), 35); }
}

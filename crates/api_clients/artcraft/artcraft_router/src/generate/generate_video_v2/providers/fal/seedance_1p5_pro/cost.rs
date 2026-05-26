use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests::webhook::video::text::enqueue_seedance_1p5_pro_text_to_video_webhook::{
  EnqueueSeedance1p5ProTextToVideoDuration, EnqueueSeedance1p5ProTextToVideoRequest,
  EnqueueSeedance1p5ProTextToVideoResolution,
};
use fal_client::requests::webhook::video::image::enqueue_seedance_1p5_pro_image_to_video_webhook::{
  EnqueueSeedance1p5ProImageToVideoDuration, EnqueueSeedance1p5ProImageToVideoResolution,
};

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::fal::seedance_1p5_pro::request::{
  FalSeedance1p5ProMode, FalSeedance1p5ProRequestState,
};

pub struct FalSeedance1p5ProCostState {
  request: FalSeedance1p5ProRequestState,
}

impl FalSeedance1p5ProCostState {
  pub fn from_request(request: &FalSeedance1p5ProRequestState) -> Self {
    Self { request: request.clone() }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Seedance 1.5 Pro t2v and i2v have identical pricing. v1 delegates both
    // to the t2v calculator; v2 does the same to guarantee billing parity.
    let t2v_request = match &self.request.mode {
      FalSeedance1p5ProMode::TextToVideo(req) => req.clone(),
      FalSeedance1p5ProMode::ImageToVideo(req) => EnqueueSeedance1p5ProTextToVideoRequest {
        prompt: String::new(),
        resolution: req.resolution.map(i2v_to_t2v_resolution),
        duration: req.duration.map(i2v_to_t2v_duration),
        aspect_ratio: None,
        generate_audio: req.generate_audio,
      },
    };

    let cost_in_usd_cents = t2v_request.calculate_cost_in_cents();

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

fn i2v_to_t2v_resolution(r: EnqueueSeedance1p5ProImageToVideoResolution) -> EnqueueSeedance1p5ProTextToVideoResolution {
  use EnqueueSeedance1p5ProImageToVideoResolution as I;
  use EnqueueSeedance1p5ProTextToVideoResolution as T;
  match r {
    I::FourEightyP => T::FourEightyP,
    I::SevenTwentyP => T::SevenTwentyP,
    I::TenEightyP => T::TenEightyP,
  }
}

fn i2v_to_t2v_duration(d: EnqueueSeedance1p5ProImageToVideoDuration) -> EnqueueSeedance1p5ProTextToVideoDuration {
  use EnqueueSeedance1p5ProImageToVideoDuration as I;
  use EnqueueSeedance1p5ProTextToVideoDuration as T;
  match d {
    I::FourSeconds => T::FourSeconds,
    I::FiveSeconds => T::FiveSeconds,
    I::SixSeconds => T::SixSeconds,
    I::SevenSeconds => T::SevenSeconds,
    I::EightSeconds => T::EightSeconds,
    I::NineSeconds => T::NineSeconds,
    I::TenSeconds => T::TenSeconds,
    I::ElevenSeconds => T::ElevenSeconds,
    I::TwelveSeconds => T::TwelveSeconds,
  }
}

use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests::webhook::video::text::enqueue_seedance_1p5_pro_text_to_video_webhook::{
  EnqueueSeedance1p5ProTextToVideoRequest, EnqueueSeedance1p5ProTextToVideoDuration,
  EnqueueSeedance1p5ProTextToVideoResolution,
};

use crate::generate::generate_video::plan::fal::plan_generate_video_fal_seedance_1p5_pro::{
  FalSeedance1p5ProDuration, FalSeedance1p5ProResolution, PlanFalSeedance1p5Pro,
};
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_fal_seedance_1p5_pro(
  plan: &PlanFalSeedance1p5Pro,
) -> VideoGenerationCostEstimate {
  // Seedance 1.5 Pro t2v and i2v have identical pricing; delegate to the t2v
  // calculator to guarantee parity with billing.
  let req = EnqueueSeedance1p5ProTextToVideoRequest {
    prompt: String::new(),
    resolution: plan.resolution.map(to_t2v_resolution),
    duration: plan.duration.map(to_t2v_duration),
    aspect_ratio: None,
    generate_audio: plan.generate_audio,
  };

  let cost_in_usd_cents = req.calculate_cost_in_cents();

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

fn to_t2v_resolution(r: FalSeedance1p5ProResolution) -> EnqueueSeedance1p5ProTextToVideoResolution {
  match r {
    FalSeedance1p5ProResolution::FourEightyP => EnqueueSeedance1p5ProTextToVideoResolution::FourEightyP,
    FalSeedance1p5ProResolution::SevenTwentyP => EnqueueSeedance1p5ProTextToVideoResolution::SevenTwentyP,
    FalSeedance1p5ProResolution::TenEightyP => EnqueueSeedance1p5ProTextToVideoResolution::TenEightyP,
  }
}

fn to_t2v_duration(d: FalSeedance1p5ProDuration) -> EnqueueSeedance1p5ProTextToVideoDuration {
  use EnqueueSeedance1p5ProTextToVideoDuration as T;
  match d {
    FalSeedance1p5ProDuration::Four => T::FourSeconds,
    FalSeedance1p5ProDuration::Five => T::FiveSeconds,
    FalSeedance1p5ProDuration::Six => T::SixSeconds,
    FalSeedance1p5ProDuration::Seven => T::SevenSeconds,
    FalSeedance1p5ProDuration::Eight => T::EightSeconds,
    FalSeedance1p5ProDuration::Nine => T::NineSeconds,
    FalSeedance1p5ProDuration::Ten => T::TenSeconds,
    FalSeedance1p5ProDuration::Eleven => T::ElevenSeconds,
    FalSeedance1p5ProDuration::Twelve => T::TwelveSeconds,
  }
}

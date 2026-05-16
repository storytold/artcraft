use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests::webhook::video::image::enqueue_seedance_1_lite_image_to_video_webhook::Seedance1LiteRequest;

use crate::generate::generate_video::plan::fal::plan_generate_video_fal_seedance_1_0_lite::PlanFalSeedance10Lite;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_fal_seedance_1_0_lite(
  plan: &PlanFalSeedance10Lite,
) -> VideoGenerationCostEstimate {
  // Delegate to the Fal client's cost calculator to guarantee parity with billing.
  let req = Seedance1LiteRequest {
    image_url: plan.image_url.clone(),
    end_frame_image_url: plan.end_image_url.clone(),
    prompt: plan.prompt.clone(),
    duration: plan.duration,
    resolution: plan.resolution,
    aspect_ratio: plan.aspect_ratio,
    camera_fixed: false,
    seed: None,
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

use fal_client::creds::fal_api_key::FalApiKey;
use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests::webhook::video::image::enqueue_seedance_1_lite_image_to_video_webhook::Seedance1LiteArgs;

use crate::generate::generate_video::plan::fal::plan_generate_video_fal_seedance_1_0_lite::PlanFalSeedance10Lite;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_fal_seedance_1_0_lite(
  plan: &PlanFalSeedance10Lite,
) -> VideoGenerationCostEstimate {
  // Delegate to the Fal client's cost calculator to guarantee parity with billing.
  let api_key = FalApiKey::from_str("");
  let end_frame: Option<&str> = plan.end_image_url.as_deref();
  let args = Seedance1LiteArgs {
    image_url: plan.image_url.as_str(),
    end_frame_image_url: end_frame,
    prompt: plan.prompt.as_str(),
    duration: plan.duration,
    resolution: plan.resolution,
    aspect_ratio: plan.aspect_ratio,
    camera_fixed: false,
    seed: None,
    api_key: &api_key,
    webhook_url: "https://example.com",
  };

  let cost_in_usd_cents = args.calculate_cost_in_cents();

  VideoGenerationCostEstimate {
    cost_in_credits: Some(cost_in_usd_cents),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
  }
}

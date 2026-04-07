use artcraft_api_defs::generate::video::generate_seedance_1_0_lite_image_to_video::GenerateSeedance10LiteResolution;
use fal_client::creds::fal_api_key::FalApiKey;
use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests::webhook::video::image::enqueue_seedance_1_lite_image_to_video_webhook::{
  Seedance1LiteArgs, Seedance1LiteDuration, Seedance1LiteResolution,
};

use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance_1_0_lite::PlanArtcraftSeedance10Lite;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_artcraft_seedance_1_0_lite(
  plan: &PlanArtcraftSeedance10Lite<'_>,
) -> VideoGenerationCostEstimate {
  // Legacy handler defaults: 5 seconds, 720p. Delegate to the Fal client's
  // cost calculator to guarantee parity with what we actually charge.
  let api_key = FalApiKey::from_str("");
  let duration = if plan.duration_seconds_for_cost() == 10 {
    Seedance1LiteDuration::TenSeconds
  } else {
    Seedance1LiteDuration::FiveSeconds
  };
  let resolution = match plan.resolution_for_cost() {
    GenerateSeedance10LiteResolution::FourEightyP => Seedance1LiteResolution::FourEightyP,
    GenerateSeedance10LiteResolution::SevenTwentyP => Seedance1LiteResolution::SevenTwentyP,
  };

  let end_frame: Option<&str> = None;
  let args = Seedance1LiteArgs {
    image_url: "",
    end_frame_image_url: end_frame,
    prompt: "",
    duration,
    resolution,
    aspect_ratio: None,
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

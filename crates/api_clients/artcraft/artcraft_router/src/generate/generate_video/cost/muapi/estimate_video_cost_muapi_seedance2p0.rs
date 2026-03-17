use crate::generate::generate_video::plan::muapi::plan_generate_video_muapi_seedance2p0::{
  MuapiSeedance2p0Mode, PlanMuapiSeedance2p0,
};
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use muapi_client::creds::muapi_api_key::MuapiApiKey;
use muapi_client::creds::muapi_session::MuapiSession;
use muapi_client::requests::seedance_2p0_image_to_video::seedance_2p0_image_to_video::Seedance2p0ImageToVideoArgs;
use muapi_client::requests::seedance_2p0_text_to_video::seedance_2p0_text_to_video::Seedance2p0TextToVideoArgs;

pub(crate) fn estimate_video_cost_muapi_seedance2p0(
  plan: &PlanMuapiSeedance2p0,
) -> VideoGenerationCostEstimate {
  // A dummy session is sufficient — cost estimation does not make any network calls.
  let dummy_session = MuapiSession::new(MuapiApiKey::new(String::new()));

  let cost_in_usd_cents;
  let cost_in_credits;

  match &plan.mode {
    MuapiSeedance2p0Mode::TextToVideo { aspect_ratio, duration, quality } => {
      let args = Seedance2p0TextToVideoArgs {
        session: &dummy_session,
        prompt: String::new(),
        aspect_ratio: *aspect_ratio,
        duration: *duration,
        quality: *quality,
      };

      cost_in_usd_cents = args.estimate_cost_in_usd_cents();

      // NB: This is off by a factor of 100 because they use a fractional system.
      cost_in_credits = (args.estimate_credits() * 100.0f64).round() as u64;
    }
    MuapiSeedance2p0Mode::ImageToVideo { aspect_ratio, duration, quality, .. } => {
      let args = Seedance2p0ImageToVideoArgs {
        session: &dummy_session,
        prompt: String::new(),
        image_urls: vec![],
        aspect_ratio: *aspect_ratio,
        duration: *duration,
        quality: *quality,
      };

      cost_in_usd_cents = args.estimate_cost_in_usd_cents();

      // NB: This is off by a factor of 100 because they use a fractional system.
      cost_in_credits = (args.estimate_credits() * 100.0f64).round() as u64;
    }
  }

  VideoGenerationCostEstimate {
    cost_in_credits: Some(cost_in_credits),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
  }
}

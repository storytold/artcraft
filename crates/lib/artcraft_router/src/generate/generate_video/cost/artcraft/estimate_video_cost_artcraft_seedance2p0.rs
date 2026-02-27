use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::Seedance2p0BatchCount;
use seedance2pro::creds::seedance2pro_session::Seedance2ProSession;
use seedance2pro::requests::generate_video::generate_video::{BatchCount, GenerateVideoArgs, Resolution};

use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance2p0::PlanArtcraftSeedance2p0;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub fn estimate_video_cost_artcraft_seedance2p0(
  plan: &PlanArtcraftSeedance2p0<'_>,
) -> VideoGenerationCostEstimate {
  let duration_seconds = plan.duration_seconds.unwrap_or(5).clamp(4, 15);

  let batch_count = match plan.batch_count {
    Seedance2p0BatchCount::One => BatchCount::One,
    Seedance2p0BatchCount::Two => BatchCount::Two,
    Seedance2p0BatchCount::Four => BatchCount::Four,
  };

  // TODO: Make a better client that doesn't require this.
  // A dummy session is sufficient — cost estimation does not make any network calls.
  let dummy_session = Seedance2ProSession::from_cookies_string(String::new());

  let args = GenerateVideoArgs {
    session: &dummy_session,
    prompt: String::new(),
    resolution: Resolution::Square1x1,
    duration_seconds,
    batch_count,
    start_frame_url: None,
    end_frame_url: None,
    reference_image_urls: None,
  };

  let cost_in_usd_cents = args.estimate_cost_in_usd_cents();

  VideoGenerationCostEstimate {
    cost_in_credits: Some(cost_in_usd_cents),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
  }
}

use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;
use seedance2pro_client::requests::generate_video::generate_video::{GenerateVideoArgs, ModelType, Resolution};

use crate::generate::generate_video::plan::seedance2pro::plan_generate_video_seedance2pro_seedance2p0::PlanSeedance2proSeedance2p0;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_seedance2pro_seedance2p0(
  plan: &PlanSeedance2proSeedance2p0,
) -> VideoGenerationCostEstimate {
  // A dummy session is sufficient — cost estimation does not make any network calls.
  let dummy_session = Seedance2ProSession::from_cookies_string(String::new());

  let args = GenerateVideoArgs {
    session: &dummy_session,
    model_type: ModelType::Seedance2Pro,
    prompt: String::new(),
    resolution: Resolution::Square1x1, // Resolution does not affect cost
    duration_seconds: plan.duration_seconds,
    batch_count: plan.batch_count,
    start_frame_url: None,
    end_frame_url: None,
    reference_image_urls: None,
    reference_video_urls: None,
    reference_audio_urls: None,
    use_face_blur_hack: None,
    host_override: None,
  };

  let cost_in_credits = args.estimate_credits();
  let cost_in_usd_cents = args.estimate_cost_in_usd_cents();

  VideoGenerationCostEstimate {
    cost_in_credits: Some(cost_in_credits as u64),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
  }
}

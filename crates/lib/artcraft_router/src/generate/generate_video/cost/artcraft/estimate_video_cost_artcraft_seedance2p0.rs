use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::Seedance2p0BatchCount;
use seedance2pro::creds::seedance2pro_session::Seedance2ProSession;
use seedance2pro::requests::generate_video::generate_video::{BatchCount, GenerateVideoArgs, Resolution};

use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance2p0::PlanArtcraftSeedance2p0;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub (crate) fn estimate_video_cost_artcraft_seedance2p0(
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

    // NB: These do not contribute to costs in the Seedance2 integration
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

#[cfg(test)]
mod tests {
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_video::begin_video_generation::begin_video_generation;
  use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;

  fn estimate_usd_cents(duration_seconds: u16, video_batch_count: u16) -> u64 {
    let request = GenerateVideoRequest {
      model: CommonVideoModel::Seedance2p0,
      provider: Provider::Artcraft,
      prompt: None,
      start_frame: None,
      end_frame: None,
      reference_images: None,
      resolution: None,
      aspect_ratio: None,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(video_batch_count),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      idempotency_token: None,
    };
    begin_video_generation(&request)
      .expect("begin_video_generation should succeed")
      .estimate_costs()
      .cost_in_usd_cents
      .expect("cost_in_usd_cents should be present")
  }

  #[test]
  fn test_estimate_cost_usd_cents() {
    // Batch 1:
    assert_eq!(estimate_usd_cents(4, 1), 64);
    assert_eq!(estimate_usd_cents(5, 1), 80);
    assert_eq!(estimate_usd_cents(6, 1), 96);
    assert_eq!(estimate_usd_cents(7, 1), 112);
    assert_eq!(estimate_usd_cents(15, 1), 240);

    // Batch 2 = 2×
    assert_eq!(estimate_usd_cents(4, 2), 128);
    assert_eq!(estimate_usd_cents(5, 2), 160);
    assert_eq!(estimate_usd_cents(15, 2), 480);

    // Batch 4 = 3× (not 4×)
    assert_eq!(estimate_usd_cents(4, 4), 192);
    assert_eq!(estimate_usd_cents(5, 4), 240);
    assert_eq!(estimate_usd_cents(15, 4), 720);
  }
}

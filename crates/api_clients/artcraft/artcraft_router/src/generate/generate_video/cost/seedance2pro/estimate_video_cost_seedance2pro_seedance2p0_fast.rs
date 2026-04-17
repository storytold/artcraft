use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;
use seedance2pro_client::requests::generate_video::generate_video::{GenerateVideoArgs, KinoviModelType, KinoviResolution};

use crate::generate::generate_video::plan::seedance2pro::plan_generate_video_seedance2pro_seedance2p0_fast::PlanSeedance2proSeedance2p0Fast;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_seedance2pro_seedance2p0_fast(
  plan: &PlanSeedance2proSeedance2p0Fast,
) -> VideoGenerationCostEstimate {
  // A dummy session is sufficient — cost estimation does not make any network calls.
  let dummy_session = Seedance2ProSession::from_cookies_string(String::new());

  let args = GenerateVideoArgs {
    session: &dummy_session,
    model_type: KinoviModelType::Seedance2Fast, // <-- Fast, not Pro
    prompt: String::new(),
    resolution: KinoviResolution::Square1x1, // Resolution does not affect cost
    duration_seconds: plan.duration_seconds,
    batch_count: plan.batch_count,
    start_frame_url: None,
    end_frame_url: None,
    reference_image_urls: None,
    reference_video_urls: None,
    reference_audio_urls: None,
    character_ids: None,
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

#[cfg(test)]
mod tests {
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;

  fn estimate_usd_cents(duration_seconds: u16, video_batch_count: u16) -> u64 {
    let request = GenerateVideoRequest {
      model: CommonVideoModel::Seedance2p0Fast,
      provider: Provider::Seedance2Pro,
      prompt: None,
      negative_prompt: None,
      start_frame: None,
      end_frame: None,
      reference_images: None,
      reference_videos: None,
      reference_audio: None,
      reference_character_tokens: None,
      resolution: None,
      aspect_ratio: None,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(video_batch_count),
      generate_audio: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
      idempotency_token: None,
    };
    request.build()
      .expect("build should succeed")
      .estimate_costs()
      .cost_in_usd_cents
      .expect("cost_in_usd_cents should be present")
  }

  #[test]
  fn cost_is_present() {
    let cents = estimate_usd_cents(5, 1);
    assert!(cents > 0);
  }

  #[test]
  fn cost_batch_1() {
    // Seedance2Fast: 28 credits/sec, 220 credits/$1 (with rounding)
    assert_eq!(estimate_usd_cents(4, 1), 51);
    assert_eq!(estimate_usd_cents(5, 1), 64);
    assert_eq!(estimate_usd_cents(10, 1), 127);
    assert_eq!(estimate_usd_cents(15, 1), 191);
  }

  #[test]
  fn cost_batch_2() {
    assert_eq!(estimate_usd_cents(5, 2), 127);
  }

  #[test]
  fn cost_batch_4() {
    assert_eq!(estimate_usd_cents(5, 4), 255);
  }

  #[test]
  fn fast_is_cheaper_than_pro() {
    let fast = estimate_usd_cents(5, 1);

    let pro_request = GenerateVideoRequest {
      model: CommonVideoModel::Seedance2p0,
      provider: Provider::Seedance2Pro,
      prompt: None,
      negative_prompt: None,
      start_frame: None,
      end_frame: None,
      reference_images: None,
      reference_videos: None,
      reference_audio: None,
      reference_character_tokens: None,
      resolution: None,
      aspect_ratio: None,
      duration_seconds: Some(5),
      video_batch_count: Some(1),
      generate_audio: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
      idempotency_token: None,
    };
    let pro = pro_request.build().unwrap().estimate_costs().cost_in_usd_cents.unwrap();

    assert!(fast < pro, "Fast ({}) should be cheaper than Pro ({})", fast, pro);
  }
}

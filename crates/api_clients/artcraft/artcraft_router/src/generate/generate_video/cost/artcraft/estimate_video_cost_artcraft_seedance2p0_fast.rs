use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::Seedance2p0BatchCount;
use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;
use seedance2pro_client::requests::generate_video::generate_video::{KinoviBatchCount, GenerateVideoArgs, KinoviModelType, KinoviResolution};

use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance2p0::PlanArtcraftSeedance2p0;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_artcraft_seedance2p0_fast(
  plan: &PlanArtcraftSeedance2p0,
) -> VideoGenerationCostEstimate {
  let duration_seconds = plan.duration_seconds.unwrap_or(5).clamp(4, 15);

  let batch_count = match plan.batch_count {
    Seedance2p0BatchCount::One => KinoviBatchCount::One,
    Seedance2p0BatchCount::Two => KinoviBatchCount::Two,
    Seedance2p0BatchCount::Four => KinoviBatchCount::Four,
  };

  let dummy_session = Seedance2ProSession::from_cookies_string(String::new());

  let args = GenerateVideoArgs {
    session: &dummy_session,
    model_type: KinoviModelType::Seedance2Fast, // <-- Fast, not Pro
    prompt: String::new(),
    resolution: KinoviResolution::Square1x1,
    duration_seconds,
    batch_count,
    start_frame_url: None,
    end_frame_url: None,
    reference_image_urls: None,
    reference_video_urls: None,
    reference_audio_urls: None,
    character_ids: None,
    use_face_blur_hack: None,
    host_override: None,
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
  use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;

  fn estimate_usd_cents(duration_seconds: u16, video_batch_count: u16) -> u64 {
    let request = GenerateVideoRequest {
      model: CommonVideoModel::Seedance2p0Fast,
      provider: Provider::Artcraft,
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
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      idempotency_token: None,
    };
    request.build()
      .expect("build should succeed")
      .estimate_costs()
      .cost_in_usd_cents
      .expect("cost_in_usd_cents should be present")
  }

  fn estimate_pro_usd_cents(duration_seconds: u16, video_batch_count: u16) -> u64 {
    let request = GenerateVideoRequest {
      model: CommonVideoModel::Seedance2p0,
      provider: Provider::Artcraft,
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
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
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
    assert!(estimate_usd_cents(5, 1) > 0);
  }

  #[test]
  fn cost_batch_1() {
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
    for duration in [4, 5, 10, 15] {
      let fast = estimate_usd_cents(duration, 1);
      let pro = estimate_pro_usd_cents(duration, 1);
      assert!(
        fast < pro,
        "Fast ({}) should be cheaper than Pro ({}) at {}s",
        fast, pro, duration,
      );
    }
  }

  #[test]
  fn cost_scales_with_duration() {
    let c4 = estimate_usd_cents(4, 1);
    let c10 = estimate_usd_cents(10, 1);
    let c15 = estimate_usd_cents(15, 1);
    assert!(c4 < c10);
    assert!(c10 < c15);
  }

  #[test]
  fn cost_scales_with_batch() {
    let b1 = estimate_usd_cents(5, 1);
    let b2 = estimate_usd_cents(5, 2);
    let b4 = estimate_usd_cents(5, 4);
    assert!(b1 < b2);
    assert!(b2 < b4);
  }
}

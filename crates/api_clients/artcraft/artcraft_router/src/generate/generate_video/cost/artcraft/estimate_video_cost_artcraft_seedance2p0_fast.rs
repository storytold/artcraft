use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::Seedance2p0BatchCount;
use seedance2pro_client::requests::generate_video::generate_video::{GenerateVideoRequest, KinoviBatchCount, KinoviModelType, KinoviOutputResolution, KinoviAspectRatio};

use crate::api::common_resolution::CommonResolution;
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

  let output_resolution = plan.resolution.map(map_common_resolution_to_kinovi);

  let request = GenerateVideoRequest {
    model_type: KinoviModelType::Seedance2Fast,
    prompt: String::new(),
    aspect_ratio: KinoviAspectRatio::Square1x1,
    duration_seconds,
    batch_count,
    output_resolution,

    // TODO: This is a cost factor
    reference_video_urls: None,
    
    // NB: These do not contribute to costs in the Seedance2 integration
    start_frame_url: None,
    end_frame_url: None,
    reference_image_urls: None,
    reference_audio_urls: None,
    character_ids: None,
    use_face_blur_hack: None,
  };

  let cost_in_usd_cents = request.estimate_cost_in_usd_cents();

  VideoGenerationCostEstimate {
    cost_in_credits: Some(cost_in_usd_cents),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
  }
}

fn map_common_resolution_to_kinovi(resolution: CommonResolution) -> KinoviOutputResolution {
  match resolution {
    CommonResolution::FourEightyP => KinoviOutputResolution::FourEightyP,
    CommonResolution::SevenTwentyP => KinoviOutputResolution::SevenTwentyP,
    CommonResolution::TenEightyP => KinoviOutputResolution::TenEightyP,
    // For resolutions that don't map directly, default to 720p
    _ => KinoviOutputResolution::SevenTwentyP,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_resolution::CommonResolution;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;

  fn estimate_usd_cents(
    duration_seconds: u16,
    video_batch_count: u16,
    resolution: Option<CommonResolution>,
  ) -> u64 {
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
      resolution,
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

  fn estimate_usd_cents_downgrade(
    duration_seconds: u16,
    video_batch_count: u16,
    resolution: Option<CommonResolution>,
  ) -> u64 {
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
      resolution,
      aspect_ratio: None,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(video_batch_count),
      generate_audio: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayLessDowngrade,
      idempotency_token: None,
    };
    request.build()
      .expect("build should succeed")
      .estimate_costs()
      .cost_in_usd_cents
      .expect("cost_in_usd_cents should be present")
  }

  fn estimate_pro_usd_cents(
    duration_seconds: u16,
    video_batch_count: u16,
    resolution: Option<CommonResolution>,
  ) -> u64 {
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
      resolution,
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

  // -- 720p (default / legacy pricing: 220 credits/$1) --

  #[test]
  fn fast_720p_batch_1() {
    assert_eq!(estimate_usd_cents(4, 1, Some(CommonResolution::SevenTwentyP)), 51);
    assert_eq!(estimate_usd_cents(5, 1, Some(CommonResolution::SevenTwentyP)), 64);
    assert_eq!(estimate_usd_cents(10, 1, Some(CommonResolution::SevenTwentyP)), 127);
    assert_eq!(estimate_usd_cents(15, 1, Some(CommonResolution::SevenTwentyP)), 191);
  }

  #[test]
  fn fast_720p_batch_2() {
    assert_eq!(estimate_usd_cents(5, 2, Some(CommonResolution::SevenTwentyP)), 127);
  }

  #[test]
  fn fast_720p_batch_4() {
    assert_eq!(estimate_usd_cents(5, 4, Some(CommonResolution::SevenTwentyP)), 255);
  }

  #[test]
  fn fast_none_resolution_same_as_720p() {
    assert_eq!(
      estimate_usd_cents(5, 1, None),
      estimate_usd_cents(5, 1, Some(CommonResolution::SevenTwentyP)),
    );
  }

  // -- 480p (new pricing: 193 credits/$1) --

  #[test]
  fn fast_480p_batch_1() {
    assert_eq!(estimate_usd_cents(4, 1, Some(CommonResolution::FourEightyP)), 21);
    assert_eq!(estimate_usd_cents(5, 1, Some(CommonResolution::FourEightyP)), 26);
    assert_eq!(estimate_usd_cents(10, 1, Some(CommonResolution::FourEightyP)), 52);
    assert_eq!(estimate_usd_cents(15, 1, Some(CommonResolution::FourEightyP)), 78);
  }

  #[test]
  fn fast_480p_batch_2() {
    assert_eq!(estimate_usd_cents(5, 2, Some(CommonResolution::FourEightyP)), 52);
  }

  #[test]
  fn fast_480p_batch_4() {
    assert_eq!(estimate_usd_cents(5, 4, Some(CommonResolution::FourEightyP)), 104);
  }

  // -- 1080p is not supported by Fast; ErrorOut rejects it --

  #[test]
  fn fast_1080p_error_out_rejects() {
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
      resolution: Some(CommonResolution::TenEightyP),
      aspect_ratio: None,
      duration_seconds: Some(5),
      video_batch_count: Some(1),
      generate_audio: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      idempotency_token: None,
    };
    assert!(request.build().is_err());
  }

  // -- 1080p rounds down to 720p with PayLessDowngrade --

  #[test]
  fn fast_1080p_downgraded_same_as_720p() {
    for duration in [4, 5, 10, 15] {
      assert_eq!(
        estimate_usd_cents_downgrade(duration, 1, Some(CommonResolution::TenEightyP)),
        estimate_usd_cents(duration, 1, Some(CommonResolution::SevenTwentyP)),
      );
    }
  }

  // -- Relative pricing --

  #[test]
  fn fast_480p_cheaper_than_720p() {
    let c480 = estimate_usd_cents(5, 1, Some(CommonResolution::FourEightyP));
    let c720 = estimate_usd_cents(5, 1, Some(CommonResolution::SevenTwentyP));
    assert!(c480 < c720, "480p ({}) should be cheaper than 720p ({})", c480, c720);
  }

  #[test]
  fn fast_is_cheaper_than_pro() {
    for res in [
      Some(CommonResolution::FourEightyP),
      Some(CommonResolution::SevenTwentyP),
    ] {
      for duration in [4, 5, 10, 15] {
        let fast = estimate_usd_cents(duration, 1, res);
        let pro = estimate_pro_usd_cents(duration, 1, res);
        assert!(
          fast < pro,
          "Fast ({}) should be cheaper than Pro ({}) at {}s {:?}",
          fast, pro, duration, res,
        );
      }
    }
  }

  #[test]
  fn cost_scales_with_duration() {
    let c4 = estimate_usd_cents(4, 1, Some(CommonResolution::SevenTwentyP));
    let c10 = estimate_usd_cents(10, 1, Some(CommonResolution::SevenTwentyP));
    let c15 = estimate_usd_cents(15, 1, Some(CommonResolution::SevenTwentyP));
    assert!(c4 < c10);
    assert!(c10 < c15);
  }

  #[test]
  fn cost_scales_with_batch() {
    let b1 = estimate_usd_cents(5, 1, Some(CommonResolution::SevenTwentyP));
    let b2 = estimate_usd_cents(5, 2, Some(CommonResolution::SevenTwentyP));
    let b4 = estimate_usd_cents(5, 4, Some(CommonResolution::SevenTwentyP));
    assert!(b1 < b2);
    assert!(b2 < b4);
  }
}

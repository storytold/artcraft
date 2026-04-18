use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::Seedance2p0BatchCount;
use seedance2pro_client::requests::generate_video::generate_video::{GenerateVideoRequest, KinoviBatchCount, KinoviModelType, KinoviOutputResolution, KinoviAspectRatio};

use crate::api::common_resolution::CommonResolution;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance2p0::PlanArtcraftSeedance2p0;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub (crate) fn estimate_video_cost_artcraft_seedance2p0(
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
    model_type: KinoviModelType::Seedance2Pro,
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

  // -- 720p (default / legacy pricing: 250 credits/$1) --

  #[test]
  fn pro_720p_batch_1() {
    assert_eq!(estimate_usd_cents(4, 1, Some(CommonResolution::SevenTwentyP)), 64);
    assert_eq!(estimate_usd_cents(5, 1, Some(CommonResolution::SevenTwentyP)), 80);
    assert_eq!(estimate_usd_cents(6, 1, Some(CommonResolution::SevenTwentyP)), 96);
    assert_eq!(estimate_usd_cents(7, 1, Some(CommonResolution::SevenTwentyP)), 112);
    assert_eq!(estimate_usd_cents(15, 1, Some(CommonResolution::SevenTwentyP)), 240);
  }

  #[test]
  fn pro_720p_batch_2() {
    assert_eq!(estimate_usd_cents(4, 2, Some(CommonResolution::SevenTwentyP)), 128);
    assert_eq!(estimate_usd_cents(5, 2, Some(CommonResolution::SevenTwentyP)), 160);
    assert_eq!(estimate_usd_cents(15, 2, Some(CommonResolution::SevenTwentyP)), 480);
  }

  #[test]
  fn pro_720p_batch_4() {
    assert_eq!(estimate_usd_cents(4, 4, Some(CommonResolution::SevenTwentyP)), 256);
    assert_eq!(estimate_usd_cents(5, 4, Some(CommonResolution::SevenTwentyP)), 320);
    assert_eq!(estimate_usd_cents(15, 4, Some(CommonResolution::SevenTwentyP)), 960);
  }

  #[test]
  fn pro_none_resolution_same_as_720p() {
    assert_eq!(
      estimate_usd_cents(5, 1, None),
      estimate_usd_cents(5, 1, Some(CommonResolution::SevenTwentyP)),
    );
  }

  // -- 480p (new pricing: 193 credits/$1) --

  #[test]
  fn pro_480p_batch_1() {
    assert_eq!(estimate_usd_cents(4, 1, Some(CommonResolution::FourEightyP)), 31);
    assert_eq!(estimate_usd_cents(5, 1, Some(CommonResolution::FourEightyP)), 39);
    assert_eq!(estimate_usd_cents(10, 1, Some(CommonResolution::FourEightyP)), 78);
    assert_eq!(estimate_usd_cents(15, 1, Some(CommonResolution::FourEightyP)), 117);
  }

  #[test]
  fn pro_480p_batch_2() {
    assert_eq!(estimate_usd_cents(5, 2, Some(CommonResolution::FourEightyP)), 78);
  }

  #[test]
  fn pro_480p_batch_4() {
    assert_eq!(estimate_usd_cents(5, 4, Some(CommonResolution::FourEightyP)), 155);
  }

  // -- 1080p (new pricing: 193 credits/$1) --

  #[test]
  fn pro_1080p_batch_1() {
    assert_eq!(estimate_usd_cents(4, 1, Some(CommonResolution::TenEightyP)), 187);
    assert_eq!(estimate_usd_cents(5, 1, Some(CommonResolution::TenEightyP)), 233);
    assert_eq!(estimate_usd_cents(10, 1, Some(CommonResolution::TenEightyP)), 466);
    assert_eq!(estimate_usd_cents(15, 1, Some(CommonResolution::TenEightyP)), 699);
  }

  #[test]
  fn pro_1080p_batch_2() {
    assert_eq!(estimate_usd_cents(5, 2, Some(CommonResolution::TenEightyP)), 466);
  }

  #[test]
  fn pro_1080p_batch_4() {
    assert_eq!(estimate_usd_cents(5, 4, Some(CommonResolution::TenEightyP)), 933);
  }

  // -- Relative pricing --

  #[test]
  fn pro_480p_cheaper_than_720p_cheaper_than_1080p() {
    let c480 = estimate_usd_cents(5, 1, Some(CommonResolution::FourEightyP));
    let c720 = estimate_usd_cents(5, 1, Some(CommonResolution::SevenTwentyP));
    let c1080 = estimate_usd_cents(5, 1, Some(CommonResolution::TenEightyP));
    assert!(c480 < c720, "480p ({}) should be cheaper than 720p ({})", c480, c720);
    assert!(c720 < c1080, "720p ({}) should be cheaper than 1080p ({})", c720, c1080);
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
    let b1 = estimate_usd_cents(5, 1, Some(CommonResolution::TenEightyP));
    let b2 = estimate_usd_cents(5, 2, Some(CommonResolution::TenEightyP));
    let b4 = estimate_usd_cents(5, 4, Some(CommonResolution::TenEightyP));
    assert!(b1 < b2);
    assert!(b2 < b4);
  }
}

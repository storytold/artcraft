use crate::generate::generate_video::plan::seedance2pro::plan_generate_video_seedance2pro_seedance2p0_fast::PlanSeedance2proSeedance2p0Fast;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_seedance2pro_seedance2p0_fast(
  plan: &PlanSeedance2proSeedance2p0Fast,
) -> VideoGenerationCostEstimate {
  let cost_in_credits = plan.request.estimate_credits();
  let cost_in_usd_cents = plan.request.estimate_cost_in_usd_cents();

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
  use crate::api::common_resolution::CommonResolution;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn estimate_usd_cents(
    duration_seconds: u16,
    video_batch_count: u16,
    resolution: Option<CommonResolution>,
  ) -> u64 {
    let request = GenerateVideoRequestBuilder {
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
      resolution,
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

  fn estimate_pro_usd_cents(
    duration_seconds: u16,
    video_batch_count: u16,
    resolution: Option<CommonResolution>,
  ) -> u64 {
    let request = GenerateVideoRequestBuilder {
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
      resolution,
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

  // -- 1080p maps to 720p for Fast (Kinovi doesn't support 1080p fast) --

  #[test]
  fn fast_1080p_same_as_720p() {
    for duration in [4, 5, 10, 15] {
      assert_eq!(
        estimate_usd_cents(duration, 1, Some(CommonResolution::TenEightyP)),
        estimate_usd_cents(duration, 1, Some(CommonResolution::SevenTwentyP)),
      );
    }
  }

  #[test]
  fn fast_1080p_batch_2() {
    assert_eq!(
      estimate_usd_cents(5, 2, Some(CommonResolution::TenEightyP)),
      estimate_usd_cents(5, 2, Some(CommonResolution::SevenTwentyP)),
    );
  }

  #[test]
  fn fast_1080p_batch_4() {
    assert_eq!(
      estimate_usd_cents(5, 4, Some(CommonResolution::TenEightyP)),
      estimate_usd_cents(5, 4, Some(CommonResolution::SevenTwentyP)),
    );
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
      Some(CommonResolution::TenEightyP),
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
    let b1 = estimate_usd_cents(5, 1, Some(CommonResolution::TenEightyP));
    let b2 = estimate_usd_cents(5, 2, Some(CommonResolution::TenEightyP));
    let b4 = estimate_usd_cents(5, 4, Some(CommonResolution::TenEightyP));
    assert!(b1 < b2);
    assert!(b2 < b4);
  }
}

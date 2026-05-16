use artcraft_api_defs::generate::video::multi_function::kling_3p0_standard_multi_function_video_gen::Kling3p0StandardMultiFunctionVideoGenDuration;
use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests::webhook::video::text::enqueue_kling_3p0_standard_text_to_video_webhook::{
  EnqueueKling3p0StandardTextToVideoRequest,
  EnqueueKling3p0StandardTextToVideoDuration,
};

use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_kling3p0_standard::PlanArtcraftKling3p0Standard;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_artcraft_kling3p0_standard(
  plan: &PlanArtcraftKling3p0Standard,
) -> VideoGenerationCostEstimate {
  let duration = plan.duration
      .map(|d| match d {
        Kling3p0StandardMultiFunctionVideoGenDuration::ThreeSeconds => EnqueueKling3p0StandardTextToVideoDuration::ThreeSeconds,
        Kling3p0StandardMultiFunctionVideoGenDuration::FourSeconds => EnqueueKling3p0StandardTextToVideoDuration::FourSeconds,
        Kling3p0StandardMultiFunctionVideoGenDuration::FiveSeconds => EnqueueKling3p0StandardTextToVideoDuration::FiveSeconds,
        Kling3p0StandardMultiFunctionVideoGenDuration::SixSeconds => EnqueueKling3p0StandardTextToVideoDuration::SixSeconds,
        Kling3p0StandardMultiFunctionVideoGenDuration::SevenSeconds => EnqueueKling3p0StandardTextToVideoDuration::SevenSeconds,
        Kling3p0StandardMultiFunctionVideoGenDuration::EightSeconds => EnqueueKling3p0StandardTextToVideoDuration::EightSeconds,
        Kling3p0StandardMultiFunctionVideoGenDuration::NineSeconds => EnqueueKling3p0StandardTextToVideoDuration::NineSeconds,
        Kling3p0StandardMultiFunctionVideoGenDuration::TenSeconds => EnqueueKling3p0StandardTextToVideoDuration::TenSeconds,
        Kling3p0StandardMultiFunctionVideoGenDuration::ElevenSeconds => EnqueueKling3p0StandardTextToVideoDuration::ElevenSeconds,
        Kling3p0StandardMultiFunctionVideoGenDuration::TwelveSeconds => EnqueueKling3p0StandardTextToVideoDuration::TwelveSeconds,
        Kling3p0StandardMultiFunctionVideoGenDuration::ThirteenSeconds => EnqueueKling3p0StandardTextToVideoDuration::ThirteenSeconds,
        Kling3p0StandardMultiFunctionVideoGenDuration::FourteenSeconds => EnqueueKling3p0StandardTextToVideoDuration::FourteenSeconds,
        Kling3p0StandardMultiFunctionVideoGenDuration::FifteenSeconds => EnqueueKling3p0StandardTextToVideoDuration::FifteenSeconds,
      });

  // Use text-to-video cost calculator (same pricing for both modes)
  let req = EnqueueKling3p0StandardTextToVideoRequest {
    prompt: String::new(),
    generate_audio: plan.generate_audio,
    negative_prompt: None,
    duration,
    aspect_ratio: None,
    shot_type: None,
  };

  let cost_in_usd_cents = req.calculate_cost_in_cents();

  VideoGenerationCostEstimate {
    cost_in_credits: Some(cost_in_usd_cents),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
    failures_are_refunded: None,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn estimate_usd_cents(duration_seconds: u16) -> u64 {
    let request = GenerateVideoRequestBuilder {
      model: CommonVideoModel::Kling3p0Standard,
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
      video_batch_count: None,
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
  fn test_estimate_cost_usd_cents() {
    // Kling 3.0 Standard: $0.252/sec (audio on, the default when None)
    // Formula: (252 * duration_secs + 9) / 10 → ceiling division
    // 5s: (252 * 5 + 9) / 10 = 1269 / 10 = 126
    assert_eq!(estimate_usd_cents(5), 126);
    // 10s: (252 * 10 + 9) / 10 = 2529 / 10 = 252
    assert_eq!(estimate_usd_cents(10), 252);
    // 15s: (252 * 15 + 9) / 10 = 3789 / 10 = 378
    assert_eq!(estimate_usd_cents(15), 378);
  }
}

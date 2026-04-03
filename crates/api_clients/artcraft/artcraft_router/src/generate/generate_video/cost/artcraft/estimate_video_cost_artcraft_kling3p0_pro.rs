use artcraft_api_defs::generate::video::multi_function::kling_3p0_pro_multi_function_video_gen::Kling3p0ProMultiFunctionVideoGenDuration;
use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests::webhook::video::text::enqueue_kling_3p0_pro_text_to_video_webhook::{
  EnqueueKling3p0ProTextToVideoArgs,
  EnqueueKling3p0ProTextToVideoDuration,
};

use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_kling3p0_pro::PlanArtcraftKling3p0Pro;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_artcraft_kling3p0_pro(
  plan: &PlanArtcraftKling3p0Pro<'_>,
) -> VideoGenerationCostEstimate {
  let duration = plan.duration
      .map(|d| match d {
        Kling3p0ProMultiFunctionVideoGenDuration::ThreeSeconds => EnqueueKling3p0ProTextToVideoDuration::ThreeSeconds,
        Kling3p0ProMultiFunctionVideoGenDuration::FourSeconds => EnqueueKling3p0ProTextToVideoDuration::FourSeconds,
        Kling3p0ProMultiFunctionVideoGenDuration::FiveSeconds => EnqueueKling3p0ProTextToVideoDuration::FiveSeconds,
        Kling3p0ProMultiFunctionVideoGenDuration::SixSeconds => EnqueueKling3p0ProTextToVideoDuration::SixSeconds,
        Kling3p0ProMultiFunctionVideoGenDuration::SevenSeconds => EnqueueKling3p0ProTextToVideoDuration::SevenSeconds,
        Kling3p0ProMultiFunctionVideoGenDuration::EightSeconds => EnqueueKling3p0ProTextToVideoDuration::EightSeconds,
        Kling3p0ProMultiFunctionVideoGenDuration::NineSeconds => EnqueueKling3p0ProTextToVideoDuration::NineSeconds,
        Kling3p0ProMultiFunctionVideoGenDuration::TenSeconds => EnqueueKling3p0ProTextToVideoDuration::TenSeconds,
        Kling3p0ProMultiFunctionVideoGenDuration::ElevenSeconds => EnqueueKling3p0ProTextToVideoDuration::ElevenSeconds,
        Kling3p0ProMultiFunctionVideoGenDuration::TwelveSeconds => EnqueueKling3p0ProTextToVideoDuration::TwelveSeconds,
        Kling3p0ProMultiFunctionVideoGenDuration::ThirteenSeconds => EnqueueKling3p0ProTextToVideoDuration::ThirteenSeconds,
        Kling3p0ProMultiFunctionVideoGenDuration::FourteenSeconds => EnqueueKling3p0ProTextToVideoDuration::FourteenSeconds,
        Kling3p0ProMultiFunctionVideoGenDuration::FifteenSeconds => EnqueueKling3p0ProTextToVideoDuration::FifteenSeconds,
      });

  // Use text-to-video cost calculator (same pricing for both modes)
  let api_key = fal_client::creds::fal_api_key::FalApiKey::from_str("");
  let args = EnqueueKling3p0ProTextToVideoArgs {
    prompt: String::new(),
    generate_audio: plan.generate_audio,
    negative_prompt: None,
    duration,
    aspect_ratio: None,
    shot_type: None,
    webhook_url: "https://example.com",
    api_key: &api_key,
  };

  let cost_in_usd_cents = args.calculate_cost_in_cents();

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

  fn estimate_usd_cents(duration_seconds: u16) -> u64 {
    let request = GenerateVideoRequest {
      model: CommonVideoModel::Kling3p0Pro,
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
    // Kling 3.0 Pro: $0.336/sec (audio on, the default when None)
    // Formula: (336 * duration_secs + 9) / 10 → ceiling division
    // 5s: (336 * 5 + 9) / 10 = 1689 / 10 = 168
    assert_eq!(estimate_usd_cents(5), 168);
    // 10s: (336 * 10 + 9) / 10 = 3369 / 10 = 336
    assert_eq!(estimate_usd_cents(10), 336);
    // 15s: (336 * 15 + 9) / 10 = 5049 / 10 = 504
    assert_eq!(estimate_usd_cents(15), 504);
  }
}

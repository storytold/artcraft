use artcraft_api_defs::generate::video::multi_function::seedance_1p5_pro_multi_function_video_gen::Seedance1p5ProMultiFunctionVideoGenDuration;
use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests::webhook::video::text::enqueue_seedance_1p5_pro_text_to_video_webhook::{
  EnqueueSeedance1p5ProTextToVideoArgs,
  EnqueueSeedance1p5ProTextToVideoDuration,
  EnqueueSeedance1p5ProTextToVideoResolution,
};

use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance1p5_pro::PlanArtcraftSeedance1p5Pro;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_artcraft_seedance1p5_pro(
  plan: &PlanArtcraftSeedance1p5Pro<'_>,
) -> VideoGenerationCostEstimate {
  let duration = plan.duration
      .map(|d| match d {
        Seedance1p5ProMultiFunctionVideoGenDuration::FourSeconds => EnqueueSeedance1p5ProTextToVideoDuration::FourSeconds,
        Seedance1p5ProMultiFunctionVideoGenDuration::FiveSeconds => EnqueueSeedance1p5ProTextToVideoDuration::FiveSeconds,
        Seedance1p5ProMultiFunctionVideoGenDuration::SixSeconds => EnqueueSeedance1p5ProTextToVideoDuration::SixSeconds,
        Seedance1p5ProMultiFunctionVideoGenDuration::SevenSeconds => EnqueueSeedance1p5ProTextToVideoDuration::SevenSeconds,
        Seedance1p5ProMultiFunctionVideoGenDuration::EightSeconds => EnqueueSeedance1p5ProTextToVideoDuration::EightSeconds,
        Seedance1p5ProMultiFunctionVideoGenDuration::NineSeconds => EnqueueSeedance1p5ProTextToVideoDuration::NineSeconds,
        Seedance1p5ProMultiFunctionVideoGenDuration::TenSeconds => EnqueueSeedance1p5ProTextToVideoDuration::TenSeconds,
        Seedance1p5ProMultiFunctionVideoGenDuration::ElevenSeconds => EnqueueSeedance1p5ProTextToVideoDuration::ElevenSeconds,
        Seedance1p5ProMultiFunctionVideoGenDuration::TwelveSeconds => EnqueueSeedance1p5ProTextToVideoDuration::TwelveSeconds,
      });

  let resolution = plan.resolution
      .map(|r| match r {
        artcraft_api_defs::generate::video::multi_function::seedance_1p5_pro_multi_function_video_gen::Seedance1p5ProMultiFunctionVideoGenResolution::FourEightyP => EnqueueSeedance1p5ProTextToVideoResolution::FourEightyP,
        artcraft_api_defs::generate::video::multi_function::seedance_1p5_pro_multi_function_video_gen::Seedance1p5ProMultiFunctionVideoGenResolution::SevenTwentyP => EnqueueSeedance1p5ProTextToVideoResolution::SevenTwentyP,
        artcraft_api_defs::generate::video::multi_function::seedance_1p5_pro_multi_function_video_gen::Seedance1p5ProMultiFunctionVideoGenResolution::TenEightyP => EnqueueSeedance1p5ProTextToVideoResolution::TenEightyP,
      });

  // Use text-to-video cost calculator (same pricing for both modes)
  let api_key = fal_client::creds::fal_api_key::FalApiKey::from_str("");
  let args = EnqueueSeedance1p5ProTextToVideoArgs {
    prompt: String::new(),
    duration,
    resolution,
    aspect_ratio: None,
    generate_audio: plan.generate_audio,
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
      model: CommonVideoModel::Seedance1p5Pro,
      provider: Provider::Artcraft,
      prompt: None,
      negative_prompt: None,
      start_frame: None,
      end_frame: None,
      reference_images: None,
      reference_videos: None,
      reference_audio: None,
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
    // Default resolution is 720p (when None)
    // 720p 5s = 26 cents (constant from Fal)
    assert_eq!(estimate_usd_cents(5), 26);

    // Other durations use token-based calculation
    assert_eq!(estimate_usd_cents(4), 26);
    assert_eq!(estimate_usd_cents(10), 65);
    assert_eq!(estimate_usd_cents(12), 78);
  }
}

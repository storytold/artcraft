use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;
use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests_old::webhook::video::text::enqueue_seedance_1p5_pro_text_to_video_webhook::{
  EnqueueSeedance1p5ProTextToVideoDuration, EnqueueSeedance1p5ProTextToVideoRequest,
  EnqueueSeedance1p5ProTextToVideoResolution,
};

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::seedance_1p5_pro::request::ArtcraftSeedance1p5ProRequestState;

#[derive(Clone, Debug)]
pub struct ArtcraftSeedance1p5ProCostState {
  pub duration: Option<EnqueueSeedance1p5ProTextToVideoDuration>,
  pub resolution: Option<EnqueueSeedance1p5ProTextToVideoResolution>,
  pub generate_audio: Option<bool>,
}

impl ArtcraftSeedance1p5ProCostState {
  pub fn from_request(request: &ArtcraftSeedance1p5ProRequestState) -> Self {
    let duration = request.request.duration_seconds.and_then(seconds_to_duration);
    let resolution = request.request.resolution.and_then(common_resolution_to_seedance);
    Self {
      duration,
      resolution,
      generate_audio: request.request.generate_audio,
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Delegate to the Fal client's cost calculator. Pricing is identical for
    // text-to-video and image-to-video at the same resolution+duration+audio,
    // so we use the text-to-video request type as a stand-in.
    let req = EnqueueSeedance1p5ProTextToVideoRequest {
      prompt: String::new(),
      duration: self.duration,
      resolution: self.resolution,
      aspect_ratio: None,
      generate_audio: self.generate_audio,
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
}

fn seconds_to_duration(seconds: u16) -> Option<EnqueueSeedance1p5ProTextToVideoDuration> {
  use EnqueueSeedance1p5ProTextToVideoDuration as D;
  match seconds {
    4 => Some(D::FourSeconds),
    5 => Some(D::FiveSeconds),
    6 => Some(D::SixSeconds),
    7 => Some(D::SevenSeconds),
    8 => Some(D::EightSeconds),
    9 => Some(D::NineSeconds),
    10 => Some(D::TenSeconds),
    11 => Some(D::ElevenSeconds),
    12 => Some(D::TwelveSeconds),
    _ => None,
  }
}

fn common_resolution_to_seedance(r: CommonResolutionEnum) -> Option<EnqueueSeedance1p5ProTextToVideoResolution> {
  match r {
    CommonResolutionEnum::FourEightyP => Some(EnqueueSeedance1p5ProTextToVideoResolution::FourEightyP),
    CommonResolutionEnum::SevenTwentyP => Some(EnqueueSeedance1p5ProTextToVideoResolution::SevenTwentyP),
    CommonResolutionEnum::TenEightyP => Some(EnqueueSeedance1p5ProTextToVideoResolution::TenEightyP),
    _ => None,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn cost_cents(duration_seconds: Option<u16>) -> u64 {
    let b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance1p5Pro,
      provider: RouterProvider::Artcraft,
      prompt: Some("test".to_string()),
      duration_seconds,
      ..Default::default()
    };
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  // Numeric literals mirror the v1 Artcraft Seedance 1.5 Pro tests we deleted:
  // resolution=None + generate_audio=None → fal client defaults (720p, audio on).
  #[test]
  fn default_5s_is_26() { assert_eq!(cost_cents(Some(5)), 26); }

  #[test]
  fn default_4s_is_26() { assert_eq!(cost_cents(Some(4)), 26); }

  #[test]
  fn default_10s_is_65() { assert_eq!(cost_cents(Some(10)), 65); }

  #[test]
  fn default_12s_is_78() { assert_eq!(cost_cents(Some(12)), 78); }
}

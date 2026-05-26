use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::kling_2_5_turbo_pro::request::ArtcraftKling2p5TurboProRequestState;

#[derive(Clone, Debug)]
pub struct ArtcraftKling2p5TurboProCostState {
  pub is_ten_seconds: bool,
}

impl ArtcraftKling2p5TurboProCostState {
  pub fn from_request(request: &ArtcraftKling2p5TurboProRequestState) -> Self {
    Self { is_ten_seconds: request.request.duration_seconds == Some(10) }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Mirrors fal_client kling_v2p5_turbo_pro: 5s = 35¢, 10s = 70¢.
    let cost_in_usd_cents: u64 = if self.is_ten_seconds { 70 } else { 35 };

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

#[cfg(test)]
mod tests {
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::provider::Provider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn cost_cents(duration_seconds: Option<u16>) -> u64 {
    let b = GenerateVideoRequestBuilder {
      model: CommonVideoModel::Kling2p5TurboPro,
      provider: Provider::Artcraft,
      prompt: Some("test".to_string()),
      duration_seconds,
      ..Default::default()
    };
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn five_seconds_is_35() { assert_eq!(cost_cents(Some(5)), 35); }

  #[test]
  fn ten_seconds_is_70() { assert_eq!(cost_cents(Some(10)), 70); }

  #[test]
  fn default_duration_is_5s_priced_at_35() { assert_eq!(cost_cents(None), 35); }
}

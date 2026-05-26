use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::veo_2::request::ArtcraftVeo2RequestState;

#[derive(Clone, Debug)]
pub struct ArtcraftVeo2CostState {
  pub duration_seconds: u64,
}

impl ArtcraftVeo2CostState {
  pub fn from_request(request: &ArtcraftVeo2RequestState) -> Self {
    Self {
      // v1 default: None → 5s.
      duration_seconds: request.request.duration_seconds.map(u64::from).unwrap_or(5),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Mirrors fal_client veo_2: 5s = $2.50, +$0.50/s above 5s.
    let extra = self.duration_seconds.saturating_sub(5);
    let cost_in_usd_cents = 250 + extra * 50;

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
      model: CommonVideoModel::Veo2,
      provider: Provider::Artcraft,
      prompt: Some("test".to_string()),
      duration_seconds,
      ..Default::default()
    };
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn default_is_5s_priced_at_250() { assert_eq!(cost_cents(None), 250); }

  #[test]
  fn five_seconds_is_250() { assert_eq!(cost_cents(Some(5)), 250); }

  #[test]
  fn six_seconds_is_300() { assert_eq!(cost_cents(Some(6)), 300); }

  #[test]
  fn seven_seconds_is_350() { assert_eq!(cost_cents(Some(7)), 350); }

  #[test]
  fn eight_seconds_is_400() { assert_eq!(cost_cents(Some(8)), 400); }
}

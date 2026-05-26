use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::fal::sora_2::request::{
  FalSora2Duration, FalSora2RequestState,
};

#[derive(Clone, Debug)]
pub struct FalSora2CostState {
  pub duration_seconds: u64,
}

impl FalSora2CostState {
  pub fn from_request(request: &FalSora2RequestState) -> Self {
    Self {
      duration_seconds: duration_seconds_for_cost(request.duration),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Sora 2: $0.10/second. Default duration (Fal client): 4s.
    let cost_in_usd_cents = self.duration_seconds * 10;

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

fn duration_seconds_for_cost(d: Option<FalSora2Duration>) -> u64 {
  match d {
    Some(FalSora2Duration::Four) | None => 4,
    Some(FalSora2Duration::Eight) => 8,
    Some(FalSora2Duration::Twelve) => 12,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::provider::Provider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn cost_cents(duration_seconds: Option<u16>) -> u64 {
    let b = GenerateVideoRequestBuilder {
      model: CommonVideoModel::Sora2,
      provider: Provider::Fal,
      prompt: Some("test".to_string()),
      duration_seconds,
      ..Default::default()
    };
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn four_seconds_is_40() { assert_eq!(cost_cents(Some(4)), 40); }

  #[test]
  fn eight_seconds_is_80() { assert_eq!(cost_cents(Some(8)), 80); }

  #[test]
  fn twelve_seconds_is_120() { assert_eq!(cost_cents(Some(12)), 120); }

  #[test]
  fn default_duration_is_4s_priced_at_40() { assert_eq!(cost_cents(None), 40); }
}

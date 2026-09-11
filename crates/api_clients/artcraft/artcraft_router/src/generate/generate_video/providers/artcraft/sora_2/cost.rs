use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::sora_2::request::ArtcraftSora2RequestState;

#[derive(Clone, Debug)]
pub struct ArtcraftSora2CostState {
  pub duration_seconds: u64,
}

impl ArtcraftSora2CostState {
  pub fn from_request(request: &ArtcraftSora2RequestState) -> Self {
    Self {
      // v1 default: None → 4s.
      duration_seconds: request.request.duration_seconds.map(u64::from).unwrap_or(4),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Sora 2: 11.5¢/second (held in hundredths of a cent, rounded up to
    // whole cents). Default duration 4s.
    let cost_in_usd_cents = (self.duration_seconds * 1_150).div_ceil(100);

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
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn cost_cents(duration_seconds: Option<u16>) -> u64 {
    let b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Sora2,
      provider: RouterProvider::Artcraft,
      prompt: Some("test".to_string()),
      duration_seconds,
      ..Default::default()
    };
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn four_seconds_is_46() { assert_eq!(cost_cents(Some(4)), 46); }

  #[test]
  fn eight_seconds_is_92() { assert_eq!(cost_cents(Some(8)), 92); }

  #[test]
  fn twelve_seconds_is_138() { assert_eq!(cost_cents(Some(12)), 138); }

  #[test]
  fn default_duration_is_4s_priced_at_46() { assert_eq!(cost_cents(None), 46); }
}

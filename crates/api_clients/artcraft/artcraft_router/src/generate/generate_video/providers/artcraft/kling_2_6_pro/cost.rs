use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::kling_2_6_pro::request::ArtcraftKling2p6ProRequestState;

#[derive(Clone, Debug)]
pub struct ArtcraftKling2p6ProCostState {
  pub is_ten_seconds: bool,
  pub generate_audio: bool,
}

impl ArtcraftKling2p6ProCostState {
  pub fn from_request(request: &ArtcraftKling2p6ProRequestState) -> Self {
    Self {
      is_ten_seconds: request.request.duration_seconds == Some(10),
      // Default per v1 plan / Fal client: audio is on when unspecified.
      generate_audio: request.request.generate_audio.unwrap_or(true),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Mirrors fal_client kling_v2p6_pro:
    //   audio off: $0.07/sec → 5s=35¢, 10s=70¢
    //   audio on:  $0.14/sec → 5s=70¢, 10s=140¢
    let cost_in_usd_cents: u64 = match (self.generate_audio, self.is_ten_seconds) {
      (false, false) => 41,
      (false, true) => 81,
      (true, false) => 81,
      (true, true) => 161,
    };

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

  fn cost_cents(duration_seconds: Option<u16>, generate_audio: Option<bool>) -> u64 {
    let b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Kling2p6Pro,
      provider: RouterProvider::Artcraft,
      prompt: Some("test".to_string()),
      duration_seconds,
      generate_audio,
      ..Default::default()
    };
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn audio_off_5s_is_41() { assert_eq!(cost_cents(Some(5), Some(false)), 41); }

  #[test]
  fn audio_off_10s_is_81() { assert_eq!(cost_cents(Some(10), Some(false)), 81); }

  #[test]
  fn audio_on_5s_is_81() { assert_eq!(cost_cents(Some(5), Some(true)), 81); }

  #[test]
  fn audio_on_10s_is_161() { assert_eq!(cost_cents(Some(10), Some(true)), 161); }

  #[test]
  fn audio_default_is_on() {
    assert_eq!(cost_cents(Some(5), None), cost_cents(Some(5), Some(true)));
  }
}

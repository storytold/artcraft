use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::veo_3p1::request::ArtcraftVeo3p1RequestState;

#[derive(Clone, Debug)]
pub struct ArtcraftVeo3p1CostState {
  pub duration_seconds: u64,
  pub generate_audio: bool,
}

impl ArtcraftVeo3p1CostState {
  pub fn from_request(request: &ArtcraftVeo3p1RequestState) -> Self {
    Self {
      // v1 legacy Veo 3.1 multi-function handler defaults None → 6s.
      duration_seconds: request.request.duration_seconds.map(u64::from).unwrap_or(6),
      // v1 legacy Veo 3.1 handler defaults generate_audio to true.
      generate_audio: request.request.generate_audio.unwrap_or(true),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Mirrors fal_client veo_3p1: $0.20/sec audio off, $0.40/sec audio on.
    let per_second_cents: u64 = if self.generate_audio { 40 } else { 20 };
    let cost_in_usd_cents = per_second_cents * self.duration_seconds;

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
      model: RouterVideoModel::Veo3p1,
      provider: RouterProvider::Artcraft,
      prompt: Some("test".to_string()),
      duration_seconds,
      generate_audio,
      ..Default::default()
    };
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn audio_on_4s_is_160() { assert_eq!(cost_cents(Some(4), Some(true)), 160); }

  #[test]
  fn audio_on_6s_is_240() { assert_eq!(cost_cents(Some(6), Some(true)), 240); }

  #[test]
  fn audio_on_8s_is_320() { assert_eq!(cost_cents(Some(8), Some(true)), 320); }

  #[test]
  fn audio_off_4s_is_80() { assert_eq!(cost_cents(Some(4), Some(false)), 80); }

  #[test]
  fn default_duration_is_6s() {
    assert_eq!(cost_cents(None, Some(true)), 240);
  }

  #[test]
  fn audio_default_is_on() {
    assert_eq!(cost_cents(Some(6), None), 240);
  }
}

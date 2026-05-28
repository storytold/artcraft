use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::veo_3_fast::request::ArtcraftVeo3FastRequestState;

#[derive(Clone, Debug)]
pub struct ArtcraftVeo3FastCostState {
  pub generate_audio: bool,
}

impl ArtcraftVeo3FastCostState {
  pub fn from_request(request: &ArtcraftVeo3FastRequestState) -> Self {
    Self {
      // v1 legacy Veo 3 Fast handler defaults generate_audio to false.
      generate_audio: request.request.generate_audio.unwrap_or(false),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Mirrors fal_client veo_3_fast: $0.10/sec audio off, $0.15/sec audio on.
    // Legacy handler always bills 8s.
    let per_second_cents: u64 = if self.generate_audio { 15 } else { 10 };
    let cost_in_usd_cents = per_second_cents * 8;

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
      model: RouterVideoModel::Veo3Fast,
      provider: RouterProvider::Artcraft,
      prompt: Some("test".to_string()),
      duration_seconds,
      generate_audio,
      ..Default::default()
    };
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn audio_off_is_80() { assert_eq!(cost_cents(Some(8), Some(false)), 80); }

  #[test]
  fn audio_on_is_120() { assert_eq!(cost_cents(Some(8), Some(true)), 120); }

  #[test]
  fn audio_default_is_off() {
    assert_eq!(cost_cents(Some(8), None), 80);
  }

  #[test]
  fn duration_does_not_affect_cost() {
    // v1 always bills 8s regardless of duration_seconds.
    assert_eq!(cost_cents(Some(4), Some(false)), 80);
    assert_eq!(cost_cents(Some(6), Some(false)), 80);
    assert_eq!(cost_cents(Some(8), Some(false)), 80);
    assert_eq!(cost_cents(None, Some(false)), 80);
  }
}

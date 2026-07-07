use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::veo_3::request::ArtcraftVeo3RequestState;

#[derive(Clone, Debug)]
pub struct ArtcraftVeo3CostState {
  pub duration_seconds: u64,
  pub generate_audio: bool,
}

impl ArtcraftVeo3CostState {
  pub fn from_request(request: &ArtcraftVeo3RequestState) -> Self {
    Self {
      duration_seconds: duration_seconds_for_cost(request.request.duration_seconds),
      // v1 legacy Veo 3 handler defaults generate_audio to false.
      generate_audio: request.request.generate_audio.unwrap_or(false),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // $0.24/sec audio off, $0.48/sec audio on.
    let per_second_cents: u64 = if self.generate_audio { 48 } else { 24 };
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

/// Mirrors v1 `duration_seconds_for_cost`: s≤4 → 4, s≤6 → 6, else → 8 (incl. None and 7+).
fn duration_seconds_for_cost(d: Option<u16>) -> u64 {
  match d {
    Some(s) if s <= 4 => 4,
    Some(s) if s <= 6 => 6,
    _ => 8,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn cost_cents(duration_seconds: Option<u16>, generate_audio: Option<bool>) -> u64 {
    let b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Veo3,
      provider: RouterProvider::Artcraft,
      prompt: Some("test".to_string()),
      duration_seconds,
      generate_audio,
      ..Default::default()
    };
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn audio_off_4s_is_96() { assert_eq!(cost_cents(Some(4), Some(false)), 96); }

  #[test]
  fn audio_off_6s_is_144() { assert_eq!(cost_cents(Some(6), Some(false)), 144); }

  #[test]
  fn audio_off_8s_is_192() { assert_eq!(cost_cents(Some(8), Some(false)), 192); }

  #[test]
  fn audio_on_4s_is_192() { assert_eq!(cost_cents(Some(4), Some(true)), 192); }

  #[test]
  fn audio_on_8s_is_384() { assert_eq!(cost_cents(Some(8), Some(true)), 384); }

  #[test]
  fn default_duration_is_8s() {
    assert_eq!(cost_cents(None, Some(false)), cost_cents(Some(8), Some(false)));
  }

  #[test]
  fn audio_default_is_off() {
    // None → audio defaults to false.
    assert_eq!(cost_cents(Some(8), None), cost_cents(Some(8), Some(false)));
  }
}

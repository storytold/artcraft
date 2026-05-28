use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::kling_3p0_standard::request::ArtcraftKling3p0StandardRequestState;

#[derive(Clone, Debug)]
pub struct ArtcraftKling3p0StandardCostState {
  pub duration_seconds: u64,
  pub generate_audio: bool,
}

impl ArtcraftKling3p0StandardCostState {
  pub fn from_request(request: &ArtcraftKling3p0StandardRequestState) -> Self {
    Self {
      duration_seconds: request.request.duration_seconds.map(u64::from).unwrap_or(5),
      generate_audio: request.request.generate_audio.unwrap_or(true),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Mirrors fal_client kling_3p0_standard:
    //   audio off: $0.168/sec  (rate=168)
    //   audio on:  $0.252/sec  (rate=252)
    let rate: u64 = if self.generate_audio { 252 } else { 168 };
    let cost_in_usd_cents = (rate * self.duration_seconds + 9) / 10;

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
      model: RouterVideoModel::Kling3p0Standard,
      provider: RouterProvider::Artcraft,
      prompt: Some("test".to_string()),
      duration_seconds,
      generate_audio,
      ..Default::default()
    };
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn audio_on_5s_is_126() {
    // rate=252, (252*5 + 9) / 10 = 1269/10 = 126.
    assert_eq!(cost_cents(Some(5), Some(true)), 126);
  }

  #[test]
  fn audio_off_5s_is_84() {
    // rate=168, (168*5 + 9) / 10 = 849/10 = 84.
    assert_eq!(cost_cents(Some(5), Some(false)), 84);
  }

  #[test]
  fn audio_on_10s_is_252() {
    assert_eq!(cost_cents(Some(10), Some(true)), 252);
  }

  #[test]
  fn audio_on_15s_is_378() {
    // (252*15 + 9) / 10 = 3789/10 = 378.
    assert_eq!(cost_cents(Some(15), Some(true)), 378);
  }

  #[test]
  fn default_duration_is_5s() {
    assert_eq!(cost_cents(None, Some(true)), cost_cents(Some(5), Some(true)));
  }
}

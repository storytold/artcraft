use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::kling_3p0_standard::request::ArtcraftKling3p0StandardRequestState;

// The markup is applied at cent granularity with ceiling rounding.
const MARKUP_NUMERATOR: u64 = 115;
const MARKUP_DENOMINATOR: u64 = 100;

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
    // Base rates in tenths of a cent per second; the total is
    // ceiling-divided to whole cents, then the markup applied.
    let rate: u64 = if self.generate_audio { 252 } else { 168 };
    let base = (rate * self.duration_seconds + 9) / 10;
    let cost_in_usd_cents = base.saturating_mul(MARKUP_NUMERATOR).div_ceil(MARKUP_DENOMINATOR);

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
  fn audio_on_5s_is_145() {
    // rate=252, base (252*5 + 9) / 10 = 126, ×115/100 ceiled = 145.
    assert_eq!(cost_cents(Some(5), Some(true)), 145);
  }

  #[test]
  fn audio_off_5s_is_97() {
    // rate=168, base (168*5 + 9) / 10 = 84, ×115/100 ceiled = 97.
    assert_eq!(cost_cents(Some(5), Some(false)), 97);
  }

  #[test]
  fn audio_on_10s_is_290() {
    assert_eq!(cost_cents(Some(10), Some(true)), 290);
  }

  #[test]
  fn audio_on_15s_is_435() {
    // base (252*15 + 9) / 10 = 378, ×115/100 ceiled = 435.
    assert_eq!(cost_cents(Some(15), Some(true)), 435);
  }

  #[test]
  fn default_duration_is_5s() {
    assert_eq!(cost_cents(None, Some(true)), cost_cents(Some(5), Some(true)));
  }
}

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::kling_3p0_pro::request::ArtcraftKling3p0ProRequestState;

#[derive(Clone, Debug)]
pub struct ArtcraftKling3p0ProCostState {
  pub duration_seconds: u64,
  pub generate_audio: bool,
}

impl ArtcraftKling3p0ProCostState {
  pub fn from_request(request: &ArtcraftKling3p0ProRequestState) -> Self {
    Self {
      // Default duration is 5s when unset (mirrors v1 plan default + Fal client default).
      duration_seconds: request.request.duration_seconds.map(u64::from).unwrap_or(5),
      generate_audio: request.request.generate_audio.unwrap_or(true),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Mirrors fal_client kling_3p0_pro:
    //   audio off: $0.224/sec  (rate=224 in tenths-of-cents)
    //   audio on:  $0.336/sec  (rate=336)
    // ceiling-divided to whole cents.
    let rate: u64 = if self.generate_audio { 336 } else { 224 };
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
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::provider::Provider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn cost_cents(duration_seconds: Option<u16>, generate_audio: Option<bool>) -> u64 {
    let b = GenerateVideoRequestBuilder {
      model: CommonVideoModel::Kling3p0Pro,
      provider: Provider::Artcraft,
      prompt: Some("test".to_string()),
      duration_seconds,
      generate_audio,
      ..Default::default()
    };
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn audio_on_5s_is_168() {
    // rate=336, (336*5 + 9) / 10 = 1689/10 = 168.
    assert_eq!(cost_cents(Some(5), Some(true)), 168);
  }

  #[test]
  fn audio_off_5s_is_112() {
    // rate=224, (224*5 + 9) / 10 = 1129/10 = 112.
    assert_eq!(cost_cents(Some(5), Some(false)), 112);
  }

  #[test]
  fn audio_on_10s_is_336() {
    assert_eq!(cost_cents(Some(10), Some(true)), 336);
  }

  #[test]
  fn audio_on_15s_is_504() {
    // rate=336, (336*15 + 9) / 10 = 5049/10 = 504.
    assert_eq!(cost_cents(Some(15), Some(true)), 504);
  }

  #[test]
  fn default_duration_is_5s() {
    assert_eq!(cost_cents(None, Some(true)), cost_cents(Some(5), Some(true)));
  }

  #[test]
  fn audio_default_is_on() {
    assert_eq!(cost_cents(Some(5), None), cost_cents(Some(5), Some(true)));
  }
}

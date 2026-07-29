use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::veo_3p1_lite::request::ArtcraftVeo3p1LiteRequestState;

/// Per-second rates in hundredths of a US cent.
const SEVEN_TWENTY_P_AUDIO_OFF_RATE: u64 = 315;
const SEVEN_TWENTY_P_AUDIO_ON_RATE: u64 = 525;
const TEN_EIGHTY_P_AUDIO_OFF_RATE: u64 = 525;
const TEN_EIGHTY_P_AUDIO_ON_RATE: u64 = 840;

#[derive(Clone, Debug)]
pub struct ArtcraftVeo3p1LiteCostState {
  pub duration_seconds: u64,
  pub is_1080p: bool,
  pub generate_audio: bool,
}

impl ArtcraftVeo3p1LiteCostState {
  pub fn from_request(request: &ArtcraftVeo3p1LiteRequestState) -> Self {
    Self {
      // Veo 3.1 Lite defaults None → 8s.
      duration_seconds: request.request.duration_seconds.map(u64::from).unwrap_or(8),
      is_1080p: is_1080p(request.request.resolution),
      // Audio is on when unspecified.
      generate_audio: request.request.generate_audio.unwrap_or(true),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let rate = match (self.is_1080p, self.generate_audio) {
      (false, false) => SEVEN_TWENTY_P_AUDIO_OFF_RATE,
      (false, true) => SEVEN_TWENTY_P_AUDIO_ON_RATE,
      (true, false) => TEN_EIGHTY_P_AUDIO_OFF_RATE,
      (true, true) => TEN_EIGHTY_P_AUDIO_ON_RATE,
    };
    // Round up to the next whole cent.
    let cost_in_usd_cents = (rate * self.duration_seconds).div_ceil(100);

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

/// Veo 3.1 Lite renders 720p (the default) or 1080p.
fn is_1080p(resolution: Option<CommonResolutionEnum>) -> bool {
  matches!(
    resolution,
    Some(CommonResolutionEnum::TenEightyP)
    | Some(CommonResolutionEnum::TwoK)
    | Some(CommonResolutionEnum::ThreeK)
    | Some(CommonResolutionEnum::FourK)
  )
}

#[cfg(test)]
mod tests {
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::providers::artcraft::veo_3p1_lite::build::build_artcraft_veo_3p1_lite_state;
  use crate::generate::generate_video::providers::artcraft::veo_3p1_lite::cost::ArtcraftVeo3p1LiteCostState;

  fn cost_cents(
    duration_seconds: Option<u16>,
    resolution: Option<RouterResolution>,
    generate_audio: Option<bool>,
  ) -> u64 {
    let b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Veo3p1Lite,
      provider: RouterProvider::Artcraft,
      prompt: Some("test".to_string()),
      duration_seconds,
      resolution,
      generate_audio,
      ..Default::default()
    };
    let state = build_artcraft_veo_3p1_lite_state(b).unwrap();
    ArtcraftVeo3p1LiteCostState::from_request(&state).estimate_cost().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn defaults_8s_720p_audio_on_is_42() { assert_eq!(cost_cents(None, None, None), 42); }

  #[test]
  fn audio_off_8s_720p_is_26() {
    // 315 * 8 = 2520 hundredth-cents → 26 cents.
    assert_eq!(cost_cents(Some(8), None, Some(false)), 26);
  }

  #[test]
  fn audio_on_8s_1080p_is_68() {
    // 840 * 8 = 6720 hundredth-cents → 68 cents.
    assert_eq!(cost_cents(Some(8), Some(RouterResolution::TenEightyP), Some(true)), 68);
  }

  #[test]
  fn audio_off_8s_1080p_is_42() {
    assert_eq!(cost_cents(Some(8), Some(RouterResolution::TenEightyP), Some(false)), 42);
  }

  #[test]
  fn audio_on_4s_720p_is_21() {
    assert_eq!(cost_cents(Some(4), None, Some(true)), 21);
  }

  #[test]
  fn audio_default_is_on() {
    assert_eq!(cost_cents(Some(8), None, None), cost_cents(Some(8), None, Some(true)));
  }
}

use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::veo_3p1_fast::request::ArtcraftVeo3p1FastRequestState;

#[derive(Clone, Debug)]
pub struct ArtcraftVeo3p1FastCostState {
  pub duration_seconds: u64,
  pub generate_audio: bool,
  pub is_4k: bool,
}

impl ArtcraftVeo3p1FastCostState {
  pub fn from_request(request: &ArtcraftVeo3p1FastRequestState) -> Self {
    Self {
      // v1 legacy Veo 3.1 Fast multi-function handler defaults None → 6s.
      duration_seconds: request.request.duration_seconds.map(u64::from).unwrap_or(6),
      // v1 legacy Veo 3.1 Fast handler defaults generate_audio to true.
      generate_audio: request.request.generate_audio.unwrap_or(true),
      is_4k: request.request.resolution == Some(CommonResolutionEnum::FourK),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Mirrors fal_client veo_3p1_fast: $0.10/sec audio off, $0.15/sec audio on;
    // 4K renders bill a premium: $0.30/sec audio off, $0.35/sec audio on.
    let per_second_cents: u64 = match (self.is_4k, self.generate_audio) {
      (false, false) => 10,
      (false, true) => 15,
      (true, false) => 30,
      (true, true) => 35,
    };
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
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn cost_cents(duration_seconds: Option<u16>, generate_audio: Option<bool>) -> u64 {
    cost_cents_at(duration_seconds, generate_audio, None)
  }

  fn cost_cents_at(
    duration_seconds: Option<u16>,
    generate_audio: Option<bool>,
    resolution: Option<RouterResolution>,
  ) -> u64 {
    let b = GenerateVideoRequestBuilder {
      resolution,
      model: RouterVideoModel::Veo3p1Fast,
      provider: RouterProvider::Artcraft,
      prompt: Some("test".to_string()),
      duration_seconds,
      generate_audio,
      ..Default::default()
    };
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn audio_on_4s_is_60() { assert_eq!(cost_cents(Some(4), Some(true)), 60); }

  #[test]
  fn audio_on_6s_is_90() { assert_eq!(cost_cents(Some(6), Some(true)), 90); }

  #[test]
  fn audio_on_8s_is_120() { assert_eq!(cost_cents(Some(8), Some(true)), 120); }

  #[test]
  fn audio_off_4s_is_40() { assert_eq!(cost_cents(Some(4), Some(false)), 40); }

  #[test]
  fn default_duration_is_6s() {
    assert_eq!(cost_cents(None, Some(true)), 90);
  }

  #[test]
  fn audio_default_is_on() {
    assert_eq!(cost_cents(Some(6), None), 90);
  }

  #[test]
  fn four_k_audio_off_4s_is_120() {
    assert_eq!(cost_cents_at(Some(4), Some(false), Some(RouterResolution::FourK)), 120);
  }

  #[test]
  fn four_k_audio_on_4s_is_140() {
    assert_eq!(cost_cents_at(Some(4), Some(true), Some(RouterResolution::FourK)), 140);
  }

  #[test]
  fn non_four_k_resolutions_share_the_base_rate() {
    assert_eq!(
      cost_cents_at(Some(8), Some(true), Some(RouterResolution::SevenTwentyP)),
      cost_cents_at(Some(8), Some(true), Some(RouterResolution::TenEightyP)),
    );
  }
}

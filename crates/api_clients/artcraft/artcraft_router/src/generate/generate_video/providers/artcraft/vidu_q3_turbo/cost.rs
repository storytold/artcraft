use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::vidu_q3_turbo::request::ArtcraftViduQ3TurboRequestState;

/// Per-second rates in hundredths of a US cent.
const LOW_RES_RATE_HUNDREDTH_CENTS_PER_SEC: u64 = 401;
const HIGH_RES_RATE_HUNDREDTH_CENTS_PER_SEC: u64 = 834;

#[derive(Clone, Debug)]
pub struct ArtcraftViduQ3TurboCostState {
  pub duration_seconds: u64,
  pub is_high_res: bool,
}

impl ArtcraftViduQ3TurboCostState {
  pub fn from_request(request: &ArtcraftViduQ3TurboRequestState) -> Self {
    Self {
      // Vidu Q3 Turbo defaults None → 5s.
      duration_seconds: request.request.duration_seconds.map(u64::from).unwrap_or(5),
      is_high_res: is_high_res(request.request.resolution),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let rate = if self.is_high_res {
      HIGH_RES_RATE_HUNDREDTH_CENTS_PER_SEC
    } else {
      LOW_RES_RATE_HUNDREDTH_CENTS_PER_SEC
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

/// Vidu prices 720p/1080p at a higher tier than 360p/540p. The default (unset)
/// resolution is 720p.
fn is_high_res(resolution: Option<CommonResolutionEnum>) -> bool {
  match resolution {
    None => true, // defaults to 720p
    Some(CommonResolutionEnum::SevenTwentyP)
    | Some(CommonResolutionEnum::TenEightyP)
    | Some(CommonResolutionEnum::OneK)
    | Some(CommonResolutionEnum::TwoK)
    | Some(CommonResolutionEnum::ThreeK)
    | Some(CommonResolutionEnum::FourK) => true,
    Some(CommonResolutionEnum::HalfK)
    | Some(CommonResolutionEnum::FourEightyP) => false,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::providers::artcraft::vidu_q3_turbo::build::build_artcraft_vidu_q3_turbo_state;
  use crate::generate::generate_video::providers::artcraft::vidu_q3_turbo::cost::ArtcraftViduQ3TurboCostState;

  fn cost_cents(duration_seconds: Option<u16>, resolution: Option<RouterResolution>) -> u64 {
    let b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::ViduQ3Turbo,
      provider: RouterProvider::Artcraft,
      prompt: Some("test".to_string()),
      duration_seconds,
      resolution,
      ..Default::default()
    };
    let state = build_artcraft_vidu_q3_turbo_state(b).unwrap();
    ArtcraftViduQ3TurboCostState::from_request(&state).estimate_cost().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn default_resolution_5s_is_42() { assert_eq!(cost_cents(Some(5), None), 42); }

  #[test]
  fn default_duration_is_5s() { assert_eq!(cost_cents(None, None), 42); }

  #[test]
  fn high_res_10s_is_84() { assert_eq!(cost_cents(Some(10), Some(RouterResolution::TenEightyP)), 84); }

  #[test]
  fn low_res_5s_is_21() { assert_eq!(cost_cents(Some(5), Some(RouterResolution::FourEightyP)), 21); }

  #[test]
  fn low_res_10s_is_41() { assert_eq!(cost_cents(Some(10), Some(RouterResolution::FourEightyP)), 41); }

  #[test]
  fn odd_duration_rounds_up_to_whole_cents() {
    // 7s high res: 834 * 7 = 5838 hundredth-cents → 59 cents.
    assert_eq!(cost_cents(Some(7), None), 59);
  }
}

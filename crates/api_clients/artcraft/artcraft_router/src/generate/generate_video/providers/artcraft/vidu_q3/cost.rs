use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::vidu_q3::request::ArtcraftViduQ3RequestState;

/// Per-second rates in hundredths of a US cent.
const LOW_RES_RATE_HUNDREDTH_CENTS_PER_SEC: u64 = 735;
const HIGH_RES_RATE_HUNDREDTH_CENTS_PER_SEC: u64 = 1_617;

#[derive(Clone, Debug)]
pub struct ArtcraftViduQ3CostState {
  pub duration_seconds: u64,
  pub is_high_res: bool,
}

impl ArtcraftViduQ3CostState {
  pub fn from_request(request: &ArtcraftViduQ3RequestState) -> Self {
    Self {
      // Vidu Q3 defaults None → 5s.
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
  use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;

  use crate::api::router_provider::RouterProvider;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::providers::artcraft::vidu_q3::build::build_artcraft_vidu_q3_state;
  use crate::generate::generate_video::providers::artcraft::vidu_q3::cost::ArtcraftViduQ3CostState;

  fn cost_cents(duration_seconds: Option<u16>, resolution: Option<RouterResolution>) -> u64 {
    let b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::ViduQ3,
      provider: RouterProvider::Artcraft,
      prompt: Some("test".to_string()),
      duration_seconds,
      resolution,
      ..Default::default()
    };
    let state = build_artcraft_vidu_q3_state(b).unwrap();
    ArtcraftViduQ3CostState::from_request(&state).estimate_cost().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn default_resolution_5s_is_81() { assert_eq!(cost_cents(Some(5), None), 81); }

  #[test]
  fn default_duration_is_5s() { assert_eq!(cost_cents(None, None), 81); }

  #[test]
  fn high_res_10s_is_162() { assert_eq!(cost_cents(Some(10), Some(RouterResolution::TenEightyP)), 162); }

  #[test]
  fn low_res_5s_is_37() { assert_eq!(cost_cents(Some(5), Some(RouterResolution::FourEightyP)), 37); }

  #[test]
  fn low_res_10s_is_74() { assert_eq!(cost_cents(Some(10), Some(RouterResolution::FourEightyP)), 74); }

  #[test]
  fn seven_twenty_p_is_high_res_tier() {
    assert_eq!(cost_cents(Some(8), Some(RouterResolution::SevenTwentyP)), 130);
  }

  #[test]
  fn odd_duration_rounds_up_to_whole_cents() {
    // 7s high res: 1617 * 7 = 11319 hundredth-cents → 114 cents.
    assert_eq!(cost_cents(Some(7), None), 114);
  }

  #[test]
  fn resolution_classifier_defaults_high() {
    assert!(super::is_high_res(None));
    assert!(super::is_high_res(Some(CommonResolutionEnum::TenEightyP)));
    assert!(!super::is_high_res(Some(CommonResolutionEnum::FourEightyP)));
  }
}

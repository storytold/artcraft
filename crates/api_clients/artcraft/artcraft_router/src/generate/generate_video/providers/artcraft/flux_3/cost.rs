use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;

use crate::generate::generate_video::providers::artcraft::flux_3::request::ArtcraftFlux3RequestState;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

/// Per-second rates in hundredths of a US cent for the standard modalities
/// (text, image, first-last-frame, keyframes).
const LOW_RES_RATE_HUNDREDTH_CENTS_PER_SEC: u64 = 1_955;
const HIGH_RES_RATE_HUNDREDTH_CENTS_PER_SEC: u64 = 3_335;

/// Per-second rates in hundredths of a US cent for extend-video (a reference
/// video is present), which bills at a higher tier.
const EXTEND_LOW_RES_RATE_HUNDREDTH_CENTS_PER_SEC: u64 = 4_715;
const EXTEND_HIGH_RES_RATE_HUNDREDTH_CENTS_PER_SEC: u64 = 6_095;

#[derive(Clone, Debug)]
pub struct ArtcraftFlux3CostState {
  pub duration_seconds: u64,
  pub is_1080p: bool,
  pub is_extend: bool,
}

impl ArtcraftFlux3CostState {
  pub fn from_request(request: &ArtcraftFlux3RequestState) -> Self {
    Self {
      // Flux 3 defaults None → 5s (the shortest selectable duration).
      duration_seconds: request.request.duration_seconds.map(u64::from).unwrap_or(5),
      is_1080p: is_1080p(request.request.resolution),
      // A reference video routes to the extend-video modality.
      is_extend: request.request.reference_video_media_tokens
        .as_ref()
        .is_some_and(|tokens| !tokens.is_empty()),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let rate = match (self.is_extend, self.is_1080p) {
      (false, false) => LOW_RES_RATE_HUNDREDTH_CENTS_PER_SEC,
      (false, true) => HIGH_RES_RATE_HUNDREDTH_CENTS_PER_SEC,
      (true, false) => EXTEND_LOW_RES_RATE_HUNDREDTH_CENTS_PER_SEC,
      (true, true) => EXTEND_HIGH_RES_RATE_HUNDREDTH_CENTS_PER_SEC,
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

/// Flux 3 renders 720p or 1080p; 1080p and above land on the higher tier,
/// while 720p and below render at 720p. The default (unset) resolution is
/// 720p.
fn is_1080p(resolution: Option<CommonResolutionEnum>) -> bool {
  match resolution {
    None => false, // defaults to 720p
    Some(CommonResolutionEnum::TenEightyP)
    | Some(CommonResolutionEnum::OneK)
    | Some(CommonResolutionEnum::TwoK)
    | Some(CommonResolutionEnum::ThreeK)
    | Some(CommonResolutionEnum::FourK) => true,
    Some(CommonResolutionEnum::HalfK)
    | Some(CommonResolutionEnum::FourEightyP)
    | Some(CommonResolutionEnum::SevenTwentyP) => false,
  }
}

#[cfg(test)]
mod tests {
  use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::router_provider::RouterProvider;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::video_list_ref::VideoListRef;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::providers::artcraft::flux_3::build::build_artcraft_flux_3_state;
  use crate::generate::generate_video::providers::artcraft::flux_3::cost::ArtcraftFlux3CostState;

  #[test]
  fn default_settings_5s_is_98() { assert_eq!(cost_cents(Some(5), None, false), 98); }

  #[test]
  fn default_duration_is_5s() { assert_eq!(cost_cents(None, None, false), 98); }

  #[test]
  fn low_res_20s_is_391() { assert_eq!(cost_cents(Some(20), Some(RouterResolution::SevenTwentyP), false), 391); }

  #[test]
  fn four_eighty_p_lands_on_low_tier() {
    assert_eq!(cost_cents(Some(5), Some(RouterResolution::FourEightyP), false), 98);
  }

  #[test]
  fn high_res_5s_is_167() { assert_eq!(cost_cents(Some(5), Some(RouterResolution::TenEightyP), false), 167); }

  #[test]
  fn high_res_10s_is_334() { assert_eq!(cost_cents(Some(10), Some(RouterResolution::TenEightyP), false), 334); }

  #[test]
  fn extend_low_res_5s_is_236() { assert_eq!(cost_cents(Some(5), None, true), 236); }

  #[test]
  fn extend_high_res_10s_is_610() {
    assert_eq!(cost_cents(Some(10), Some(RouterResolution::TenEightyP), true), 610);
  }

  #[test]
  fn odd_duration_rounds_up_to_whole_cents() {
    // 7s low res: 1955 × 7 = 13685 hundredth-cents → 137 cents.
    assert_eq!(cost_cents(Some(7), None, false), 137);
  }

  #[test]
  fn resolution_classifier_defaults_720p() {
    assert!(!super::is_1080p(None));
    assert!(super::is_1080p(Some(CommonResolutionEnum::TenEightyP)));
    assert!(!super::is_1080p(Some(CommonResolutionEnum::SevenTwentyP)));
    assert!(!super::is_1080p(Some(CommonResolutionEnum::FourEightyP)));
  }

  fn cost_cents(
    duration_seconds: Option<u16>,
    resolution: Option<RouterResolution>,
    with_reference_video: bool,
  ) -> u64 {
    let reference_videos = if with_reference_video {
      Some(VideoListRef::MediaFileTokens(vec![MediaFileToken::new("m_test_video".to_string())]))
    } else {
      None
    };
    let b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Flux3,
      provider: RouterProvider::Artcraft,
      prompt: Some("test".to_string()),
      duration_seconds,
      resolution,
      reference_videos,
      ..Default::default()
    };
    let state = build_artcraft_flux_3_state(b).unwrap();
    ArtcraftFlux3CostState::from_request(&state).estimate_cost().cost_in_usd_cents.unwrap()
  }
}

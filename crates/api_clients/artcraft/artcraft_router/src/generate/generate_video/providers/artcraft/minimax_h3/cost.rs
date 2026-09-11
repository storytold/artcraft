use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;

use crate::generate::generate_video::providers::artcraft::minimax_h3::request::ArtcraftMinimaxH3RequestState;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

/// Per-second rates in hundredths of a US cent.
const LOW_RES_RATE_HUNDREDTH_CENTS_PER_SEC: u64 = 1_840;
const HIGH_RES_RATE_HUNDREDTH_CENTS_PER_SEC: u64 = 2_990;

/// The first 5 reference images are included; each additional image bills a
/// flat fee (in hundredths of a US cent).
const INCLUDED_REFERENCE_IMAGES: u64 = 5;
const EXTRA_REFERENCE_IMAGE_HUNDREDTH_CENTS: u64 = 920;

#[derive(Clone, Debug)]
pub struct ArtcraftMinimaxH3CostState {
  pub duration_seconds: u64,
  pub is_2k: bool,
  pub reference_image_count: u64,
}

impl ArtcraftMinimaxH3CostState {
  pub fn from_request(request: &ArtcraftMinimaxH3RequestState) -> Self {
    Self {
      // MiniMax H3 defaults None → 5s.
      duration_seconds: request.request.duration_seconds.map(u64::from).unwrap_or(5),
      is_2k: is_2k(request.request.resolution),
      reference_image_count: request.request.reference_image_media_tokens
        .as_ref()
        .map_or(0, |tokens| tokens.len() as u64),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let rate = if self.is_2k {
      HIGH_RES_RATE_HUNDREDTH_CENTS_PER_SEC
    } else {
      LOW_RES_RATE_HUNDREDTH_CENTS_PER_SEC
    };
    let extra_images = self.reference_image_count.saturating_sub(INCLUDED_REFERENCE_IMAGES);
    // Round up to the next whole cent.
    let cost_in_usd_cents =
      (rate * self.duration_seconds + extra_images * EXTRA_REFERENCE_IMAGE_HUNDREDTH_CENTS)
        .div_ceil(100);

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

/// MiniMax H3 offers 768P and 2K output; 1080p and above land on the 2K tier,
/// while 720p and below render at 768P. The default (unset) resolution is 2K.
fn is_2k(resolution: Option<CommonResolutionEnum>) -> bool {
  match resolution {
    None => true, // defaults to 2K
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

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::providers::artcraft::minimax_h3::build::build_artcraft_minimax_h3_state;
  use crate::generate::generate_video::providers::artcraft::minimax_h3::cost::ArtcraftMinimaxH3CostState;

  #[test]
  fn default_resolution_5s_is_150() { assert_eq!(cost_cents(Some(5), None, 0), 150); }

  #[test]
  fn default_duration_is_5s() { assert_eq!(cost_cents(None, None, 0), 150); }

  #[test]
  fn low_res_5s_is_92() { assert_eq!(cost_cents(Some(5), Some(RouterResolution::SevenTwentyP), 0), 92); }

  #[test]
  fn four_eighty_p_lands_on_low_tier() {
    assert_eq!(cost_cents(Some(5), Some(RouterResolution::FourEightyP), 0), 92);
  }

  #[test]
  fn low_res_15s_is_276() { assert_eq!(cost_cents(Some(15), Some(RouterResolution::SevenTwentyP), 0), 276); }

  #[test]
  fn high_res_10s_is_299() { assert_eq!(cost_cents(Some(10), Some(RouterResolution::TenEightyP), 0), 299); }

  #[test]
  fn odd_duration_rounds_up_to_whole_cents() {
    // 7s high res: 2990 × 7 = 20930 hundredth-cents → 210 cents.
    assert_eq!(cost_cents(Some(7), None, 0), 210);
  }

  #[test]
  fn five_reference_images_are_included() {
    assert_eq!(cost_cents(Some(5), None, 5), cost_cents(Some(5), None, 0));
  }

  #[test]
  fn nine_reference_images_add_the_extra_image_fee() {
    // 2990 × 5 + 4 × 920 = 18630 hundredth-cents → 187 cents.
    assert_eq!(cost_cents(Some(5), None, 9), 187);
  }

  #[test]
  fn resolution_classifier_defaults_2k() {
    assert!(super::is_2k(None));
    assert!(super::is_2k(Some(CommonResolutionEnum::TenEightyP)));
    assert!(!super::is_2k(Some(CommonResolutionEnum::SevenTwentyP)));
    assert!(!super::is_2k(Some(CommonResolutionEnum::FourEightyP)));
  }

  fn cost_cents(
    duration_seconds: Option<u16>,
    resolution: Option<RouterResolution>,
    reference_image_count: usize,
  ) -> u64 {
    let reference_images = if reference_image_count == 0 {
      None
    } else {
      Some(ImageListRef::MediaFileTokens(
        (0..reference_image_count)
          .map(|i| MediaFileToken::new(format!("m_test_{i}")))
          .collect(),
      ))
    };
    let b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::MinimaxH3,
      provider: RouterProvider::Artcraft,
      prompt: Some("test".to_string()),
      duration_seconds,
      resolution,
      reference_images,
      ..Default::default()
    };
    let state = build_artcraft_minimax_h3_state(b).unwrap();
    ArtcraftMinimaxH3CostState::from_request(&state).estimate_cost().cost_in_usd_cents.unwrap()
  }
}

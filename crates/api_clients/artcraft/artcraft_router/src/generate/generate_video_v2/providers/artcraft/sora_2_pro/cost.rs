use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::sora_2_pro::request::ArtcraftSora2ProRequestState;

#[derive(Clone, Debug)]
pub struct ArtcraftSora2ProCostState {
  pub duration_seconds: u64,
  pub is_ten_eighty_p: bool,
}

impl ArtcraftSora2ProCostState {
  pub fn from_request(request: &ArtcraftSora2ProRequestState) -> Self {
    let req = &request.request;
    Self {
      duration_seconds: req.duration_seconds.map(u64::from).unwrap_or(4),
      is_ten_eighty_p: is_ten_eighty_p_for_cost(req.resolution, req.start_frame_image_media_token.is_some()),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Sora 2 Pro: $0.30/sec @ 720p, $0.50/sec @ 1080p. Default 4s.
    let per_second_cents: u64 = if self.is_ten_eighty_p { 50 } else { 30 };
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

/// Fal client defaults: text-to-video → 1080p; image-to-video → Auto (priced as 720p).
fn is_ten_eighty_p_for_cost(resolution: Option<CommonResolutionEnum>, has_start_frame: bool) -> bool {
  match resolution {
    Some(CommonResolutionEnum::TenEightyP) => true,
    Some(CommonResolutionEnum::SevenTwentyP) => false,
    // omni-gen drops Auto by returning None; default depends on mode.
    Some(_) | None => !has_start_frame,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use tokens::tokens::media_files::MediaFileToken;

  fn cost_cents(
    duration_seconds: Option<u16>,
    resolution: Option<RouterResolution>,
    has_start_frame: bool,
  ) -> u64 {
    let mut b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Sora2Pro,
      provider: RouterProvider::Artcraft,
      prompt: Some("test".to_string()),
      duration_seconds,
      resolution,
      ..Default::default()
    };
    if has_start_frame {
      b.start_frame = Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_x".to_string())));
    }
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  mod numeric_literal_pricing {
    use super::*;

    #[test]
    fn p720_4s_is_120() { assert_eq!(cost_cents(Some(4), Some(RouterResolution::SevenTwentyP), false), 120); }

    #[test]
    fn p720_8s_is_240() { assert_eq!(cost_cents(Some(8), Some(RouterResolution::SevenTwentyP), false), 240); }

    #[test]
    fn p720_12s_is_360() { assert_eq!(cost_cents(Some(12), Some(RouterResolution::SevenTwentyP), false), 360); }

    #[test]
    fn p1080_4s_is_200() { assert_eq!(cost_cents(Some(4), Some(RouterResolution::TenEightyP), false), 200); }

    #[test]
    fn p1080_12s_is_600() { assert_eq!(cost_cents(Some(12), Some(RouterResolution::TenEightyP), false), 600); }

    #[test]
    fn t2v_default_resolution_priced_as_1080p() {
      // T2V (no start_frame) with no resolution → 1080p default → 200¢ at 4s.
      assert_eq!(cost_cents(Some(4), None, false), 200);
    }

    #[test]
    fn i2v_default_resolution_priced_as_720p() {
      // I2V (with start_frame) with no resolution → 720p default → 120¢ at 4s.
      assert_eq!(cost_cents(Some(4), None, true), 120);
    }
  }

  #[test]
  fn higher_resolution_costs_more() {
    let c720 = cost_cents(Some(8), Some(RouterResolution::SevenTwentyP), false);
    let c1080 = cost_cents(Some(8), Some(RouterResolution::TenEightyP), false);
    assert!(c720 < c1080);
  }
}

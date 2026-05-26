use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::fal::sora_2_pro::request::{
  FalSora2ProDuration, FalSora2ProMode, FalSora2ProRequestState, FalSora2ProResolution,
};

#[derive(Clone, Debug)]
pub struct FalSora2ProCostState {
  pub duration_seconds: u64,
  pub is_ten_eighty_p: bool,
}

impl FalSora2ProCostState {
  pub fn from_request(request: &FalSora2ProRequestState) -> Self {
    Self {
      duration_seconds: duration_seconds_for_cost(request.duration),
      is_ten_eighty_p: is_ten_eighty_p_for_cost(&request.mode, request.resolution),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Sora 2 Pro: $0.30/second @ 720p, $0.50/second @ 1080p.
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

/// Fal client default: 4s when no duration is supplied.
fn duration_seconds_for_cost(d: Option<FalSora2ProDuration>) -> u64 {
  match d {
    Some(FalSora2ProDuration::Four) | None => 4,
    Some(FalSora2ProDuration::Eight) => 8,
    Some(FalSora2ProDuration::Twelve) => 12,
  }
}

/// Fal client default varies by mode: text-to-video defaults to 1080p; image-to-video
/// defaults to auto (priced as 720p).
fn is_ten_eighty_p_for_cost(mode: &FalSora2ProMode, resolution: Option<FalSora2ProResolution>) -> bool {
  match resolution {
    Some(FalSora2ProResolution::TenEightyP) => true,
    Some(FalSora2ProResolution::SevenTwentyP) | Some(FalSora2ProResolution::Auto) => false,
    None => matches!(mode, FalSora2ProMode::TextToVideo),
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_resolution::CommonResolution;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn cost_cents(duration_seconds: Option<u16>, resolution: Option<CommonResolution>, has_start: bool) -> u64 {
    let mut b = GenerateVideoRequestBuilder {
      model: CommonVideoModel::Sora2Pro,
      provider: Provider::Fal,
      prompt: Some("test".to_string()),
      duration_seconds,
      resolution,
      ..Default::default()
    };
    if has_start {
      b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
    }
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  mod numeric_literal_pricing {
    use super::*;

    #[test]
    fn p720_4s_is_120() {
      // $0.30/sec × 4s = 120¢.
      assert_eq!(cost_cents(Some(4), Some(CommonResolution::SevenTwentyP), false), 120);
    }

    #[test]
    fn p720_8s_is_240() { assert_eq!(cost_cents(Some(8), Some(CommonResolution::SevenTwentyP), false), 240); }

    #[test]
    fn p720_12s_is_360() { assert_eq!(cost_cents(Some(12), Some(CommonResolution::SevenTwentyP), false), 360); }

    #[test]
    fn p1080_4s_is_200() {
      // $0.50/sec × 4s = 200¢.
      assert_eq!(cost_cents(Some(4), Some(CommonResolution::TenEightyP), false), 200);
    }

    #[test]
    fn p1080_8s_is_400() { assert_eq!(cost_cents(Some(8), Some(CommonResolution::TenEightyP), false), 400); }

    #[test]
    fn p1080_12s_is_600() { assert_eq!(cost_cents(Some(12), Some(CommonResolution::TenEightyP), false), 600); }

    #[test]
    fn t2v_default_resolution_priced_as_1080p() {
      // T2V with no resolution → fal client defaults to 1080p, so cost = 200¢.
      assert_eq!(cost_cents(Some(4), None, false), 200);
    }

    #[test]
    fn i2v_default_resolution_priced_as_720p() {
      // I2V with no resolution → fal client defaults to auto (720p), so cost = 120¢.
      assert_eq!(cost_cents(Some(4), None, true), 120);
    }
  }

  #[test]
  fn higher_resolution_costs_more() {
    assert!(
      cost_cents(Some(8), Some(CommonResolution::SevenTwentyP), false)
        < cost_cents(Some(8), Some(CommonResolution::TenEightyP), false)
    );
  }

  #[test]
  fn longer_duration_costs_more() {
    let r = Some(CommonResolution::TenEightyP);
    assert!(cost_cents(Some(4), r, false) < cost_cents(Some(8), r, false));
    assert!(cost_cents(Some(8), r, false) < cost_cents(Some(12), r, false));
  }
}

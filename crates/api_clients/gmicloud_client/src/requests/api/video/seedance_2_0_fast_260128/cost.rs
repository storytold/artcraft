use crate::requests::api::video::seedance_2_0_fast_260128::api::Seedance20FastRequest;
use crate::traits::gmicloud_request_cost_calculator_trait::{
  GmiCloudRequestCostCalculator, UsdCents,
};

/// Cost per second of video in tenths of a US cent.
/// GmiCloud Seedance 2.0 Fast is cheaper than the standard model.
const TENTHS_PER_SECOND: u64 = 28;

impl GmiCloudRequestCostCalculator for Seedance20FastRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    let duration_seconds = self.effective_duration_seconds() as u64;
    let tenths = TENTHS_PER_SECOND * duration_seconds;
    tenths.div_ceil(10)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::seedance_2_0_fast_260128::api::{
    Seedance20FastRatio, Seedance20FastRequest,
  };

  fn make_request(duration: Option<u8>) -> Seedance20FastRequest {
    Seedance20FastRequest {
      prompt: "test".to_string(),
      duration,
      resolution: None,
      ratio: None,
      seed: None,
      watermark: None,
      generate_audio: None,
      web_search: None,
      first_frame: None,
      last_frame: None,
      reference_images: None,
      reference_videos: None,
      reference_audios: None,
      reference_asset_ids: None,
    }
  }

  #[test]
  fn cost_default_duration() {
    // Default 5s: 28 * 5 = 140 tenths = 14 cents
    assert_eq!(make_request(None).calculate_cost_in_cents(), 14);
  }

  #[test]
  fn cost_four_seconds() {
    // 28 * 4 = 112 tenths = 12 cents (rounded up)
    assert_eq!(make_request(Some(4)).calculate_cost_in_cents(), 12);
  }

  #[test]
  fn cost_five_seconds() {
    assert_eq!(make_request(Some(5)).calculate_cost_in_cents(), 14);
  }

  #[test]
  fn cost_ten_seconds() {
    // 28 * 10 = 280 tenths = 28 cents
    assert_eq!(make_request(Some(10)).calculate_cost_in_cents(), 28);
  }

  #[test]
  fn cost_fifteen_seconds() {
    // 28 * 15 = 420 tenths = 42 cents
    assert_eq!(make_request(Some(15)).calculate_cost_in_cents(), 42);
  }

  #[test]
  fn cost_is_independent_of_ratio() {
    let ratios = [
      Seedance20FastRatio::Landscape16x9,
      Seedance20FastRatio::Portrait9x16,
      Seedance20FastRatio::Square,
      Seedance20FastRatio::Standard4x3,
      Seedance20FastRatio::Portrait3x4,
      Seedance20FastRatio::UltraWide21x9,
      Seedance20FastRatio::Adaptive,
    ];
    for ratio in ratios {
      let mut request = make_request(Some(5));
      request.ratio = Some(ratio);
      assert_eq!(request.calculate_cost_in_cents(), 14, "{ratio:?}");
    }
  }

  #[test]
  fn fast_is_cheaper_than_standard() {
    use crate::requests::api::video::seedance_2_0_260128::api::Seedance20Request;
    use crate::traits::gmicloud_request_cost_calculator_trait::GmiCloudRequestCostCalculator;

    let standard = Seedance20Request {
      prompt: "test".to_string(),
      duration: Some(5),
      resolution: None,
      ratio: None,
      seed: None,
      watermark: None,
      generate_audio: None,
      web_search: None,
      first_frame: None,
      last_frame: None,
      reference_images: None,
      reference_videos: None,
      reference_audios: None,
      reference_asset_ids: None,
    };

    let fast = make_request(Some(5));

    assert!(
      fast.calculate_cost_in_cents() < standard.calculate_cost_in_cents(),
      "Fast ({}¢) should be cheaper than Standard ({}¢)",
      fast.calculate_cost_in_cents(),
      standard.calculate_cost_in_cents(),
    );
  }
}

use crate::requests::api::video::seedance_2_0_260128::api::Seedance20Request;
use crate::traits::gmicloud_request_cost_calculator_trait::{
  GmiCloudRequestCostCalculator, UsdCents,
};

/// Cost per second of video in tenths of a US cent.
/// GmiCloud Seedance 2.0 (standard) pricing at 720p.
const TENTHS_PER_SECOND: u64 = 40;

impl GmiCloudRequestCostCalculator for Seedance20Request {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    let duration_seconds = self.effective_duration_seconds() as u64;
    let tenths = TENTHS_PER_SECOND * duration_seconds;
    tenths.div_ceil(10)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::seedance_2_0_260128::api::Seedance20Ratio;

  fn make_request(duration: Option<u8>) -> Seedance20Request {
    Seedance20Request {
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
    // Default 5s: 40 * 5 = 200 tenths = 20 cents
    assert_eq!(make_request(None).calculate_cost_in_cents(), 20);
  }

  #[test]
  fn cost_four_seconds() {
    // 40 * 4 = 160 tenths = 16 cents
    assert_eq!(make_request(Some(4)).calculate_cost_in_cents(), 16);
  }

  #[test]
  fn cost_five_seconds() {
    assert_eq!(make_request(Some(5)).calculate_cost_in_cents(), 20);
  }

  #[test]
  fn cost_ten_seconds() {
    // 40 * 10 = 400 tenths = 40 cents
    assert_eq!(make_request(Some(10)).calculate_cost_in_cents(), 40);
  }

  #[test]
  fn cost_fifteen_seconds() {
    // 40 * 15 = 600 tenths = 60 cents
    assert_eq!(make_request(Some(15)).calculate_cost_in_cents(), 60);
  }

  #[test]
  fn cost_is_independent_of_ratio() {
    let ratios = [
      Seedance20Ratio::Landscape16x9,
      Seedance20Ratio::Portrait9x16,
      Seedance20Ratio::Square,
      Seedance20Ratio::Standard4x3,
      Seedance20Ratio::Portrait3x4,
      Seedance20Ratio::UltraWide21x9,
      Seedance20Ratio::Adaptive,
    ];
    for ratio in ratios {
      let mut request = make_request(Some(5));
      request.ratio = Some(ratio);
      assert_eq!(request.calculate_cost_in_cents(), 20, "{ratio:?}");
    }
  }
}

use crate::requests::api::video::seedance_2_0_fast_260128::api::{
  Seedance20FastDuration, Seedance20FastRequest,
};
use crate::traits::gmicloud_request_cost_calculator_trait::{
  GmiCloudRequestCostCalculator, UsdCents,
};

/// Default duration when not specified.
const DEFAULT_DURATION_SECONDS: u8 = 5;

/// Cost per second of video in tenths of a US cent.
/// GmiCloud Seedance 2.0 Fast is cheaper than the standard model.
const TENTHS_PER_SECOND: u64 = 28;

impl GmiCloudRequestCostCalculator for Seedance20FastRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    let duration_seconds = self.duration
      .map(|d| d.to_seconds())
      .unwrap_or(DEFAULT_DURATION_SECONDS) as u64;

    let tenths = TENTHS_PER_SECOND * duration_seconds;
    tenths.div_ceil(10)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::seedance_2_0_fast_260128::api::Seedance20FastAspectRatio;

  fn make_request(duration: Option<Seedance20FastDuration>) -> Seedance20FastRequest {
    Seedance20FastRequest {
      prompt: "test".to_string(),
      duration,
      aspect_ratio: None,
      negative_prompt: None,
      start_frame_url: None,
      seed: None,
    }
  }

  #[test]
  fn cost_default_duration() {
    // Default 5s: 28 * 5 = 140 tenths = 14 cents
    assert_eq!(make_request(None).calculate_cost_in_cents(), 14);
  }

  #[test]
  fn cost_five_seconds() {
    assert_eq!(
      make_request(Some(Seedance20FastDuration::FiveSeconds)).calculate_cost_in_cents(),
      14,
    );
  }

  #[test]
  fn cost_ten_seconds() {
    // 28 * 10 = 280 tenths = 28 cents
    assert_eq!(
      make_request(Some(Seedance20FastDuration::TenSeconds)).calculate_cost_in_cents(),
      28,
    );
  }

  #[test]
  fn cost_is_independent_of_aspect_ratio() {
    let aspect_ratios = [
      Seedance20FastAspectRatio::Landscape16x9,
      Seedance20FastAspectRatio::Portrait9x16,
      Seedance20FastAspectRatio::Square,
      Seedance20FastAspectRatio::Standard4x3,
      Seedance20FastAspectRatio::Portrait3x4,
      Seedance20FastAspectRatio::UltraWide21x9,
    ];
    for ar in aspect_ratios {
      let request = Seedance20FastRequest {
        prompt: "test".to_string(),
        duration: Some(Seedance20FastDuration::FiveSeconds),
        aspect_ratio: Some(ar),
        negative_prompt: None,
        start_frame_url: None,
        seed: None,
      };
      assert_eq!(request.calculate_cost_in_cents(), 14, "{ar:?}");
    }
  }

  #[test]
  fn fast_is_cheaper_than_standard() {
    use crate::requests::api::video::seedance_2_0_260128::api::{
      Seedance20Duration, Seedance20Request,
    };
    use crate::traits::gmicloud_request_cost_calculator_trait::GmiCloudRequestCostCalculator;

    let standard = Seedance20Request {
      prompt: "test".to_string(),
      duration: Some(Seedance20Duration::FiveSeconds),
      aspect_ratio: None,
      negative_prompt: None,
      start_frame_url: None,
      seed: None,
    };

    let fast = make_request(Some(Seedance20FastDuration::FiveSeconds));

    assert!(
      fast.calculate_cost_in_cents() < standard.calculate_cost_in_cents(),
      "Fast ({}¢) should be cheaper than Standard ({}¢)",
      fast.calculate_cost_in_cents(),
      standard.calculate_cost_in_cents(),
    );
  }
}

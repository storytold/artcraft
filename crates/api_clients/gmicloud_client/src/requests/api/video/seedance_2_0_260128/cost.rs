use crate::requests::api::video::seedance_2_0_260128::api::{
  Seedance20Duration, Seedance20Request,
};
use crate::traits::gmicloud_request_cost_calculator_trait::{
  GmiCloudRequestCostCalculator, UsdCents,
};

/// Default duration when not specified.
const DEFAULT_DURATION_SECONDS: u8 = 5;

/// Cost per second of video in tenths of a US cent.
/// GmiCloud Seedance 2.0 (standard) pricing.
const TENTHS_PER_SECOND: u64 = 40;

impl GmiCloudRequestCostCalculator for Seedance20Request {
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
  use crate::requests::api::video::seedance_2_0_260128::api::Seedance20AspectRatio;

  fn make_request(duration: Option<Seedance20Duration>) -> Seedance20Request {
    Seedance20Request {
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
    // Default 5s: 40 * 5 = 200 tenths = 20 cents
    assert_eq!(make_request(None).calculate_cost_in_cents(), 20);
  }

  #[test]
  fn cost_five_seconds() {
    assert_eq!(
      make_request(Some(Seedance20Duration::FiveSeconds)).calculate_cost_in_cents(),
      20,
    );
  }

  #[test]
  fn cost_ten_seconds() {
    // 40 * 10 = 400 tenths = 40 cents
    assert_eq!(
      make_request(Some(Seedance20Duration::TenSeconds)).calculate_cost_in_cents(),
      40,
    );
  }

  #[test]
  fn cost_is_independent_of_aspect_ratio() {
    let aspect_ratios = [
      Seedance20AspectRatio::Landscape16x9,
      Seedance20AspectRatio::Portrait9x16,
      Seedance20AspectRatio::Square,
      Seedance20AspectRatio::Standard4x3,
      Seedance20AspectRatio::Portrait3x4,
      Seedance20AspectRatio::UltraWide21x9,
    ];
    for ar in aspect_ratios {
      let request = Seedance20Request {
        prompt: "test".to_string(),
        duration: Some(Seedance20Duration::FiveSeconds),
        aspect_ratio: Some(ar),
        negative_prompt: None,
        start_frame_url: None,
        seed: None,
      };
      assert_eq!(request.calculate_cost_in_cents(), 20, "{ar:?}");
    }
  }
}

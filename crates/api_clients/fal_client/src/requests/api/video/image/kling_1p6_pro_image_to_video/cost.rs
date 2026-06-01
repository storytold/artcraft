use crate::requests::api::video::image::kling_1p6_pro_image_to_video::api::{
  Kling1p6ProImageToVideoDuration, Kling1p6ProImageToVideoRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Kling1p6ProImageToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Kling 1.6 Pro image-to-video: $0.095/second.
    //
    // Rate is 95 tenths-of-cents per second; round up to whole cents at the
    // end so the user is never undercharged.
    let duration_secs = self.duration
      .unwrap_or(Kling1p6ProImageToVideoDuration::FiveSeconds)
      .to_seconds();
    (95u64 * duration_secs + 9) / 10
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::image::kling_1p6_pro_image_to_video::api::{
    Kling1p6ProImageToVideoAspectRatio, Kling1p6ProImageToVideoDuration,
  };

  fn make_request(
    duration: Option<Kling1p6ProImageToVideoDuration>,
  ) -> Kling1p6ProImageToVideoRequest {
    Kling1p6ProImageToVideoRequest {
      prompt: "test".to_string(),
      image_url: "https://example.com/image.jpg".to_string(),
      end_image_url: None,
      negative_prompt: None,
      duration,
      aspect_ratio: Some(Kling1p6ProImageToVideoAspectRatio::SixteenByNine),
      cfg_scale: None,
    }
  }

  // Pricing: $0.095/sec = 95 tenths-of-cents/sec.
  // Cents per duration = ceil(95 × secs / 10).

  #[test]
  fn five_seconds() {
    // (95 * 5 + 9) / 10 = 48 (round up from 47.5¢)
    assert_eq!(
      make_request(Some(Kling1p6ProImageToVideoDuration::FiveSeconds))
        .calculate_cost_in_cents(),
      48,
    );
  }

  #[test]
  fn ten_seconds() {
    // (95 * 10 + 9) / 10 = 95
    assert_eq!(
      make_request(Some(Kling1p6ProImageToVideoDuration::TenSeconds))
        .calculate_cost_in_cents(),
      95,
    );
  }

  #[test]
  fn default_duration_is_five_seconds() {
    // duration=None → 5s → 48¢
    assert_eq!(make_request(None).calculate_cost_in_cents(), 48);
  }

  #[test]
  fn ten_seconds_costs_more_than_five() {
    let five = make_request(Some(Kling1p6ProImageToVideoDuration::FiveSeconds))
      .calculate_cost_in_cents();
    let ten = make_request(Some(Kling1p6ProImageToVideoDuration::TenSeconds))
      .calculate_cost_in_cents();
    assert!(five < ten, "five={five}¢ < ten={ten}¢");
  }
}

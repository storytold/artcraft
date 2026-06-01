use crate::requests::api::video::text::kling_1p6_pro_text_to_video::api::{
  Kling1p6ProTextToVideoDuration, Kling1p6ProTextToVideoRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Kling1p6ProTextToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Kling 1.6 Pro text-to-video: $0.098/second
    // (see https://fal.ai/models/fal-ai/kling-video/v1.6/pro/text-to-video).
    //
    // Slightly pricier than the image-to-video variant of the same model
    // (which is $0.095/sec). Rate held in tenths-of-cents and rounded up to
    // whole cents at the end so the user is never undercharged.
    let duration_secs = self.duration
      .unwrap_or(Kling1p6ProTextToVideoDuration::FiveSeconds)
      .to_seconds();
    (98u64 * duration_secs + 9) / 10
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::text::kling_1p6_pro_text_to_video::api::{
    Kling1p6ProTextToVideoAspectRatio, Kling1p6ProTextToVideoDuration,
  };
  use crate::requests::api::video::image::kling_1p6_pro_image_to_video::api::{
    Kling1p6ProImageToVideoAspectRatio, Kling1p6ProImageToVideoDuration,
    Kling1p6ProImageToVideoRequest,
  };

  fn make_request(
    duration: Option<Kling1p6ProTextToVideoDuration>,
  ) -> Kling1p6ProTextToVideoRequest {
    Kling1p6ProTextToVideoRequest {
      prompt: "test".to_string(),
      negative_prompt: None,
      duration,
      aspect_ratio: Some(Kling1p6ProTextToVideoAspectRatio::SixteenByNine),
      cfg_scale: None,
    }
  }

  // Pricing: $0.098/sec = 98 tenths-of-cents/sec.
  // Cents per duration = ceil(98 × secs / 10).

  #[test]
  fn five_seconds() {
    // (98 * 5 + 9) / 10 = 49 (round up from 49.0¢)
    assert_eq!(
      make_request(Some(Kling1p6ProTextToVideoDuration::FiveSeconds))
        .calculate_cost_in_cents(),
      49,
    );
  }

  #[test]
  fn ten_seconds() {
    // (98 * 10 + 9) / 10 = 98
    assert_eq!(
      make_request(Some(Kling1p6ProTextToVideoDuration::TenSeconds))
        .calculate_cost_in_cents(),
      98,
    );
  }

  #[test]
  fn default_duration_is_five_seconds() {
    // duration=None → 5s → 49¢
    assert_eq!(make_request(None).calculate_cost_in_cents(), 49);
  }

  #[test]
  fn ten_seconds_costs_more_than_five() {
    let five = make_request(Some(Kling1p6ProTextToVideoDuration::FiveSeconds))
      .calculate_cost_in_cents();
    let ten = make_request(Some(Kling1p6ProTextToVideoDuration::TenSeconds))
      .calculate_cost_in_cents();
    assert!(five < ten, "five={five}¢ < ten={ten}¢");
  }

  /// Sanity: text-to-video should be slightly more expensive than
  /// image-to-video at every supported duration ($0.098 vs $0.095 per
  /// second). Protects against accidentally swapping the rates.
  #[test]
  fn text_to_video_is_pricier_than_image_to_video_at_each_duration() {
    fn i2v(duration: Kling1p6ProImageToVideoDuration) -> u64 {
      Kling1p6ProImageToVideoRequest {
        prompt: "test".to_string(),
        image_url: "https://example.com/i.png".to_string(),
        end_image_url: None,
        negative_prompt: None,
        duration: Some(duration),
        aspect_ratio: Some(Kling1p6ProImageToVideoAspectRatio::SixteenByNine),
        cfg_scale: None,
      }.calculate_cost_in_cents()
    }
    let pairs = [
      (Kling1p6ProTextToVideoDuration::FiveSeconds, Kling1p6ProImageToVideoDuration::FiveSeconds),
      (Kling1p6ProTextToVideoDuration::TenSeconds,  Kling1p6ProImageToVideoDuration::TenSeconds),
    ];
    for (t, i) in pairs {
      let text = make_request(Some(t)).calculate_cost_in_cents();
      let image = i2v(i);
      assert!(text > image, "text-to-video ({text}¢) must be > image-to-video ({image}¢) at {t:?}");
    }
  }
}

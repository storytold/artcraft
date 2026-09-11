use crate::requests::api::video::image::kling_3p0_standard_image_to_video::api::{
  Kling3p0StandardImageToVideoDuration, Kling3p0StandardImageToVideoRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Kling3p0StandardImageToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Same pricing as text-to-video for Kling 3.0 Standard:
    //   Audio off: $0.168/second
    //   Audio on:  $0.252/second
    let generate_audio = self.generate_audio.unwrap_or(true);
    let duration_secs = self.duration
      .unwrap_or(Kling3p0StandardImageToVideoDuration::FiveSeconds)
      .to_seconds();

    // Rate in tenths-of-cents per second, rounded up
    let rate = if generate_audio { 252u64 } else { 168u64 };
    (rate * duration_secs + 9) / 10
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::image::kling_3p0_standard_image_to_video::api::{
    Kling3p0StandardImageToVideoAspectRatio, Kling3p0StandardImageToVideoDuration,
  };

  fn make_request(
    generate_audio: Option<bool>,
    duration: Option<Kling3p0StandardImageToVideoDuration>,
  ) -> Kling3p0StandardImageToVideoRequest {
    Kling3p0StandardImageToVideoRequest {
      prompt: "test".to_string(),
      image_url: "https://example.com/image.jpg".to_string(),
      end_image_url: None,
      generate_audio,
      negative_prompt: None,
      duration,
      aspect_ratio: Some(Kling3p0StandardImageToVideoAspectRatio::SixteenByNine),
      shot_type: None,
    }
  }

  mod audio_off {
    use super::*;

    // Audio off: $0.168/sec → rate = 168 tenths-of-cents/sec

    #[test]
    fn five_seconds() {
      // (168 * 5 + 9) / 10 = 84
      assert_eq!(make_request(Some(false), Some(Kling3p0StandardImageToVideoDuration::FiveSeconds)).calculate_cost_in_cents(), 84);
    }

    #[test]
    fn ten_seconds() {
      // (168 * 10 + 9) / 10 = 168
      assert_eq!(make_request(Some(false), Some(Kling3p0StandardImageToVideoDuration::TenSeconds)).calculate_cost_in_cents(), 168);
    }

    #[test]
    fn fifteen_seconds() {
      // (168 * 15 + 9) / 10 = 252
      assert_eq!(make_request(Some(false), Some(Kling3p0StandardImageToVideoDuration::FifteenSeconds)).calculate_cost_in_cents(), 252);
    }
  }

  mod audio_on {
    use super::*;

    // Audio on: $0.252/sec → rate = 252 tenths-of-cents/sec

    #[test]
    fn five_seconds() {
      // (252 * 5 + 9) / 10 = 126
      assert_eq!(make_request(Some(true), Some(Kling3p0StandardImageToVideoDuration::FiveSeconds)).calculate_cost_in_cents(), 126);
    }

    #[test]
    fn ten_seconds() {
      // (252 * 10 + 9) / 10 = 252
      assert_eq!(make_request(Some(true), Some(Kling3p0StandardImageToVideoDuration::TenSeconds)).calculate_cost_in_cents(), 252);
    }
  }

  mod defaults {
    use super::*;

    #[test]
    fn default_audio_is_on() {
      // generate_audio=None defaults to true (audio on)
      // duration=5s: (252 * 5 + 9) / 10 = 126
      assert_eq!(make_request(None, Some(Kling3p0StandardImageToVideoDuration::FiveSeconds)).calculate_cost_in_cents(), 126);
    }

    #[test]
    fn default_duration_is_five_seconds() {
      // duration=None defaults to 5s
      // audio off: (168 * 5 + 9) / 10 = 84
      assert_eq!(make_request(Some(false), None).calculate_cost_in_cents(), 84);
    }

    #[test]
    fn both_defaults() {
      // audio on + 5s: (252 * 5 + 9) / 10 = 126
      assert_eq!(make_request(None, None).calculate_cost_in_cents(), 126);
    }
  }
}

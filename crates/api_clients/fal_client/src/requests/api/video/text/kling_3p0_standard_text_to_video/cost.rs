use crate::requests::api::video::text::kling_3p0_standard_text_to_video::api::{
  Kling3p0StandardTextToVideoDuration, Kling3p0StandardTextToVideoRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Kling3p0StandardTextToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Kling 3.0 Standard pricing:
    //   Audio off: $0.168/second
    //   Audio on:  $0.252/second
    let generate_audio = self.generate_audio.unwrap_or(true);
    let duration_secs = self.duration
      .unwrap_or(Kling3p0StandardTextToVideoDuration::FiveSeconds)
      .to_seconds();

    // Rate in tenths-of-cents per second, rounded up
    let rate = if generate_audio { 252u64 } else { 168u64 };
    (rate * duration_secs + 9) / 10
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::text::kling_3p0_standard_text_to_video::api::{
    Kling3p0StandardTextToVideoAspectRatio, Kling3p0StandardTextToVideoDuration,
  };

  fn make_request(
    generate_audio: Option<bool>,
    duration: Option<Kling3p0StandardTextToVideoDuration>,
  ) -> Kling3p0StandardTextToVideoRequest {
    Kling3p0StandardTextToVideoRequest {
      prompt: "test".to_string(),
      generate_audio,
      negative_prompt: None,
      duration,
      aspect_ratio: Some(Kling3p0StandardTextToVideoAspectRatio::SixteenByNine),
      shot_type: None,
    }
  }

  mod audio_off {
    use super::*;

    // Audio off: $0.168/sec → rate = 168 tenths-of-cents/sec

    #[test]
    fn three_seconds() {
      // (168 * 3 + 9) / 10 = 51
      assert_eq!(make_request(Some(false), Some(Kling3p0StandardTextToVideoDuration::ThreeSeconds)).calculate_cost_in_cents(), 51);
    }

    #[test]
    fn five_seconds() {
      // (168 * 5 + 9) / 10 = 84
      assert_eq!(make_request(Some(false), Some(Kling3p0StandardTextToVideoDuration::FiveSeconds)).calculate_cost_in_cents(), 84);
    }

    #[test]
    fn ten_seconds() {
      // (168 * 10 + 9) / 10 = 168
      assert_eq!(make_request(Some(false), Some(Kling3p0StandardTextToVideoDuration::TenSeconds)).calculate_cost_in_cents(), 168);
    }

    #[test]
    fn fifteen_seconds() {
      // (168 * 15 + 9) / 10 = 252
      assert_eq!(make_request(Some(false), Some(Kling3p0StandardTextToVideoDuration::FifteenSeconds)).calculate_cost_in_cents(), 252);
    }
  }

  mod audio_on {
    use super::*;

    // Audio on: $0.252/sec → rate = 252 tenths-of-cents/sec

    #[test]
    fn five_seconds() {
      // (252 * 5 + 9) / 10 = 126
      assert_eq!(make_request(Some(true), Some(Kling3p0StandardTextToVideoDuration::FiveSeconds)).calculate_cost_in_cents(), 126);
    }

    #[test]
    fn ten_seconds() {
      // (252 * 10 + 9) / 10 = 252
      assert_eq!(make_request(Some(true), Some(Kling3p0StandardTextToVideoDuration::TenSeconds)).calculate_cost_in_cents(), 252);
    }

    #[test]
    fn fifteen_seconds() {
      // (252 * 15 + 9) / 10 = 378
      assert_eq!(make_request(Some(true), Some(Kling3p0StandardTextToVideoDuration::FifteenSeconds)).calculate_cost_in_cents(), 378);
    }
  }

  mod defaults {
    use super::*;

    #[test]
    fn default_audio_is_on() {
      // generate_audio=None defaults to true (audio on)
      // duration=5s default: (252 * 5 + 9) / 10 = 126
      assert_eq!(make_request(None, Some(Kling3p0StandardTextToVideoDuration::FiveSeconds)).calculate_cost_in_cents(), 126);
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

use crate::requests::api::video::image::vidu_q3_turbo::api::{
  ViduQ3TurboImageToVideoRequest, ViduQ3TurboImageToVideoResolution,
};
use crate::requests::api::video::text::vidu_q3_turbo::cost::{
  vidu_q3_turbo_cost_cents, vidu_q3_turbo_rate_tenth_cents_per_sec,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Image-to-video shares the Vidu Q3 Turbo per-second pricing (see the text
// module for the canonical rate table):
//   360p / 540p:  $0.035/sec
//   720p / 1080p: $0.077/sec  (2.2×)
// Pricing depends on resolution and duration only.

impl FalRequestCostCalculator for ViduQ3TurboImageToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 5s, resolution = 720p.
    let duration_secs = u64::from(self.duration.unwrap_or(5));
    let is_high_res = self.resolution
      .unwrap_or(ViduQ3TurboImageToVideoResolution::SevenTwentyP)
      .is_high_res();

    let rate = vidu_q3_turbo_rate_tenth_cents_per_sec(is_high_res);
    vidu_q3_turbo_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(
    duration: Option<u8>,
    resolution: Option<ViduQ3TurboImageToVideoResolution>,
  ) -> ViduQ3TurboImageToVideoRequest {
    ViduQ3TurboImageToVideoRequest {
      prompt: "test".to_string(),
      image_url: "https://example.com/x.png".to_string(),
      end_image_url: None,
      duration,
      seed: None,
      resolution,
      audio: Some(true),
    }
  }

  mod cost_table {
    use super::*;

    // (duration, resolution, expected_cents)
    const COST_TABLE: &[(Option<u8>, Option<ViduQ3TurboImageToVideoResolution>, u64)] = &[
      (Some(5),  Some(ViduQ3TurboImageToVideoResolution::ThreeSixtyP),  18), // 17.5 → 18
      (Some(5),  Some(ViduQ3TurboImageToVideoResolution::FiveFortyP),   18),
      (Some(5),  Some(ViduQ3TurboImageToVideoResolution::SevenTwentyP), 39), // 38.5 → 39
      (Some(5),  Some(ViduQ3TurboImageToVideoResolution::TenEightyP),   39),
      (Some(10), Some(ViduQ3TurboImageToVideoResolution::SevenTwentyP), 77),
      // Defaults: duration=None→5s, resolution=None→720p
      (None, None, 39),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, resolution, expected) in COST_TABLE {
        let got = make_request(duration, resolution).calculate_cost_in_cents();
        assert_eq!(got, expected, "duration={duration:?} resolution={resolution:?}");
      }
    }

    /// An end frame does not change the bill (only resolution + duration do).
    #[test]
    fn cost_is_independent_of_end_frame() {
      let without = make_request(Some(8), Some(ViduQ3TurboImageToVideoResolution::SevenTwentyP)).calculate_cost_in_cents();
      let with = ViduQ3TurboImageToVideoRequest {
        end_image_url: Some("https://example.com/end.png".to_string()),
        ..make_request(Some(8), Some(ViduQ3TurboImageToVideoResolution::SevenTwentyP))
      }.calculate_cost_in_cents();
      assert_eq!(without, with);
    }
  }
}

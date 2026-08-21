use crate::requests::api::video::reference::vidu_q3_reference_to_video::api::{
  ViduQ3ReferenceToVideoRequest, ViduQ3ReferenceToVideoResolution,
};
use crate::requests::api::video::text::vidu_q3::cost::{vidu_q3_cost_cents, vidu_q3_rate_tenth_cents_per_sec};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Reference-to-video shares the Vidu Q3 per-second pricing (see the text module
// for the canonical rate table):
//   360p / 540p:  $0.07/sec
//   720p / 1080p: $0.154/sec  (2.2×)
// Pricing depends on resolution and duration only.

impl FalRequestCostCalculator for ViduQ3ReferenceToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 5s, resolution = 720p.
    let duration_secs = u64::from(self.duration.unwrap_or(5));
    let is_high_res = self.resolution
      .unwrap_or(ViduQ3ReferenceToVideoResolution::SevenTwentyP)
      .is_high_res();

    let rate = vidu_q3_rate_tenth_cents_per_sec(is_high_res);
    vidu_q3_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(
    duration: Option<u8>,
    resolution: Option<ViduQ3ReferenceToVideoResolution>,
  ) -> ViduQ3ReferenceToVideoRequest {
    ViduQ3ReferenceToVideoRequest {
      prompt: "test".to_string(),
      reference_image_urls: vec!["https://example.com/a.png".to_string()],
      duration,
      seed: None,
      aspect_ratio: None,
      resolution,
      audio: Some(true),
    }
  }

  mod cost_table {
    use super::*;

    // (duration, resolution, expected_cents)
    const COST_TABLE: &[(Option<u8>, Option<ViduQ3ReferenceToVideoResolution>, u64)] = &[
      (Some(5),  Some(ViduQ3ReferenceToVideoResolution::ThreeSixtyP),  35),
      (Some(5),  Some(ViduQ3ReferenceToVideoResolution::FiveFortyP),   35),
      (Some(5),  Some(ViduQ3ReferenceToVideoResolution::SevenTwentyP), 77),
      (Some(5),  Some(ViduQ3ReferenceToVideoResolution::TenEightyP),   77),
      (Some(10), Some(ViduQ3ReferenceToVideoResolution::SevenTwentyP), 154),
      (Some(3),  Some(ViduQ3ReferenceToVideoResolution::SevenTwentyP), 47), // 46.2 → 47
      // Defaults: duration=None→5s, resolution=None→720p
      (None, None, 77),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, resolution, expected) in COST_TABLE {
        let got = make_request(duration, resolution).calculate_cost_in_cents();
        assert_eq!(got, expected, "duration={duration:?} resolution={resolution:?}");
      }
    }

    /// The number of reference images does not affect the bill.
    #[test]
    fn cost_is_independent_of_image_count() {
      let one = make_request(Some(8), Some(ViduQ3ReferenceToVideoResolution::SevenTwentyP)).calculate_cost_in_cents();
      let four = ViduQ3ReferenceToVideoRequest {
        reference_image_urls: vec![
          "https://example.com/a.png".to_string(),
          "https://example.com/b.png".to_string(),
          "https://example.com/c.png".to_string(),
          "https://example.com/d.png".to_string(),
        ],
        ..make_request(Some(8), Some(ViduQ3ReferenceToVideoResolution::SevenTwentyP))
      }.calculate_cost_in_cents();
      assert_eq!(one, four);
    }
  }
}

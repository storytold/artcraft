use crate::requests::api::video::keyframes::flux_3::api::Flux3KeyframesToVideoRequest;
use crate::requests::api::video::text::flux_3::cost::{
  flux_3_is_1080p, flux_3_standard_rate_cents_per_sec, flux_3_video_cost_cents,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Keyframes-to-video shares the standard Flux 3 per-second pricing (see the
// text module for the canonical rate table):
//   720p:  $0.17/sec
//   1080p: $0.29/sec
// Keyframe images are free; pricing depends on resolution and duration only.

impl FalRequestCostCalculator for Flux3KeyframesToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal default when unset: duration = 5s.
    let duration_secs = u64::from(self.duration.unwrap_or(5));
    let rate = flux_3_standard_rate_cents_per_sec(flux_3_is_1080p(self.resolution));
    flux_3_video_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::keyframes::flux_3::raw_request::Flux3Keyframe;
  use crate::requests::api::video::text::flux_3::api::Flux3Resolution;

  fn make_request(
    duration: Option<u8>,
    resolution: Option<Flux3Resolution>,
    keyframe_count: u32,
  ) -> Flux3KeyframesToVideoRequest {
    Flux3KeyframesToVideoRequest {
      prompt: "test".to_string(),
      keyframes: (0..keyframe_count)
        .map(|i| Flux3Keyframe {
          image_url: format!("https://example.com/kf-{i}.png"),
          frame_index: i * 24,
        })
        .collect(),
      duration,
      resolution,
      aspect_ratio: None,
      generate_audio: None,
      safety_tolerance: None,
    }
  }

  mod cost_table {
    use super::*;

    // (duration, resolution, expected_cents)
    const COST_TABLE: &[(Option<u8>, Option<Flux3Resolution>, u64)] = &[
      (Some(5),  Some(Flux3Resolution::SevenTwentyP), 85),
      (Some(20), Some(Flux3Resolution::SevenTwentyP), 340),
      (Some(5),  Some(Flux3Resolution::TenEightyP), 145),
      (Some(20), Some(Flux3Resolution::TenEightyP), 580),
      // Defaults: duration=None→5s, resolution=None→720p
      (None, None, 85),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, resolution, expected) in COST_TABLE {
        let got = make_request(duration, resolution, 2).calculate_cost_in_cents();
        assert_eq!(got, expected, "duration={duration:?} resolution={resolution:?}");
      }
    }

    /// The number of keyframes does not affect the bill.
    #[test]
    fn cost_is_independent_of_keyframe_count() {
      let one = make_request(Some(10), None, 1).calculate_cost_in_cents();
      let ten = make_request(Some(10), None, 10).calculate_cost_in_cents();
      assert_eq!(one, ten);
    }
  }
}

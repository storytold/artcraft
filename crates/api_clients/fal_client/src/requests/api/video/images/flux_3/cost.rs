use crate::requests::api::video::images::flux_3::api::Flux3FirstLastFrameToVideoRequest;
use crate::requests::api::video::text::flux_3::cost::{
  flux_3_is_1080p, flux_3_standard_rate_cents_per_sec, flux_3_video_cost_cents,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// First-last-frame-to-video shares the standard Flux 3 per-second pricing
// (see the text module for the canonical rate table):
//   720p:  $0.17/sec
//   1080p: $0.29/sec
// The input frames are free; pricing depends on resolution and duration only.

impl FalRequestCostCalculator for Flux3FirstLastFrameToVideoRequest {
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
  use crate::requests::api::video::text::flux_3::api::Flux3Resolution;

  fn make_request(
    duration: Option<u8>,
    resolution: Option<Flux3Resolution>,
  ) -> Flux3FirstLastFrameToVideoRequest {
    Flux3FirstLastFrameToVideoRequest {
      prompt: "test".to_string(),
      start_image_url: "https://example.com/first.png".to_string(),
      end_image_url: "https://example.com/last.png".to_string(),
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
        let got = make_request(duration, resolution).calculate_cost_in_cents();
        assert_eq!(got, expected, "duration={duration:?} resolution={resolution:?}");
      }
    }
  }
}

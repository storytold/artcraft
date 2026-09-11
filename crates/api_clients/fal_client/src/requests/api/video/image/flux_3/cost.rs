use crate::requests::api::video::image::flux_3::api::Flux3ImageToVideoRequest;
use crate::requests::api::video::text::flux_3::cost::{
  flux_3_estimated_duration_secs, flux_3_is_1080p, flux_3_standard_rate_cents_per_sec,
  flux_3_video_cost_cents,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Image-to-video shares the standard Flux 3 per-second pricing (see the text
// module for the canonical rate table):
//   720p:  $0.17/sec
//   1080p: $0.29/sec
// The input image is free; pricing depends on resolution and duration only.

impl FalRequestCostCalculator for Flux3ImageToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    let duration_secs = flux_3_estimated_duration_secs(self.duration);
    let rate = flux_3_standard_rate_cents_per_sec(flux_3_is_1080p(self.resolution));
    flux_3_video_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::text::flux_3::api::{Flux3Duration, Flux3Resolution};

  fn make_request(
    duration: Option<Flux3Duration>,
    resolution: Option<Flux3Resolution>,
  ) -> Flux3ImageToVideoRequest {
    Flux3ImageToVideoRequest {
      prompt: "test".to_string(),
      image_url: "https://example.com/frame.png".to_string(),
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
    const COST_TABLE: &[(Option<Flux3Duration>, Option<Flux3Resolution>, u64)] = &[
      (Some(Flux3Duration::Seconds(5)),  Some(Flux3Resolution::SevenTwentyP), 85),
      (Some(Flux3Duration::Seconds(20)), Some(Flux3Resolution::SevenTwentyP), 340),
      (Some(Flux3Duration::Seconds(5)),  Some(Flux3Resolution::TenEightyP), 145),
      (Some(Flux3Duration::Seconds(20)), Some(Flux3Resolution::TenEightyP), 580),
      // Defaults: duration=None/auto→5s estimate, resolution=None→720p
      (None, None, 85),
      (Some(Flux3Duration::Auto), Some(Flux3Resolution::TenEightyP), 145),
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

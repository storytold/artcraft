use crate::requests::api::video::reference::minimax_h3::api::MinimaxH3ReferenceToVideoRequest;
use crate::requests::api::video::text::minimax_h3::api::MinimaxH3Resolution;
use crate::requests::api::video::text::minimax_h3::cost::{
  minimax_h3_rate_cents_per_sec, minimax_h3_video_cost_cents,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Reference-to-video shares the MiniMax H3 per-second pricing (see the text
// module for the canonical rate table):
//   768P: $0.16/sec
//   2K:   $0.26/sec
// On top of that, the first 5 reference images are free and each additional
// image costs $0.08. Reference videos and audio clips are free.
const FREE_REFERENCE_IMAGES: u64 = 5;
const EXTRA_REFERENCE_IMAGE_CENTS: u64 = 8; // $0.08 per image beyond the first 5

impl FalRequestCostCalculator for MinimaxH3ReferenceToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 5s, resolution = 2K.
    let duration_secs = u64::from(self.duration.unwrap_or(5));
    let is_2k = self.resolution
      .unwrap_or(MinimaxH3Resolution::TwoK)
      .is_2k();

    let rate = minimax_h3_rate_cents_per_sec(is_2k);
    let video_cents = minimax_h3_video_cost_cents(rate, duration_secs);

    let image_count = self.reference_image_urls.as_ref().map_or(0, |urls| urls.len() as u64);
    let extra_image_cents = image_count.saturating_sub(FREE_REFERENCE_IMAGES)
      * EXTRA_REFERENCE_IMAGE_CENTS;

    video_cents + extra_image_cents
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(
    duration: Option<u8>,
    resolution: Option<MinimaxH3Resolution>,
    image_count: usize,
  ) -> MinimaxH3ReferenceToVideoRequest {
    let images = (0..image_count)
      .map(|i| format!("https://example.com/ref_{i}.png"))
      .collect::<Vec<String>>();
    MinimaxH3ReferenceToVideoRequest {
      prompt: "test".to_string(),
      reference_image_urls: if images.is_empty() { None } else { Some(images) },
      reference_video_urls: None,
      reference_audio_urls: None,
      duration,
      resolution,
      aspect_ratio: None,
    }
  }

  mod cost_table {
    use super::*;

    // (duration, resolution, image_count, expected_cents)
    // Math: rate × secs + 8¢ × max(0, images − 5), where rate (cents) = 16
    // (768P) or 26 (2K).
    const COST_TABLE: &[(Option<u8>, Option<MinimaxH3Resolution>, usize, u64)] = &[
      // 768P → $0.16/s; up to 5 reference images are free
      (Some(5),  Some(MinimaxH3Resolution::SevenSixtyEightP), 0, 80),
      (Some(5),  Some(MinimaxH3Resolution::SevenSixtyEightP), 1, 80),
      (Some(5),  Some(MinimaxH3Resolution::SevenSixtyEightP), 5, 80),
      (Some(15), Some(MinimaxH3Resolution::SevenSixtyEightP), 5, 240),
      // 2K → $0.26/s
      (Some(5),  Some(MinimaxH3Resolution::TwoK), 5, 130),
      (Some(15), Some(MinimaxH3Resolution::TwoK), 5, 390),
      // Each image beyond the 5th adds 8¢
      (Some(5), Some(MinimaxH3Resolution::SevenSixtyEightP), 6, 88),
      (Some(5), Some(MinimaxH3Resolution::SevenSixtyEightP), 9, 112), // 80 + 4×8
      (Some(5), Some(MinimaxH3Resolution::TwoK), 6, 138),
      (Some(5), Some(MinimaxH3Resolution::TwoK), 9, 162), // 130 + 4×8
      // Defaults: duration=None→5s, resolution=None→2K
      (None, None, 0, 130),
      (None, None, 9, 162),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, resolution, image_count, expected) in COST_TABLE {
        let got = make_request(duration, resolution, image_count).calculate_cost_in_cents();
        assert_eq!(
          got, expected,
          "duration={duration:?} resolution={resolution:?} images={image_count}");
      }
    }

    #[test]
    fn first_five_images_are_free() {
      let none = make_request(Some(5), Some(MinimaxH3Resolution::TwoK), 0).calculate_cost_in_cents();
      for image_count in 1..=5 {
        let cost = make_request(Some(5), Some(MinimaxH3Resolution::TwoK), image_count).calculate_cost_in_cents();
        assert_eq!(cost, none, "images={image_count} should not change the bill");
      }
    }

    #[test]
    fn each_extra_image_adds_eight_cents() {
      let five = make_request(Some(5), Some(MinimaxH3Resolution::TwoK), 5).calculate_cost_in_cents();
      for (image_count, extra) in [(6, 8), (7, 16), (8, 24), (9, 32)] {
        let cost = make_request(Some(5), Some(MinimaxH3Resolution::TwoK), image_count).calculate_cost_in_cents();
        assert_eq!(cost, five + extra, "images={image_count}");
      }
    }

    /// Reference videos and audio clips do not affect the bill.
    #[test]
    fn cost_ignores_reference_videos_and_audio() {
      let baseline = make_request(Some(5), Some(MinimaxH3Resolution::TwoK), 2).calculate_cost_in_cents();
      let with_extras = MinimaxH3ReferenceToVideoRequest {
        reference_video_urls: Some(vec![
          "https://example.com/a.mp4".to_string(),
          "https://example.com/b.mp4".to_string(),
        ]),
        reference_audio_urls: Some(vec!["https://example.com/a.mp3".to_string()]),
        ..make_request(Some(5), Some(MinimaxH3Resolution::TwoK), 2)
      }.calculate_cost_in_cents();
      assert_eq!(with_extras, baseline);
    }
  }
}

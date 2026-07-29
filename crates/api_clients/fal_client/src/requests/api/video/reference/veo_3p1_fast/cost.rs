use crate::requests::api::video::reference::veo_3p1_fast::api::{
  Veo3p1FastReferenceToVideoDuration, Veo3p1FastReferenceToVideoRequest,
  Veo3p1FastReferenceToVideoResolution,
};
use crate::requests::api::video::text::veo_3p1_fast::cost::{
  veo_3p1_fast_cost_cents, veo_3p1_fast_rate_tenth_cents_per_sec,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// PRICING NOTE — reference-to-video:
//
// fal's reference-to-video llms.txt documents a FLAT rate of $0.10/sec (audio
// off) / $0.15/sec (audio on) and does NOT mention a separate 4k tier — even
// though the endpoint exposes a "4k" resolution option. The sibling
// text/image/first-last endpoints DO document the 4k surcharge
// ($0.30/$0.35). Rather than risk undercharging on 4k reference generations,
// we mirror the rest of the Veo 3.1 Fast family and apply the 4k surcharge
// here too. For 720p/1080p this is identical to fal's documented flat rate;
// only 4k differs. If fal confirms reference-to-video is truly flat at 4k,
// drop the `four_k` branch and always bill the SD rate.

impl FalRequestCostCalculator for Veo3p1FastReferenceToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 8s, resolution = 720p, audio = on.
    let duration_secs = self.duration
      .unwrap_or(Veo3p1FastReferenceToVideoDuration::EightSeconds)
      .to_seconds();
    let four_k = self.resolution
      .unwrap_or(Veo3p1FastReferenceToVideoResolution::SevenTwentyP)
      .is_four_k();
    let audio_on = self.generate_audio.unwrap_or(true);

    let rate = veo_3p1_fast_rate_tenth_cents_per_sec(four_k, audio_on);
    veo_3p1_fast_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(
    duration: Option<Veo3p1FastReferenceToVideoDuration>,
    resolution: Option<Veo3p1FastReferenceToVideoResolution>,
    generate_audio: Option<bool>,
  ) -> Veo3p1FastReferenceToVideoRequest {
    Veo3p1FastReferenceToVideoRequest {
      prompt: "test".to_string(),
      image_urls: vec!["https://example.com/a.png".to_string()],
      aspect_ratio: None,
      duration,
      resolution,
      generate_audio,
      auto_fix: None,
      safety_tolerance: None,
    }
  }

  mod cost_table {
    use super::*;

    // (duration, resolution, generate_audio, expected_cents)
    const COST_TABLE: &[(
      Option<Veo3p1FastReferenceToVideoDuration>,
      Option<Veo3p1FastReferenceToVideoResolution>,
      Option<bool>,
      u64,
    )] = &[
      // 720p/1080p match fal's documented flat rate
      (Some(Veo3p1FastReferenceToVideoDuration::FourSeconds),  Some(Veo3p1FastReferenceToVideoResolution::SevenTwentyP), Some(false), 40),
      (Some(Veo3p1FastReferenceToVideoDuration::FourSeconds),  Some(Veo3p1FastReferenceToVideoResolution::SevenTwentyP), Some(true),  60),
      (Some(Veo3p1FastReferenceToVideoDuration::EightSeconds), Some(Veo3p1FastReferenceToVideoResolution::TenEightyP),   Some(false), 80),
      (Some(Veo3p1FastReferenceToVideoDuration::EightSeconds), Some(Veo3p1FastReferenceToVideoResolution::TenEightyP),   Some(true),  120),
      // 4k applies the family surcharge (see PRICING NOTE)
      (Some(Veo3p1FastReferenceToVideoDuration::EightSeconds), Some(Veo3p1FastReferenceToVideoResolution::FourK),        Some(false), 240),
      (Some(Veo3p1FastReferenceToVideoDuration::EightSeconds), Some(Veo3p1FastReferenceToVideoResolution::FourK),        Some(true),  280),
      (None, None, None, 120),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, resolution, generate_audio, expected) in COST_TABLE {
        let got = make_request(duration, resolution, generate_audio).calculate_cost_in_cents();
        assert_eq!(
          got, expected,
          "duration={duration:?} resolution={resolution:?} audio={generate_audio:?}",
        );
      }
    }

    /// The number of reference images does not affect the bill.
    #[test]
    fn cost_is_independent_of_image_count() {
      let one = Veo3p1FastReferenceToVideoRequest {
        image_urls: vec!["https://example.com/a.png".to_string()],
        ..make_request(Some(Veo3p1FastReferenceToVideoDuration::EightSeconds), Some(Veo3p1FastReferenceToVideoResolution::TenEightyP), Some(true))
      }.calculate_cost_in_cents();
      let many = Veo3p1FastReferenceToVideoRequest {
        image_urls: vec![
          "https://example.com/a.png".to_string(),
          "https://example.com/b.png".to_string(),
          "https://example.com/c.png".to_string(),
        ],
        ..make_request(Some(Veo3p1FastReferenceToVideoDuration::EightSeconds), Some(Veo3p1FastReferenceToVideoResolution::TenEightyP), Some(true))
      }.calculate_cost_in_cents();
      assert_eq!(one, many);
    }
  }
}

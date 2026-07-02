use crate::requests::api::video::image::veo_3p1_fast::api::{
  Veo3p1FastImageToVideoDuration, Veo3p1FastImageToVideoRequest, Veo3p1FastImageToVideoResolution,
};
use crate::requests::api::video::text::veo_3p1_fast::cost::{
  veo_3p1_fast_cost_cents, veo_3p1_fast_rate_tenth_cents_per_sec,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Image-to-video shares the Veo 3.1 Fast per-second pricing (see the text
// module for the canonical rate table):
//   720p / 1080p: $0.10/sec (audio off), $0.15/sec (audio on)
//   4k:           $0.30/sec (audio off), $0.35/sec (audio on)

impl FalRequestCostCalculator for Veo3p1FastImageToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 8s, resolution = 720p, audio = on.
    let duration_secs = self.duration
      .unwrap_or(Veo3p1FastImageToVideoDuration::EightSeconds)
      .to_seconds();
    let four_k = self.resolution
      .unwrap_or(Veo3p1FastImageToVideoResolution::SevenTwentyP)
      .is_four_k();
    let audio_on = self.generate_audio.unwrap_or(true);

    let rate = veo_3p1_fast_rate_tenth_cents_per_sec(four_k, audio_on);
    veo_3p1_fast_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::image::veo_3p1_fast::api::Veo3p1FastImageToVideoAspectRatio;

  fn make_request(
    duration: Option<Veo3p1FastImageToVideoDuration>,
    resolution: Option<Veo3p1FastImageToVideoResolution>,
    generate_audio: Option<bool>,
  ) -> Veo3p1FastImageToVideoRequest {
    Veo3p1FastImageToVideoRequest {
      prompt: "test".to_string(),
      image_url: "https://example.com/x.png".to_string(),
      aspect_ratio: Some(Veo3p1FastImageToVideoAspectRatio::SixteenByNine),
      duration,
      resolution,
      generate_audio,
      negative_prompt: None,
      seed: None,
      auto_fix: None,
      safety_tolerance: None,
    }
  }

  mod cost_table {
    use super::*;

    // (duration, resolution, generate_audio, expected_cents)
    const COST_TABLE: &[(
      Option<Veo3p1FastImageToVideoDuration>,
      Option<Veo3p1FastImageToVideoResolution>,
      Option<bool>,
      u64,
    )] = &[
      (Some(Veo3p1FastImageToVideoDuration::FourSeconds),  Some(Veo3p1FastImageToVideoResolution::SevenTwentyP), Some(false), 40),
      (Some(Veo3p1FastImageToVideoDuration::FourSeconds),  Some(Veo3p1FastImageToVideoResolution::SevenTwentyP), Some(true),  60),
      (Some(Veo3p1FastImageToVideoDuration::EightSeconds), Some(Veo3p1FastImageToVideoResolution::TenEightyP),   Some(false), 80),
      (Some(Veo3p1FastImageToVideoDuration::EightSeconds), Some(Veo3p1FastImageToVideoResolution::TenEightyP),   Some(true),  120),
      (Some(Veo3p1FastImageToVideoDuration::EightSeconds), Some(Veo3p1FastImageToVideoResolution::FourK),        Some(false), 240),
      (Some(Veo3p1FastImageToVideoDuration::EightSeconds), Some(Veo3p1FastImageToVideoResolution::FourK),        Some(true),  280),
      // Defaults: 8s, 720p, audio on
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

    #[test]
    fn cost_is_independent_of_aspect_ratio() {
      let aspect_ratios = [
        Veo3p1FastImageToVideoAspectRatio::Auto,
        Veo3p1FastImageToVideoAspectRatio::SixteenByNine,
        Veo3p1FastImageToVideoAspectRatio::NineBySixteen,
      ];
      let baseline = {
        let mut r = make_request(
          Some(Veo3p1FastImageToVideoDuration::EightSeconds),
          Some(Veo3p1FastImageToVideoResolution::TenEightyP),
          Some(true),
        );
        r.aspect_ratio = Some(aspect_ratios[0]);
        r.calculate_cost_in_cents()
      };
      for ar in aspect_ratios {
        let mut r = make_request(
          Some(Veo3p1FastImageToVideoDuration::EightSeconds),
          Some(Veo3p1FastImageToVideoResolution::TenEightyP),
          Some(true),
        );
        r.aspect_ratio = Some(ar);
        assert_eq!(r.calculate_cost_in_cents(), baseline, "ar={ar:?}");
      }
    }
  }
}

use crate::requests::api::video::image::veo_3_fast::api::{
  Veo3FastImageToVideoDuration, Veo3FastImageToVideoRequest,
};
use crate::requests::api::video::text::veo_3_fast::cost::{
  veo_3_fast_cost_cents, veo_3_fast_rate_tenth_cents_per_sec,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Image-to-video shares the Veo 3 Fast per-second pricing (see the text module
// for the canonical rate table): $0.10/sec (audio off), $0.15/sec (audio on).
// Flat — resolution does not affect the price.

impl FalRequestCostCalculator for Veo3FastImageToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 8s, audio = on.
    let duration_secs = self.duration
      .unwrap_or(Veo3FastImageToVideoDuration::EightSeconds)
      .to_seconds();
    let audio_on = self.generate_audio.unwrap_or(true);

    let rate = veo_3_fast_rate_tenth_cents_per_sec(audio_on);
    veo_3_fast_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::image::veo_3_fast::api::Veo3FastImageToVideoAspectRatio;

  fn make_request(
    duration: Option<Veo3FastImageToVideoDuration>,
    generate_audio: Option<bool>,
  ) -> Veo3FastImageToVideoRequest {
    Veo3FastImageToVideoRequest {
      prompt: "test".to_string(),
      image_url: "https://example.com/x.png".to_string(),
      aspect_ratio: None,
      duration,
      resolution: None,
      generate_audio,
      negative_prompt: None,
      seed: None,
      auto_fix: None,
      safety_tolerance: None,
    }
  }

  mod cost_table {
    use super::*;

    // (duration, generate_audio, expected_cents)
    const COST_TABLE: &[(
      Option<Veo3FastImageToVideoDuration>,
      Option<bool>,
      u64,
    )] = &[
      (Some(Veo3FastImageToVideoDuration::FourSeconds),  Some(false), 40),
      (Some(Veo3FastImageToVideoDuration::FourSeconds),  Some(true),  60),
      (Some(Veo3FastImageToVideoDuration::EightSeconds), Some(false), 80),
      (Some(Veo3FastImageToVideoDuration::EightSeconds), Some(true),  120),
      // Defaults: 8s, audio on
      (None, None, 120),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, generate_audio, expected) in COST_TABLE {
        let got = make_request(duration, generate_audio).calculate_cost_in_cents();
        assert_eq!(got, expected, "duration={duration:?} audio={generate_audio:?}");
      }
    }

    #[test]
    fn cost_is_independent_of_aspect_ratio() {
      let baseline = {
        let mut r = make_request(Some(Veo3FastImageToVideoDuration::EightSeconds), Some(true));
        r.aspect_ratio = Some(Veo3FastImageToVideoAspectRatio::Auto);
        r.calculate_cost_in_cents()
      };
      for ar in [
        Veo3FastImageToVideoAspectRatio::Auto,
        Veo3FastImageToVideoAspectRatio::SixteenByNine,
        Veo3FastImageToVideoAspectRatio::NineBySixteen,
      ] {
        let mut r = make_request(Some(Veo3FastImageToVideoDuration::EightSeconds), Some(true));
        r.aspect_ratio = Some(ar);
        assert_eq!(r.calculate_cost_in_cents(), baseline, "ar={ar:?}");
      }
    }
  }
}

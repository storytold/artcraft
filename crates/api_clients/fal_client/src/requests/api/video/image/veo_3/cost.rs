use crate::requests::api::video::image::veo_3::api::{
  Veo3ImageToVideoDuration, Veo3ImageToVideoRequest,
};
use crate::requests::api::video::text::veo_3::cost::{veo_3_cost_cents, veo_3_rate_tenth_cents_per_sec};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Image-to-video shares the Veo 3 (non-fast) per-second pricing (see the text
// module for the canonical rate table): $0.20/sec (audio off), $0.40/sec
// (audio on). Flat — resolution does not affect the price.

impl FalRequestCostCalculator for Veo3ImageToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 8s, audio = on.
    let duration_secs = self.duration
      .unwrap_or(Veo3ImageToVideoDuration::EightSeconds)
      .to_seconds();
    let audio_on = self.generate_audio.unwrap_or(true);

    let rate = veo_3_rate_tenth_cents_per_sec(audio_on);
    veo_3_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::image::veo_3::api::Veo3ImageToVideoAspectRatio;

  fn make_request(
    duration: Option<Veo3ImageToVideoDuration>,
    generate_audio: Option<bool>,
  ) -> Veo3ImageToVideoRequest {
    Veo3ImageToVideoRequest {
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
      Option<Veo3ImageToVideoDuration>,
      Option<bool>,
      u64,
    )] = &[
      (Some(Veo3ImageToVideoDuration::FourSeconds),  Some(false), 80),
      (Some(Veo3ImageToVideoDuration::FourSeconds),  Some(true),  160),
      (Some(Veo3ImageToVideoDuration::EightSeconds), Some(false), 160),
      (Some(Veo3ImageToVideoDuration::EightSeconds), Some(true),  320),
      // Defaults: 8s, audio on
      (None, None, 320),
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
        let mut r = make_request(Some(Veo3ImageToVideoDuration::EightSeconds), Some(true));
        r.aspect_ratio = Some(Veo3ImageToVideoAspectRatio::Auto);
        r.calculate_cost_in_cents()
      };
      for ar in [
        Veo3ImageToVideoAspectRatio::Auto,
        Veo3ImageToVideoAspectRatio::SixteenByNine,
        Veo3ImageToVideoAspectRatio::NineBySixteen,
      ] {
        let mut r = make_request(Some(Veo3ImageToVideoDuration::EightSeconds), Some(true));
        r.aspect_ratio = Some(ar);
        assert_eq!(r.calculate_cost_in_cents(), baseline, "ar={ar:?}");
      }
    }
  }
}

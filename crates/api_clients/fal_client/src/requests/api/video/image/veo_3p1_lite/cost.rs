use crate::requests::api::video::image::veo_3p1_lite::api::{
  Veo3p1LiteImageToVideoDuration, Veo3p1LiteImageToVideoRequest, Veo3p1LiteImageToVideoResolution,
};
use crate::requests::api::video::text::veo_3p1_lite::cost::{
  veo_3p1_lite_cost_cents, veo_3p1_lite_rate_tenth_cents_per_sec,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Image-to-video shares the Veo 3.1 Lite per-second pricing (see the text
// module for the canonical rate table). Both resolution and audio matter:
//   720p:  $0.03/sec (audio off), $0.05/sec (audio on)
//   1080p: $0.05/sec (audio off), $0.08/sec (audio on)

impl FalRequestCostCalculator for Veo3p1LiteImageToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 8s, resolution = 720p, audio = on.
    let duration_secs = self.duration
      .unwrap_or(Veo3p1LiteImageToVideoDuration::EightSeconds)
      .to_seconds();
    let is_1080p = self.resolution
      .unwrap_or(Veo3p1LiteImageToVideoResolution::SevenTwentyP)
      .is_ten_eighty_p();
    let audio_on = self.generate_audio.unwrap_or(true);

    let rate = veo_3p1_lite_rate_tenth_cents_per_sec(is_1080p, audio_on);
    veo_3p1_lite_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::image::veo_3p1_lite::api::Veo3p1LiteImageToVideoAspectRatio;

  fn make_request(
    duration: Option<Veo3p1LiteImageToVideoDuration>,
    resolution: Option<Veo3p1LiteImageToVideoResolution>,
    generate_audio: Option<bool>,
  ) -> Veo3p1LiteImageToVideoRequest {
    Veo3p1LiteImageToVideoRequest {
      prompt: "test".to_string(),
      image_url: "https://example.com/x.png".to_string(),
      aspect_ratio: None,
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
      Option<Veo3p1LiteImageToVideoDuration>,
      Option<Veo3p1LiteImageToVideoResolution>,
      Option<bool>,
      u64,
    )] = &[
      (Some(Veo3p1LiteImageToVideoDuration::FourSeconds),  Some(Veo3p1LiteImageToVideoResolution::SevenTwentyP), Some(false), 12),
      (Some(Veo3p1LiteImageToVideoDuration::FourSeconds),  Some(Veo3p1LiteImageToVideoResolution::SevenTwentyP), Some(true),  20),
      (Some(Veo3p1LiteImageToVideoDuration::EightSeconds), Some(Veo3p1LiteImageToVideoResolution::SevenTwentyP), Some(true),  40),
      (Some(Veo3p1LiteImageToVideoDuration::EightSeconds), Some(Veo3p1LiteImageToVideoResolution::TenEightyP),   Some(false), 40),
      (Some(Veo3p1LiteImageToVideoDuration::EightSeconds), Some(Veo3p1LiteImageToVideoResolution::TenEightyP),   Some(true),  64),
      // Defaults: 8s, 720p, audio on
      (None, None, None, 40),
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
      let baseline = {
        let mut r = make_request(Some(Veo3p1LiteImageToVideoDuration::EightSeconds), Some(Veo3p1LiteImageToVideoResolution::TenEightyP), Some(true));
        r.aspect_ratio = Some(Veo3p1LiteImageToVideoAspectRatio::Auto);
        r.calculate_cost_in_cents()
      };
      for ar in [
        Veo3p1LiteImageToVideoAspectRatio::Auto,
        Veo3p1LiteImageToVideoAspectRatio::SixteenByNine,
        Veo3p1LiteImageToVideoAspectRatio::NineBySixteen,
      ] {
        let mut r = make_request(Some(Veo3p1LiteImageToVideoDuration::EightSeconds), Some(Veo3p1LiteImageToVideoResolution::TenEightyP), Some(true));
        r.aspect_ratio = Some(ar);
        assert_eq!(r.calculate_cost_in_cents(), baseline, "ar={ar:?}");
      }
    }
  }
}

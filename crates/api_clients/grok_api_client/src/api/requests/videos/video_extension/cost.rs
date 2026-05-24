use crate::api::requests::videos::video_extension::video_extension::VideoExtensionRequest;
use crate::api::requests::videos::video_generation::cost::{
  output_mills_per_second,
  INPUT_MILLS_PER_SECOND_OF_SOURCE_VIDEO,
};
use crate::api::traits::grok_request_cost_calculator_trait::{GrokRequestCostCalculator, UsdMills};
use crate::api::traits::grok_request_source_duration_cost_calculator_trait::GrokRequestSourceDurationCostCalculator;
use crate::api::types::video_types::video_resolution::VideoResolution;

// `video_extension` charges:
//
//   Output: $0.07/sec × extension_duration   (70 mills/sec, since output
//           inherits the source's resolution capped at 720p)
//   Input:  $0.01/sec × source_duration      (10 mills/sec, UNKNOWN to us)
//
// `extension_duration` is the `duration` field on the request (xAI default
// is 6 seconds; range 1–10). `source_duration` is NOT in the request.
//
// Our `calculate_cost_in_mills` therefore returns ONLY the output portion.
// Callers who know the source duration should add:
//
//   source_duration_seconds * INPUT_MILLS_PER_SECOND_OF_SOURCE_VIDEO
//
// to get the true total.

/// xAI default duration for video_extension when `duration` is omitted.
const DEFAULT_EXTENSION_DURATION_SECONDS: u32 = 6;

impl GrokRequestCostCalculator for VideoExtensionRequest {
  /// Output portion is always known (extension duration × 70 mills/sec at
  /// the assumed 720p output).
  ///
  /// Input portion is included **only when**
  /// [`VideoExtensionRequest::source_video_duration_seconds_hint`] is set —
  /// otherwise the source duration is unknown and we'd be guessing.
  ///
  /// Formula:
  /// - hint unset: `extension_duration × 70`
  /// - hint set:   `extension_duration × 70 + source_duration × 10`
  ///
  /// If you have the source resolution too (480p vs 720p), call
  /// [`GrokRequestSourceDurationCostCalculator::calculate_cost_in_mills_with_source_duration`]
  /// directly for an exact figure at the actual rate.
  fn calculate_cost_in_mills(&self) -> UsdMills {
    let extension_duration = self.duration.unwrap_or(DEFAULT_EXTENSION_DURATION_SECONDS) as u64;
    let output_mills = output_mills_per_second(VideoResolution::SevenTwentyP) * extension_duration;
    let input_mills = self
      .source_video_duration_seconds_hint
      .map(|secs| INPUT_MILLS_PER_SECOND_OF_SOURCE_VIDEO * secs as u64)
      .unwrap_or(0);
    output_mills + input_mills
  }
}

impl GrokRequestSourceDurationCostCalculator for VideoExtensionRequest {
  /// Full cost:
  ///
  ///   output: output_mills_per_second(source_resolution) × extension_duration
  ///   input:  10 mills/sec × source_duration
  ///
  /// Output mirrors source resolution (capped at 720p). The `source_resolution`
  /// parameter should be the source's actual resolution; since [`VideoResolution`]
  /// has only 480p and 720p, "capping at 720p" is implicit.
  fn calculate_cost_in_mills_with_source_duration(
    &self,
    source_duration_seconds: u32,
    source_resolution: VideoResolution,
  ) -> UsdMills {
    let extension_duration = self.duration.unwrap_or(DEFAULT_EXTENSION_DURATION_SECONDS) as u64;
    let output_mills = output_mills_per_second(source_resolution) * extension_duration;
    let input_mills = INPUT_MILLS_PER_SECOND_OF_SOURCE_VIDEO * source_duration_seconds as u64;
    output_mills + input_mills
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::requests::videos::video_extension::video_extension::{
    VideoExtensionRequest, VideoExtensionSource,
  };
  use crate::api::types::video_types::video_model::VideoModel;

  fn make_request(
    duration: Option<u32>,
    source: VideoExtensionSource,
    model: Option<VideoModel>,
  ) -> VideoExtensionRequest {
    VideoExtensionRequest {
      prompt: "test".to_string(),
      source_video: source,
      source_video_duration_seconds_hint: None,
      model,
      duration,
    }
  }

  fn url_source() -> VideoExtensionSource {
    VideoExtensionSource::Url("https://example.com/v.mp4".to_string())
  }

  // ── Output portion (the part we CAN compute) ──

  mod output_portion {
    use super::*;

    #[test]
    fn default_duration_is_6_seconds() {
      // 70 × 6 = 420 mills = 42¢
      let req = make_request(None, url_source(), None);
      assert_eq!(req.calculate_cost_in_mills(), 420);
      assert_eq!(req.calculate_cost_in_cents(), 42);
    }

    #[test]
    fn one_second_extension() {
      // 70 × 1 = 70 mills = 7¢
      let req = make_request(Some(1), url_source(), None);
      assert_eq!(req.calculate_cost_in_mills(), 70);
      assert_eq!(req.calculate_cost_in_cents(), 7);
    }

    #[test]
    fn five_second_extension() {
      // 70 × 5 = 350 mills = 35¢
      let req = make_request(Some(5), url_source(), None);
      assert_eq!(req.calculate_cost_in_mills(), 350);
      assert_eq!(req.calculate_cost_in_cents(), 35);
    }

    #[test]
    fn ten_second_extension_is_max() {
      // 70 × 10 = 700 mills = 70¢
      let req = make_request(Some(10), url_source(), None);
      assert_eq!(req.calculate_cost_in_mills(), 700);
      assert_eq!(req.calculate_cost_in_cents(), 70);
    }
  }

  // ── Scaling ──

  mod scaling {
    use super::*;

    #[test]
    fn duration_scales_linearly() {
      for d in 1u32..=10 {
        let req = make_request(Some(d), url_source(), None);
        assert_eq!(req.calculate_cost_in_mills(), 70 * d as u64, "d={d}");
      }
    }
  }

  // ── Independence from non-pricing fields ──

  mod independence {
    use super::*;

    #[test]
    fn cost_is_independent_of_source_kind() {
      let url = make_request(Some(5), VideoExtensionSource::Url("u".to_string()), None);
      let file = make_request(Some(5), VideoExtensionSource::FileId("f".to_string()), None);
      assert_eq!(url.calculate_cost_in_mills(), file.calculate_cost_in_mills());
    }

    #[test]
    fn cost_is_independent_of_model_variant() {
      let mut base = make_request(Some(5), url_source(), None);
      let base_cost = base.calculate_cost_in_mills();
      base.model = Some(VideoModel::GrokImagineVideo);
      assert_eq!(base.calculate_cost_in_mills(), base_cost);
      base.model = Some(VideoModel::Custom("future".to_string()));
      assert_eq!(base.calculate_cost_in_mills(), base_cost);
    }

    #[test]
    fn cost_is_independent_of_prompt_length() {
      let mut base = make_request(Some(5), url_source(), None);
      let base_cost = base.calculate_cost_in_mills();
      base.prompt = "a much longer prompt with many more words to influence pricing... or not".to_string();
      assert_eq!(base.calculate_cost_in_mills(), base_cost);
    }
  }

  // ── Source-duration-aware variant ──

  mod with_source_duration {
    use super::*;

    // ── 720p source (output 70 mills/sec) ──

    mod source_720p {
      use super::*;
      const RES: VideoResolution = VideoResolution::SevenTwentyP;

      #[test]
      fn five_extension_ten_source() {
        // output: 70 × 5 = 350 mills; input: 10 × 10 = 100; total 450
        let req = make_request(Some(5), url_source(), None);
        assert_eq!(req.calculate_cost_in_mills_with_source_duration(10, RES), 450);
        assert_eq!(req.calculate_cost_in_cents_with_source_duration(10, RES), 45);
      }

      #[test]
      fn default_extension_five_source() {
        // default ext=6s: output 70 × 6 = 420; input 10 × 5 = 50; total 470
        let req = make_request(None, url_source(), None);
        assert_eq!(req.calculate_cost_in_mills_with_source_duration(5, RES), 470);
        assert_eq!(req.calculate_cost_in_cents_with_source_duration(5, RES), 47);
      }

      #[test]
      fn ten_extension_zero_source() {
        // output 70 × 10 = 700; input 0; total 700
        let req = make_request(Some(10), url_source(), None);
        assert_eq!(req.calculate_cost_in_mills_with_source_duration(0, RES), 700);
      }

      #[test]
      fn source_duration_scales_linearly() {
        let req = make_request(Some(5), url_source(), None); // output = 350
        for secs in 0u32..=30 {
          let expected = 350 + 10 * secs as u64;
          assert_eq!(req.calculate_cost_in_mills_with_source_duration(secs, RES), expected, "secs={secs}");
        }
      }

      #[test]
      fn extension_duration_scales_linearly() {
        // Fix source at 10s (input portion = 100 mills).
        for ext in 1u32..=10 {
          let req = make_request(Some(ext), url_source(), None);
          let expected = 70 * ext as u64 + 100;
          assert_eq!(req.calculate_cost_in_mills_with_source_duration(10, RES), expected, "ext={ext}");
        }
      }
    }

    // ── 480p source (output 50 mills/sec) ──

    mod source_480p {
      use super::*;
      const RES: VideoResolution = VideoResolution::FourEightyP;

      #[test]
      fn five_extension_ten_source() {
        // output: 50 × 5 = 250 mills; input: 10 × 10 = 100; total 350
        let req = make_request(Some(5), url_source(), None);
        assert_eq!(req.calculate_cost_in_mills_with_source_duration(10, RES), 350);
        assert_eq!(req.calculate_cost_in_cents_with_source_duration(10, RES), 35);
      }

      #[test]
      fn default_extension_five_source() {
        // default ext=6s: output 50 × 6 = 300; input 10 × 5 = 50; total 350
        let req = make_request(None, url_source(), None);
        assert_eq!(req.calculate_cost_in_mills_with_source_duration(5, RES), 350);
        assert_eq!(req.calculate_cost_in_cents_with_source_duration(5, RES), 35);
      }

      #[test]
      fn ten_extension_zero_source() {
        // output 50 × 10 = 500; input 0; total 500
        let req = make_request(Some(10), url_source(), None);
        assert_eq!(req.calculate_cost_in_mills_with_source_duration(0, RES), 500);
      }

      #[test]
      fn source_duration_scales_linearly() {
        let req = make_request(Some(5), url_source(), None); // output = 250
        for secs in 0u32..=30 {
          let expected = 250 + 10 * secs as u64;
          assert_eq!(req.calculate_cost_in_mills_with_source_duration(secs, RES), expected, "secs={secs}");
        }
      }

      #[test]
      fn extension_duration_scales_linearly() {
        // Fix source at 10s (input portion = 100 mills).
        for ext in 1u32..=10 {
          let req = make_request(Some(ext), url_source(), None);
          let expected = 50 * ext as u64 + 100;
          assert_eq!(req.calculate_cost_in_mills_with_source_duration(10, RES), expected, "ext={ext}");
        }
      }
    }

    // ── Cross-resolution comparisons ──

    #[test]
    fn higher_resolution_costs_more_for_fixed_extension_and_source() {
      let req = make_request(Some(5), url_source(), None);
      for source_secs in 0u32..=15 {
        let lo = req.calculate_cost_in_mills_with_source_duration(source_secs, VideoResolution::FourEightyP);
        let hi = req.calculate_cost_in_mills_with_source_duration(source_secs, VideoResolution::SevenTwentyP);
        assert!(lo < hi,
          "source_secs={source_secs}: 480p ({lo}) should be < 720p ({hi})");
      }
    }

    #[test]
    fn matrix_of_extension_source_resolution() {
      // (ext_duration, source_duration, source_resolution, expected_mills)
      let cases: &[(u32, u32, VideoResolution, u64)] = &[
        // 480p
        ( 1,  0, VideoResolution::FourEightyP,    50),  // 50×1 +  0
        ( 1,  5, VideoResolution::FourEightyP,   100),  // 50×1 + 50
        ( 5,  5, VideoResolution::FourEightyP,   300),  // 50×5 + 50
        (10,  5, VideoResolution::FourEightyP,   550),  // 50×10 + 50
        (10, 30, VideoResolution::FourEightyP,   800),  // 50×10 + 300
        // 720p
        ( 1,  0, VideoResolution::SevenTwentyP,   70),  // 70×1 +  0
        ( 1,  5, VideoResolution::SevenTwentyP,  120),  // 70×1 + 50
        ( 5,  5, VideoResolution::SevenTwentyP,  400),  // 70×5 + 50
        (10,  5, VideoResolution::SevenTwentyP,  750),  // 70×10 + 50
        (10, 30, VideoResolution::SevenTwentyP, 1000),  // 70×10 + 300
      ];
      for &(ext, source, res, expected) in cases {
        let req = make_request(Some(ext), url_source(), None);
        assert_eq!(
          req.calculate_cost_in_mills_with_source_duration(source, res),
          expected,
          "ext={ext} source={source} res={res:?}",
        );
      }
    }

    #[test]
    fn cents_uses_ceiling_division() {
      // ext=1s @ 480p: output 50; input 10×1=10; total 60 mills = 6¢
      let req = make_request(Some(1), url_source(), None);
      assert_eq!(req.calculate_cost_in_mills_with_source_duration(1, VideoResolution::FourEightyP), 60);
      assert_eq!(req.calculate_cost_in_cents_with_source_duration(1, VideoResolution::FourEightyP), 6);
      // ext=1s @ 720p: output 70; input 10; total 80 mills = 8¢
      assert_eq!(req.calculate_cost_in_mills_with_source_duration(1, VideoResolution::SevenTwentyP), 80);
      assert_eq!(req.calculate_cost_in_cents_with_source_duration(1, VideoResolution::SevenTwentyP), 8);
    }
  }

  // ── source_video_duration_seconds_hint hint ──

  mod duration_hint {
    use super::*;

    #[test]
    fn unset_hint_returns_output_only() {
      // ext=5s @ 720p, no hint → just output portion: 70 × 5 = 350
      let req = make_request(Some(5), url_source(), None);
      assert_eq!(req.source_video_duration_seconds_hint, None);
      assert_eq!(req.calculate_cost_in_mills(), 350);
    }

    #[test]
    fn set_hint_adds_input_portion() {
      // ext=5s @ 720p, source=10s → output 350 + input 100 = 450
      let mut req = make_request(Some(5), url_source(), None);
      req.source_video_duration_seconds_hint = Some(10);
      assert_eq!(req.calculate_cost_in_mills(), 450);
      assert_eq!(req.calculate_cost_in_cents(), 45);
    }

    #[test]
    fn hint_zero_is_treated_as_zero_input() {
      // ext=5s @ 720p, source=0 → output 350 + 0 = 350
      let mut req = make_request(Some(5), url_source(), None);
      req.source_video_duration_seconds_hint = Some(0);
      assert_eq!(req.calculate_cost_in_mills(), 350);
    }

    #[test]
    fn default_extension_with_hint() {
      // ext default=6s @ 720p (output 420), source=5s (input 50) → 470
      let mut req = make_request(None, url_source(), None);
      req.source_video_duration_seconds_hint = Some(5);
      assert_eq!(req.calculate_cost_in_mills(), 470);
      assert_eq!(req.calculate_cost_in_cents(), 47);
    }

    #[test]
    fn hint_at_720p_matches_explicit_source_duration_method() {
      // The base impl assumes 720p output. The explicit source-duration
      // method must agree at 720p for every hint value.
      for ext in 1u32..=10 {
        for source_secs in 0u32..=20 {
          let mut req = make_request(Some(ext), url_source(), None);
          req.source_video_duration_seconds_hint = Some(source_secs);
          assert_eq!(
            req.calculate_cost_in_mills(),
            req.calculate_cost_in_mills_with_source_duration(source_secs, VideoResolution::SevenTwentyP),
            "ext={ext} source_secs={source_secs}",
          );
        }
      }
    }

    #[test]
    fn hint_scales_linearly() {
      // Fix ext=5s (output 350); vary hint from 0..30.
      for source_secs in 0u32..=30 {
        let mut req = make_request(Some(5), url_source(), None);
        req.source_video_duration_seconds_hint = Some(source_secs);
        assert_eq!(req.calculate_cost_in_mills(), 350 + 10 * source_secs as u64, "source_secs={source_secs}");
      }
    }
  }
}

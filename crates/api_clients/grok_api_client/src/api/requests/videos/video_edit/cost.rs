use crate::api::requests::videos::video_edit::video_edit::VideoEditRequest;
use crate::api::requests::videos::video_generation::cost::{
  output_mills_per_second,
  DEFAULT_VIDEO_DURATION_SECONDS,
  INPUT_MILLS_PER_SECOND_OF_SOURCE_VIDEO,
};
use crate::api::traits::grok_request_cost_calculator_trait::{GrokRequestCostCalculator, UsdMills};
use crate::api::traits::grok_request_source_duration_cost_calculator_trait::GrokRequestSourceDurationCostCalculator;
use crate::api::types::video_types::video_resolution::VideoResolution;

/// Fallback resolution used by the base [`GrokRequestCostCalculator`] impl
/// when the caller hasn't supplied the source's actual resolution. Picks
/// the more expensive tier (720p) so estimates don't undershoot.
const ASSUMED_SOURCE_RESOLUTION: VideoResolution = VideoResolution::SevenTwentyP;

// `video_edit` cost depends entirely on the source video's properties:
//
//   Input:  10 mills/sec × source_duration            (resolution-independent)
//   Output: output_mills_per_second(res) × source_duration
//           - 480p source → 50 mills/sec output
//           - 720p source → 70 mills/sec output
//
// xAI documents that video edits re-render the ENTIRE source video — output
// duration mirrors source duration, output resolution mirrors source
// resolution (capped at 720p, which is also our max-supported variant).
//
// Neither source duration nor source resolution is in the request body — the
// `source_video` field only points at a URL/file_id.
//
// Two impls cover the cost-estimation gradient:
//
//   - `GrokRequestCostCalculator::calculate_cost_in_mills` falls back to a
//     conservative default (8s source @ 720p, matching xAI's
//     /v1/videos/generations default) so callers without source metadata
//     get a non-zero estimate. Returning 0 would silently misrepresent the
//     cost as free.
//
//   - `GrokRequestSourceDurationCostCalculator::calculate_cost_in_mills_with_source_duration`
//     takes the actual source duration AND resolution from the caller
//     (typically via ffprobe or an upstream generate call) and returns the
//     exact billed amount.

impl GrokRequestCostCalculator for VideoEditRequest {
  /// Uses [`VideoEditRequest::source_video_duration_seconds_hint`] when set;
  /// otherwise falls back to a conservative default ([`DEFAULT_VIDEO_DURATION_SECONDS`]
  /// = 8s, matching xAI's `/v1/videos/generations` default).
  ///
  /// Source resolution is always assumed to be 720p (the upper-tier rate,
  /// picked so estimates don't undershoot) since the request can't carry
  /// it. If you need to override the resolution assumption, call
  /// [`GrokRequestSourceDurationCostCalculator::calculate_cost_in_mills_with_source_duration`]
  /// directly.
  ///
  /// Formula: `secs × (10 input + 70 output@720p) = 80 × secs` mills.
  ///
  /// At the 8-second default: 8 × 80 = **640 mills (64¢)**.
  fn calculate_cost_in_mills(&self) -> UsdMills {
    let secs = self.source_video_duration_seconds_hint.unwrap_or(DEFAULT_VIDEO_DURATION_SECONDS);
    self.calculate_cost_in_mills_with_source_duration(secs, ASSUMED_SOURCE_RESOLUTION)
  }
}

impl GrokRequestSourceDurationCostCalculator for VideoEditRequest {
  /// Both input and output are billed per second of source duration; output
  /// rate depends on source resolution (which equals output resolution for
  /// video edits, capped at 720p).
  ///
  ///   total = source_duration_seconds × (10 mills/sec input
  ///                                      + output_mills_per_second(res))
  ///
  /// Examples:
  ///   - 480p source: (10 + 50) × secs = 60 mills/sec
  ///   - 720p source: (10 + 70) × secs = 80 mills/sec
  fn calculate_cost_in_mills_with_source_duration(
    &self,
    source_duration_seconds: u32,
    source_resolution: VideoResolution,
  ) -> UsdMills {
    let secs = source_duration_seconds as u64;
    let per_second = INPUT_MILLS_PER_SECOND_OF_SOURCE_VIDEO + output_mills_per_second(source_resolution);
    per_second * secs
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::requests::videos::video_edit::video_edit::{VideoEditRequest, VideoSource};
  use crate::api::types::video_types::video_model::VideoModel;

  fn make_request(source_video: VideoSource, model: Option<VideoModel>) -> VideoEditRequest {
    VideoEditRequest {
      prompt: "test edit".to_string(),
      source_video,
      source_video_duration_seconds_hint: None,
      model,
      user: None,
    }
  }

  // Default base-trait estimate assumes 8s source @ 720p, so:
  //   8 × (10 input + 70 output) = 640 mills = 64¢
  const EXPECTED_BASE_ESTIMATE_MILLS: u64 = 640;
  const EXPECTED_BASE_ESTIMATE_CENTS: u64 = 64;

  #[test]
  fn base_estimate_is_conservative_eight_seconds_seven_twenty_p() {
    let cases = [
      VideoSource::Url("https://example.com/v.mp4".to_string()),
      VideoSource::FileId("file_abc".to_string()),
    ];
    for source in cases {
      let req = make_request(source, None);
      assert_eq!(req.calculate_cost_in_mills(), EXPECTED_BASE_ESTIMATE_MILLS);
      assert_eq!(req.calculate_cost_in_cents(), EXPECTED_BASE_ESTIMATE_CENTS);
    }
  }

  #[test]
  fn base_estimate_is_independent_of_model() {
    let r_default = make_request(VideoSource::Url("u".to_string()), None).calculate_cost_in_mills();
    let r_known   = make_request(VideoSource::Url("u".to_string()), Some(VideoModel::GrokImagineVideo)).calculate_cost_in_mills();
    let r_custom  = make_request(VideoSource::Url("u".to_string()),
      Some(VideoModel::Custom("future".to_string()))).calculate_cost_in_mills();
    assert_eq!(r_default, EXPECTED_BASE_ESTIMATE_MILLS);
    assert_eq!(r_known,   EXPECTED_BASE_ESTIMATE_MILLS);
    assert_eq!(r_custom,  EXPECTED_BASE_ESTIMATE_MILLS);
  }

  #[test]
  fn base_estimate_is_independent_of_prompt_or_user() {
    let mut req = make_request(VideoSource::Url("u".to_string()), None);
    req.prompt = "an enormously long prompt with many tokens".repeat(100);
    req.user = Some("user-id".to_string());
    assert_eq!(req.calculate_cost_in_mills(), EXPECTED_BASE_ESTIMATE_MILLS);
  }

  #[test]
  fn base_estimate_equals_source_duration_method_with_defaults() {
    // The base impl must agree with the source-duration-aware impl when
    // called with the documented default assumptions (8s, 720p).
    let req = make_request(VideoSource::Url("u".to_string()), None);
    assert_eq!(
      req.calculate_cost_in_mills(),
      req.calculate_cost_in_mills_with_source_duration(8, VideoResolution::SevenTwentyP),
    );
  }

  #[test]
  fn base_estimate_is_nonzero() {
    // Sanity guard against accidentally regressing to the old return-0 footgun.
    let req = make_request(VideoSource::Url("u".to_string()), None);
    assert!(req.calculate_cost_in_mills() > 0);
    assert!(req.calculate_cost_in_cents() > 0);
  }

  // ── source_video_duration_seconds_hint hint ──

  mod duration_hint {
    use super::*;

    #[test]
    fn hint_overrides_default_duration() {
      let mut req = make_request(VideoSource::Url("u".to_string()), None);
      req.source_video_duration_seconds_hint = Some(5);
      // 5 × 80 = 400 mills (vs the 640 mills default)
      assert_eq!(req.calculate_cost_in_mills(), 400);
      assert_eq!(req.calculate_cost_in_cents(), 40);
    }

    #[test]
    fn one_second_hint() {
      let mut req = make_request(VideoSource::Url("u".to_string()), None);
      req.source_video_duration_seconds_hint = Some(1);
      assert_eq!(req.calculate_cost_in_mills(), 80);  // 1 × 80
      assert_eq!(req.calculate_cost_in_cents(), 8);
    }

    #[test]
    fn fifteen_second_hint() {
      let mut req = make_request(VideoSource::Url("u".to_string()), None);
      req.source_video_duration_seconds_hint = Some(15);
      assert_eq!(req.calculate_cost_in_mills(), 1200);  // 15 × 80
      assert_eq!(req.calculate_cost_in_cents(), 120);
    }

    #[test]
    fn hint_matches_explicit_source_duration_method_at_720p() {
      // The hint-driven base method should agree with the explicit
      // source-duration method at the assumed (720p) resolution.
      for secs in 0u32..=30 {
        let mut req = make_request(VideoSource::Url("u".to_string()), None);
        req.source_video_duration_seconds_hint = Some(secs);
        assert_eq!(
          req.calculate_cost_in_mills(),
          req.calculate_cost_in_mills_with_source_duration(secs, VideoResolution::SevenTwentyP),
          "secs={secs}",
        );
      }
    }

    #[test]
    fn unset_hint_falls_back_to_default() {
      let req = make_request(VideoSource::Url("u".to_string()), None);
      assert_eq!(req.source_video_duration_seconds_hint, None);
      // Default = 8s @ 720p = 640 mills.
      assert_eq!(req.calculate_cost_in_mills(), 640);
    }

    #[test]
    fn zero_second_hint_costs_zero() {
      // Edge case: 0-second source is meaningless but shouldn't panic.
      let mut req = make_request(VideoSource::Url("u".to_string()), None);
      req.source_video_duration_seconds_hint = Some(0);
      assert_eq!(req.calculate_cost_in_mills(), 0);
    }

    #[test]
    fn hint_scales_linearly() {
      for secs in 1u32..=20 {
        let mut req = make_request(VideoSource::Url("u".to_string()), None);
        req.source_video_duration_seconds_hint = Some(secs);
        assert_eq!(req.calculate_cost_in_mills(), 80 * secs as u64, "secs={secs}");
      }
    }
  }

  // ── Source-duration-aware variant ──

  mod with_source_duration {
    use super::*;

    // ── 720p source (output capped at 720p, so 70 + 10 = 80 mills/sec) ──

    mod source_720p {
      use super::*;
      const RES: VideoResolution = VideoResolution::SevenTwentyP;

      #[test]
      fn five_second_source() {
        // 80 × 5 = 400 mills = 40¢
        let req = make_request(VideoSource::Url("u".to_string()), None);
        assert_eq!(req.calculate_cost_in_mills_with_source_duration(5, RES), 400);
        assert_eq!(req.calculate_cost_in_cents_with_source_duration(5, RES), 40);
      }

      #[test]
      fn one_second_source() {
        // 80 × 1 = 80 mills = 8¢
        let req = make_request(VideoSource::Url("u".to_string()), None);
        assert_eq!(req.calculate_cost_in_mills_with_source_duration(1, RES), 80);
        assert_eq!(req.calculate_cost_in_cents_with_source_duration(1, RES), 8);
      }

      #[test]
      fn ten_second_source_is_eighty_cents() {
        // 80 × 10 = 800 mills = 80¢
        let req = make_request(VideoSource::Url("u".to_string()), None);
        assert_eq!(req.calculate_cost_in_mills_with_source_duration(10, RES), 800);
        assert_eq!(req.calculate_cost_in_cents_with_source_duration(10, RES), 80);
      }

      #[test]
      fn scales_linearly() {
        let req = make_request(VideoSource::Url("u".to_string()), None);
        for secs in 1u32..=60 {
          assert_eq!(req.calculate_cost_in_mills_with_source_duration(secs, RES), 80 * secs as u64, "secs={secs}");
        }
      }
    }

    // ── 480p source (output at 480p, so 50 + 10 = 60 mills/sec) ──

    mod source_480p {
      use super::*;
      const RES: VideoResolution = VideoResolution::FourEightyP;

      #[test]
      fn five_second_source() {
        // 60 × 5 = 300 mills = 30¢
        let req = make_request(VideoSource::Url("u".to_string()), None);
        assert_eq!(req.calculate_cost_in_mills_with_source_duration(5, RES), 300);
        assert_eq!(req.calculate_cost_in_cents_with_source_duration(5, RES), 30);
      }

      #[test]
      fn one_second_source() {
        // 60 × 1 = 60 mills = 6¢
        let req = make_request(VideoSource::Url("u".to_string()), None);
        assert_eq!(req.calculate_cost_in_mills_with_source_duration(1, RES), 60);
        assert_eq!(req.calculate_cost_in_cents_with_source_duration(1, RES), 6);
      }

      #[test]
      fn ten_second_source_is_sixty_cents() {
        // 60 × 10 = 600 mills = 60¢
        let req = make_request(VideoSource::Url("u".to_string()), None);
        assert_eq!(req.calculate_cost_in_mills_with_source_duration(10, RES), 600);
        assert_eq!(req.calculate_cost_in_cents_with_source_duration(10, RES), 60);
      }

      #[test]
      fn scales_linearly() {
        let req = make_request(VideoSource::Url("u".to_string()), None);
        for secs in 1u32..=60 {
          assert_eq!(req.calculate_cost_in_mills_with_source_duration(secs, RES), 60 * secs as u64, "secs={secs}");
        }
      }
    }

    // ── Cross-resolution comparisons ──

    #[test]
    fn zero_second_source_costs_zero_regardless_of_resolution() {
      let req = make_request(VideoSource::Url("u".to_string()), None);
      assert_eq!(req.calculate_cost_in_mills_with_source_duration(0, VideoResolution::FourEightyP), 0);
      assert_eq!(req.calculate_cost_in_mills_with_source_duration(0, VideoResolution::SevenTwentyP), 0);
    }

    #[test]
    fn higher_resolution_costs_more() {
      let req = make_request(VideoSource::Url("u".to_string()), None);
      for secs in 1u32..=15 {
        let lo = req.calculate_cost_in_mills_with_source_duration(secs, VideoResolution::FourEightyP);
        let hi = req.calculate_cost_in_mills_with_source_duration(secs, VideoResolution::SevenTwentyP);
        assert!(lo < hi, "secs={secs}: 480p ({lo}) should be < 720p ({hi})");
      }
    }

    #[test]
    fn matrix_of_duration_and_resolution() {
      // (duration, resolution, expected_mills)
      let cases: &[(u32, VideoResolution, u64)] = &[
        ( 1, VideoResolution::FourEightyP,    60),
        ( 5, VideoResolution::FourEightyP,   300),
        (10, VideoResolution::FourEightyP,   600),
        (15, VideoResolution::FourEightyP,   900),
        (30, VideoResolution::FourEightyP,  1800),
        ( 1, VideoResolution::SevenTwentyP,   80),
        ( 5, VideoResolution::SevenTwentyP,  400),
        (10, VideoResolution::SevenTwentyP,  800),
        (15, VideoResolution::SevenTwentyP, 1200),
        (30, VideoResolution::SevenTwentyP, 2400),
      ];
      let req = make_request(VideoSource::Url("u".to_string()), None);
      for &(secs, res, expected) in cases {
        assert_eq!(
          req.calculate_cost_in_mills_with_source_duration(secs, res),
          expected,
          "secs={secs} res={res:?}",
        );
      }
    }

    #[test]
    fn independent_of_source_kind() {
      let url_req = make_request(VideoSource::Url("u".to_string()), None);
      let file_req = make_request(VideoSource::FileId("f".to_string()), None);
      for res in [VideoResolution::FourEightyP, VideoResolution::SevenTwentyP] {
        assert_eq!(
          url_req.calculate_cost_in_mills_with_source_duration(7, res),
          file_req.calculate_cost_in_mills_with_source_duration(7, res),
        );
      }
    }
  }
}

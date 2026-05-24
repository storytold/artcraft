use crate::api::requests::videos::video_edit::video_edit::VideoEditRequest;
use crate::api::requests::videos::video_generation::cost::{
  output_mills_per_second,
  DEFAULT_VIDEO_DURATION_SECONDS,
  INPUT_MILLS_PER_SECOND_OF_SOURCE_VIDEO,
};
use crate::api::traits::grok_request_cost_calculator_trait::{GrokRequestCostCalculator, UsdMills};
use crate::api::types::video_types::video_resolution::VideoResolution;

/// Resolution we assume for both input and output. Video edits inherit
/// source resolution capped at 720p, so 720p is also the worst case
/// (output rate is higher at 720p than 480p).
const ASSUMED_RESOLUTION: VideoResolution = VideoResolution::SevenTwentyP;

// `video_edit` cost depends entirely on the source video's duration:
//
//   Input:  10 mills/sec × source_duration            (resolution-independent)
//   Output: 70 mills/sec × source_duration            (720p, the assumed cap)
//   Total:  80 mills/sec × source_duration
//
// xAI documents that video edits re-render the ENTIRE source video — output
// duration mirrors source duration, output resolution mirrors source
// resolution (capped at 720p, which is also our max-supported variant).
//
// Source duration isn't in the request body, but callers can populate the
// `source_video_duration_seconds_hint` field on `VideoEditRequest` for an
// accurate estimate. Without it we fall back to xAI's 8-second generation
// default so callers don't get a misleadingly-free quote.

impl GrokRequestCostCalculator for VideoEditRequest {
  /// Uses [`VideoEditRequest::source_video_duration_seconds_hint`] when set
  /// (the caller-supplied source duration drives both the input AND output
  /// billing); otherwise falls back to [`DEFAULT_VIDEO_DURATION_SECONDS`]
  /// (8s, matching xAI's `/v1/videos/generations` default).
  ///
  /// Resolution is always assumed to be 720p — the request body can't
  /// carry the source's actual resolution and 720p is both xAI's cap and
  /// the worst case for cost.
  ///
  /// Formula: `secs × (10 input + 70 output@720p) = 80 × secs` mills.
  ///
  /// At the 8-second default: 8 × 80 = **640 mills (64¢)**.
  fn calculate_cost_in_mills(&self) -> UsdMills {
    let secs = self
      .source_video_duration_seconds_hint
      .unwrap_or(DEFAULT_VIDEO_DURATION_SECONDS) as u64;
    let per_second = INPUT_MILLS_PER_SECOND_OF_SOURCE_VIDEO + output_mills_per_second(ASSUMED_RESOLUTION);
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

    #[test]
    fn hint_is_independent_of_source_kind() {
      let mut url_req = make_request(VideoSource::Url("u".to_string()), None);
      let mut file_req = make_request(VideoSource::FileId("f".to_string()), None);
      url_req.source_video_duration_seconds_hint = Some(7);
      file_req.source_video_duration_seconds_hint = Some(7);
      assert_eq!(url_req.calculate_cost_in_mills(), file_req.calculate_cost_in_mills());
    }
  }
}

use crate::api::requests::videos::video_edit::video_edit::VideoEditRequest;
use crate::api::requests::videos::video_generation::cost::{
  output_mills_per_second,
  INPUT_MILLS_PER_SECOND_OF_SOURCE_VIDEO,
};
use crate::api::traits::grok_request_cost_calculator_trait::{GrokRequestCostCalculator, UsdMills};
use crate::api::traits::grok_request_source_duration_cost_calculator_trait::GrokRequestSourceDurationCostCalculator;
use crate::api::types::video_types::video_resolution::VideoResolution;

// `video_edit` cost depends entirely on the source video's duration:
//
//   Input:  $0.01/sec × source_duration            (10 mills/sec)
//   Output: $0.07/sec × source_duration            (70 mills/sec, since
//           output mirrors the source resolution capped at 720p, and
//           output duration mirrors source duration per xAI docs)
//
// Neither piece is knowable from the `VideoEditRequest` alone — the
// `source_video` field only points at a URL/file_id, not at metadata. The
// trait impl therefore returns 0 so callers don't get a misleading bound.
//
// If you need a real estimate, fetch the source's metadata out-of-band
// (e.g. `ffprobe` for a local file, or HEAD + Range read for a remote MP4)
// and compute:
//
//   mills = source_duration_seconds * (INPUT_MILLS_PER_SECOND_OF_SOURCE_VIDEO
//                                      + output_mills_per_second(VideoResolution::SevenTwentyP))
//         = source_duration_seconds * (10 + 70)
//         = source_duration_seconds * 80

impl GrokRequestCostCalculator for VideoEditRequest {
  /// **Always returns 0.** Cost cannot be computed from the request body
  /// — see the module-level comment for the formula you'd apply if you
  /// have the source video's duration available out-of-band.
  ///
  /// If you DO have the source duration, use
  /// [`GrokRequestSourceDurationCostCalculator::calculate_cost_in_mills_with_source_duration`]
  /// instead.
  fn calculate_cost_in_mills(&self) -> UsdMills {
    0
  }
}

impl GrokRequestSourceDurationCostCalculator for VideoEditRequest {
  /// Output duration mirrors the source, output resolution mirrors the
  /// source capped at 720p. Both input and output are billed per second of
  /// source duration:
  ///
  ///   total = source_duration_seconds × (INPUT + OUTPUT_720P)
  ///         = source_duration_seconds × (10 + 70) = 80 mills/sec
  fn calculate_cost_in_mills_with_source_duration(&self, source_duration_seconds: u32) -> UsdMills {
    let secs = source_duration_seconds as u64;
    let per_second = INPUT_MILLS_PER_SECOND_OF_SOURCE_VIDEO + output_mills_per_second(VideoResolution::SevenTwentyP);
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
      model,
      user: None,
    }
  }

  #[test]
  fn always_returns_zero() {
    let cases = [
      VideoSource::Url("https://example.com/v.mp4".to_string()),
      VideoSource::FileId("file_abc".to_string()),
    ];
    for source in cases {
      let req = make_request(source, None);
      assert_eq!(req.calculate_cost_in_mills(), 0);
      assert_eq!(req.calculate_cost_in_cents(), 0);
    }
  }

  #[test]
  fn zero_regardless_of_model() {
    let req_default = make_request(VideoSource::Url("u".to_string()), None);
    let req_known = make_request(VideoSource::Url("u".to_string()), Some(VideoModel::GrokImagineVideo));
    let req_custom = make_request(VideoSource::Url("u".to_string()),
      Some(VideoModel::Custom("future".to_string())));
    assert_eq!(req_default.calculate_cost_in_mills(), 0);
    assert_eq!(req_known.calculate_cost_in_mills(), 0);
    assert_eq!(req_custom.calculate_cost_in_mills(), 0);
  }

  #[test]
  fn zero_regardless_of_prompt_or_user() {
    let mut req = make_request(VideoSource::Url("u".to_string()), None);
    req.prompt = "an enormously long prompt with many tokens".repeat(100);
    req.user = Some("user-id".to_string());
    assert_eq!(req.calculate_cost_in_mills(), 0);
  }

  // ── Source-duration-aware variant ──

  mod with_source_duration {
    use super::*;

    #[test]
    fn five_second_source() {
      // 80 × 5 = 400 mills = 40¢
      let req = make_request(VideoSource::Url("u".to_string()), None);
      assert_eq!(req.calculate_cost_in_mills_with_source_duration(5), 400);
      assert_eq!(req.calculate_cost_in_cents_with_source_duration(5), 40);
    }

    #[test]
    fn one_second_source() {
      // 80 × 1 = 80 mills = 8¢
      let req = make_request(VideoSource::Url("u".to_string()), None);
      assert_eq!(req.calculate_cost_in_mills_with_source_duration(1), 80);
      assert_eq!(req.calculate_cost_in_cents_with_source_duration(1), 8);
    }

    #[test]
    fn zero_second_source_costs_zero() {
      let req = make_request(VideoSource::Url("u".to_string()), None);
      assert_eq!(req.calculate_cost_in_mills_with_source_duration(0), 0);
    }

    #[test]
    fn scales_linearly_with_source_duration() {
      let req = make_request(VideoSource::Url("u".to_string()), None);
      for secs in 1u32..=60 {
        assert_eq!(req.calculate_cost_in_mills_with_source_duration(secs), 80 * secs as u64, "secs={secs}");
      }
    }

    #[test]
    fn ten_second_source_is_one_dollar() {
      // 80 × 10 = 800 mills = 80¢
      let req = make_request(VideoSource::Url("u".to_string()), None);
      assert_eq!(req.calculate_cost_in_mills_with_source_duration(10), 800);
      assert_eq!(req.calculate_cost_in_cents_with_source_duration(10), 80);
    }

    #[test]
    fn independent_of_source_kind() {
      let url_req = make_request(VideoSource::Url("u".to_string()), None);
      let file_req = make_request(VideoSource::FileId("f".to_string()), None);
      assert_eq!(
        url_req.calculate_cost_in_mills_with_source_duration(7),
        file_req.calculate_cost_in_mills_with_source_duration(7),
      );
    }
  }
}

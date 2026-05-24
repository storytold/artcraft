use crate::api::requests::videos::video_extension::video_extension::VideoExtensionRequest;
use crate::api::requests::videos::video_generation::cost::{
  output_mills_per_second,
  INPUT_MILLS_PER_SECOND_OF_SOURCE_VIDEO,
};
use crate::api::traits::grok_request_cost_calculator_trait::{GrokRequestCostCalculator, UsdMills};
use crate::api::types::video_types::video_resolution::VideoResolution;

// `video_extension` charges:
//
//   Output: 70 mills/sec × extension_duration   (assumed 720p, since output
//           inherits the source's resolution capped at 720p)
//   Input:  10 mills/sec × source_duration      (only billed when caller
//           supplies a duration hint)
//
// `extension_duration` is the `duration` field on the request (xAI default
// is 6 seconds; range 1–10). `source_duration` isn't in the wire body, but
// callers can populate `source_video_duration_seconds_hint` on the public
// Request to drive the input-side billing.

/// xAI default duration for video_extension when `duration` is omitted.
const DEFAULT_EXTENSION_DURATION_SECONDS: u32 = 6;

/// Assumed output resolution. xAI caps extension output at 720p, so this
/// is the worst case for cost.
const ASSUMED_RESOLUTION: VideoResolution = VideoResolution::SevenTwentyP;

impl GrokRequestCostCalculator for VideoExtensionRequest {
  /// Output portion (always billed): extension duration × 70 mills/sec at
  /// the assumed 720p output.
  ///
  /// Input portion (billed only when
  /// [`VideoExtensionRequest::source_video_duration_seconds_hint`] is set):
  /// 10 mills/sec × hinted source duration.
  ///
  /// Formula:
  /// - hint unset: `extension_duration × 70`
  /// - hint set:   `extension_duration × 70 + source_duration × 10`
  fn calculate_cost_in_mills(&self) -> UsdMills {
    let extension_duration = self.duration.unwrap_or(DEFAULT_EXTENSION_DURATION_SECONDS) as u64;
    let output_mills = output_mills_per_second(ASSUMED_RESOLUTION) * extension_duration;
    let input_mills = self
      .source_video_duration_seconds_hint
      .map(|secs| INPUT_MILLS_PER_SECOND_OF_SOURCE_VIDEO * secs as u64)
      .unwrap_or(0);
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

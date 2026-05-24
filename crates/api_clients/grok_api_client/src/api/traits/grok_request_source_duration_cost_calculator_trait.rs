//! Source-video-aware cost calculator for video endpoints that reference
//! an existing video whose duration AND resolution are NOT in the request
//! body.
//!
//! Implemented by:
//! - [`crate::api::requests::videos::video_edit::video_edit::VideoEditRequest`]
//! - [`crate::api::requests::videos::video_extension::video_extension::VideoExtensionRequest`]
//!
//! Callers who have the source video's properties (from ffprobe, an upstream
//! generate request that produced it, or similar) can use this to get a
//! true total cost.

use crate::api::traits::grok_request_cost_calculator_trait::{UsdCents, UsdMills};
use crate::api::types::video_types::video_resolution::VideoResolution;

/// Companion to `GrokRequestCostCalculator` for requests whose true cost
/// depends on a source video's duration and resolution — neither of which
/// is part of the request body.
///
/// xAI bills:
/// - source video as INPUT at 10 mills/sec (rate is independent of resolution)
/// - rendered OUTPUT at `output_mills_per_second(resolution)`, where
///   `resolution` mirrors the source capped at 720p
pub trait GrokRequestSourceDurationCostCalculator {
  /// Estimated total cost rounded up to the nearest whole cent.
  fn calculate_cost_in_cents_with_source_duration(
    &self,
    source_duration_seconds: u32,
    source_resolution: VideoResolution,
  ) -> UsdCents {
    self
      .calculate_cost_in_mills_with_source_duration(source_duration_seconds, source_resolution)
      .div_ceil(10)
  }

  /// Estimated total cost in mills. Implementations should override this.
  ///
  /// `source_duration_seconds`: runtime of the source video in whole
  /// seconds. xAI bills this at 10 mills/sec regardless of resolution.
  ///
  /// `source_resolution`: resolution of the source video. xAI's edit and
  /// extension endpoints produce output at this resolution (capped at
  /// 720p), so the caller should pass the *effective* output resolution —
  /// i.e. `min(source_resolution, 720p)`. Since [`VideoResolution`] only
  /// has `480p` and `720p` variants, "capping at 720p" is automatic.
  fn calculate_cost_in_mills_with_source_duration(
    &self,
    source_duration_seconds: u32,
    source_resolution: VideoResolution,
  ) -> UsdMills;
}

//! Source-duration-aware cost calculator for video endpoints that
//! reference an existing video (whose duration is NOT in the request body).
//!
//! Implemented by:
//! - [`crate::api::requests::videos::video_edit::video_edit::VideoEditRequest`]
//! - [`crate::api::requests::videos::video_extension::video_extension::VideoExtensionRequest`]
//!
//! Callers who have the source video's duration (from ffprobe, an upstream
//! generate request that produced it, or similar) can use this to get a
//! true total cost. Callers who don't can fall back to
//! [`crate::api::traits::grok_request_cost_calculator_trait::GrokRequestCostCalculator`]
//! — `video_edit` returns 0 there; `video_extension` returns the output
//! portion only.

use crate::api::traits::grok_request_cost_calculator_trait::{UsdCents, UsdMills};

/// Companion to `GrokRequestCostCalculator` for requests whose true cost
/// depends on a source video duration that isn't part of the request body.
pub trait GrokRequestSourceDurationCostCalculator {
  /// Estimated total cost rounded up to the nearest whole cent.
  fn calculate_cost_in_cents_with_source_duration(&self, source_duration_seconds: u32) -> UsdCents {
    self.calculate_cost_in_mills_with_source_duration(source_duration_seconds).div_ceil(10)
  }

  /// Estimated total cost in mills. Implementations should override this.
  ///
  /// `source_duration_seconds` is the runtime of the source video at the
  /// `source_video` field's URL/file_id, in whole seconds. xAI bills source
  /// video as input at 10 mills/sec regardless of resolution.
  fn calculate_cost_in_mills_with_source_duration(&self, source_duration_seconds: u32) -> UsdMills;
}

//! Cost-estimation trait for xAI (Grok) API requests.
//!
//! Implementations live next to each Request type in
//! `api/requests/<category>/<endpoint>/cost.rs`. Implemented on the public
//! `*Request` type (NOT the `*Args` wrapper), since the request body is what
//! drives the bill.
//!
//! All math is performed in mills (tenths of a US cent), which is the
//! natural unit for xAI's published rates — an image edit at the cheap tier
//! is $0.002/img = 2 mills, well below cent resolution.

/// Cost in US cents (1¢ = 1 unit).
pub type UsdCents = u64;

/// Cost in mills (1¢ = 10 mills). Use this when sub-cent precision matters
/// — many xAI rates are below 1 cent.
pub type UsdMills = u64;

/// Implemented on `*Request` types to estimate the cost of a Grok API call
/// without actually making it.
///
/// The estimate is derived from fields present in the request body. Some
/// endpoints (notably `video_edit` and the input-cost portion of
/// `video_extension`) depend on the source video's duration, which is NOT
/// part of the request. Those impls document their limitations.
pub trait GrokRequestCostCalculator {
  /// Estimated cost rounded up to the nearest whole cent.
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Default impl: derive from mills via ceiling division.
    self.calculate_cost_in_mills().div_ceil(10)
  }

  /// Estimated cost in mills (tenths of a cent). This is the canonical
  /// method — implementations should override this one.
  fn calculate_cost_in_mills(&self) -> UsdMills;
}

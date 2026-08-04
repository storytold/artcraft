use crate::requests::api::video::enhance::flux_3_draft_enhance::api::Flux3DraftEnhanceRequest;
use crate::requests::api::video::text::flux_3::cost::flux_3_video_cost_cents;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Flux 3 draft-enhance pricing (see
// https://fal.ai/models/blackforestlabs/flux-3/draft-enhance):
//   $0.29 per second of the enhanced video (full-quality 1080p render);
//   synchronized audio is included at no extra cost.
//
// The request carries only a `draft_cache_url`, so the billable duration is
// taken from the request's `expected_duration_seconds` hint (5s — the
// shortest draft — when unset).
const ENHANCE_RATE_CENTS_PER_SEC: u64 = 29; // $0.29/sec

impl FalRequestCostCalculator for Flux3DraftEnhanceRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    let duration_secs = u64::from(self.expected_duration_seconds.unwrap_or(5));
    flux_3_video_cost_cents(ENHANCE_RATE_CENTS_PER_SEC, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(expected_duration_seconds: Option<u8>) -> Flux3DraftEnhanceRequest {
    Flux3DraftEnhanceRequest {
      draft_cache_url: "https://example.com/cache.bin".to_string(),
      safety_tolerance: None,
      expected_duration_seconds,
    }
  }

  mod cost_table {
    use super::*;

    // (expected_duration, expected_cents) — 29¢ × secs; None estimates at 5s.
    const COST_TABLE: &[(Option<u8>, u64)] = &[
      (Some(5),  145),
      (Some(10), 290),
      (Some(20), 580),
      (None, 145),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, expected) in COST_TABLE {
        let got = make_request(duration).calculate_cost_in_cents();
        assert_eq!(got, expected, "duration={duration:?}");
      }
    }

    /// Enhance matches the full-quality 1080p generation rate — drafting then
    /// enhancing ($0.06 + $0.29) intentionally costs more than generating at
    /// full quality directly ($0.29 at 1080p).
    #[test]
    fn enhance_rate_matches_full_quality_1080p_rate() {
      use crate::requests::api::video::text::flux_3::cost::flux_3_standard_rate_cents_per_sec;
      assert_eq!(ENHANCE_RATE_CENTS_PER_SEC, flux_3_standard_rate_cents_per_sec(true));
    }
  }
}

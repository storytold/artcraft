//! Shared pricing for the Seedance 2.0 family of ArtCraft providers.
//!
//! ArtCraft credits equal USD cents (100 credits = $1.00).

// 4K is priced uniformly across the non-Fast Seedance 2.0 models. Rates are held
// in hundredths of a USD cent per second so the math is exact integer arithmetic
// (no floating point), then rounded up to whole cents.

/// 4K output price, in hundredths of a USD cent per second (86.60 ¢/s).
const FOUR_K_CENTI_CENTS_PER_SECOND: u64 = 8660;

/// Extra hundredths of a USD cent per second when a reference video is attached
/// at 4K (17.20 ¢/s surcharge).
const FOUR_K_VIDEO_REFERENCE_SURCHARGE_CENTI_CENTS_PER_SECOND: u64 = 1720;

/// ArtCraft's user-facing price (USD cents) for Seedance 2.0 at 4K.
///
/// A reference video adds a per-second surcharge (4K with and without a video
/// reference are priced differently). The cost scales with duration and batch
/// count, rounded up to whole cents.
pub fn seedance_2p0_four_k_usd_cents(
  duration_seconds: u16,
  batch_count: u16,
  has_video_reference: bool,
) -> u64 {
  let mut centi_cents_per_second = FOUR_K_CENTI_CENTS_PER_SECOND;
  if has_video_reference {
    centi_cents_per_second += FOUR_K_VIDEO_REFERENCE_SURCHARGE_CENTI_CENTS_PER_SECOND;
  }

  let total_centi_cents =
    centi_cents_per_second * duration_seconds as u64 * batch_count as u64;

  // Round up to whole cents.
  total_centi_cents.div_ceil(100)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn four_k_without_video_reference() {
    assert_eq!(seedance_2p0_four_k_usd_cents(4, 1, false), 347);
    assert_eq!(seedance_2p0_four_k_usd_cents(5, 1, false), 433);
    assert_eq!(seedance_2p0_four_k_usd_cents(10, 1, false), 866);
    assert_eq!(seedance_2p0_four_k_usd_cents(15, 1, false), 1299);
  }

  #[test]
  fn four_k_with_video_reference() {
    assert_eq!(seedance_2p0_four_k_usd_cents(4, 1, true), 416);
    assert_eq!(seedance_2p0_four_k_usd_cents(5, 1, true), 519);
    assert_eq!(seedance_2p0_four_k_usd_cents(10, 1, true), 1038);
    assert_eq!(seedance_2p0_four_k_usd_cents(15, 1, true), 1557);
  }

  #[test]
  fn video_reference_always_costs_more() {
    for &duration in &[4u16, 5, 10, 15] {
      assert!(
        seedance_2p0_four_k_usd_cents(duration, 1, true)
          > seedance_2p0_four_k_usd_cents(duration, 1, false),
        "video reference should cost more at {duration}s",
      );
    }
  }

  #[test]
  fn batch_count_multiplies() {
    assert_eq!(seedance_2p0_four_k_usd_cents(5, 2, false), 866);
    assert_eq!(seedance_2p0_four_k_usd_cents(5, 4, false), 1732);
    assert_eq!(seedance_2p0_four_k_usd_cents(5, 2, true), 1038);
  }
}

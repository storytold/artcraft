//! Shared pricing for the Seedance 2.0 family of ArtCraft providers.
//!
//! ArtCraft credits equal USD cents (100 credits = $1.00).

use enums::common::generation::common_resolution::CommonResolution;

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

// ── Seedance 2.0 Mini pricing ──
//
// Mini offers only 480p and 720p. The rates below are the per-second USER price
// in USD cents (margin already included); a reference video adds a per-second
// surcharge. Rates are fractional, so the total is rounded UP to a whole cent
// once at the end (after multiplying by duration × batch).
//
// The regular Mini and the BytePlus / BytePlus Ultra Minis carry DIFFERENT
// margins, so they have separate rate sets and helpers below.

/// Regular Mini — 480p price, USD cents per second.
const MINI_CENTS_PER_SECOND_480P: f64 = 3.24074074;
/// Regular Mini — 480p reference-video surcharge, USD cents per second.
const MINI_VIDEO_REFERENCE_SURCHARGE_CENTS_PER_SECOND_480P: f64 = 0.86419753;
/// Regular Mini — 720p price, USD cents per second.
const MINI_CENTS_PER_SECOND_720P: f64 = 8.64197531;
/// Regular Mini — 720p reference-video surcharge, USD cents per second.
const MINI_VIDEO_REFERENCE_SURCHARGE_CENTS_PER_SECOND_720P: f64 = 1.72839506;

/// BytePlus / BytePlus Ultra Mini — 480p price, USD cents per second.
const BYTEPLUS_MINI_CENTS_PER_SECOND_480P: f64 = 3.27160494;
/// BytePlus / BytePlus Ultra Mini — 480p reference-video surcharge, USD cents per second.
const BYTEPLUS_MINI_VIDEO_REFERENCE_SURCHARGE_CENTS_PER_SECOND_480P: f64 = 0.87242798;
/// BytePlus / BytePlus Ultra Mini — 720p price, USD cents per second.
const BYTEPLUS_MINI_CENTS_PER_SECOND_720P: f64 = 8.72427984;
/// BytePlus / BytePlus Ultra Mini — 720p reference-video surcharge, USD cents per second.
const BYTEPLUS_MINI_VIDEO_REFERENCE_SURCHARGE_CENTS_PER_SECOND_720P: f64 = 1.74485597;

/// ArtCraft's user-facing price (USD cents) for the regular Seedance 2.0 Mini.
///
/// Only 480p and 720p are offered; any other resolution prices at 720p. A
/// reference video adds the per-second surcharge. The fractional total is
/// rounded UP to a whole cent.
pub fn seedance_2p0_mini_usd_cents(
  resolution: CommonResolution,
  duration_seconds: u16,
  batch_count: u16,
  has_video_reference: bool,
) -> u64 {
  mini_usd_cents(
    resolution,
    duration_seconds,
    batch_count,
    has_video_reference,
    MINI_CENTS_PER_SECOND_480P,
    MINI_VIDEO_REFERENCE_SURCHARGE_CENTS_PER_SECOND_480P,
    MINI_CENTS_PER_SECOND_720P,
    MINI_VIDEO_REFERENCE_SURCHARGE_CENTS_PER_SECOND_720P,
  )
}

/// ArtCraft's user-facing price (USD cents) for the Seedance 2.0 BytePlus Mini
/// and BytePlus Ultra Mini (which share the same rates — a higher margin than
/// the regular Mini).
///
/// Only 480p and 720p are offered; any other resolution prices at 720p. A
/// reference video adds the per-second surcharge. The fractional total is
/// rounded UP to a whole cent.
pub fn seedance_2p0_byteplus_mini_usd_cents(
  resolution: CommonResolution,
  duration_seconds: u16,
  batch_count: u16,
  has_video_reference: bool,
) -> u64 {
  mini_usd_cents(
    resolution,
    duration_seconds,
    batch_count,
    has_video_reference,
    BYTEPLUS_MINI_CENTS_PER_SECOND_480P,
    BYTEPLUS_MINI_VIDEO_REFERENCE_SURCHARGE_CENTS_PER_SECOND_480P,
    BYTEPLUS_MINI_CENTS_PER_SECOND_720P,
    BYTEPLUS_MINI_VIDEO_REFERENCE_SURCHARGE_CENTS_PER_SECOND_720P,
  )
}

#[allow(clippy::too_many_arguments)]
fn mini_usd_cents(
  resolution: CommonResolution,
  duration_seconds: u16,
  batch_count: u16,
  has_video_reference: bool,
  cents_per_second_480p: f64,
  video_reference_surcharge_per_second_480p: f64,
  cents_per_second_720p: f64,
  video_reference_surcharge_per_second_720p: f64,
) -> u64 {
  let (base_per_second, video_reference_surcharge_per_second) = match resolution {
    CommonResolution::FourEightyP => (cents_per_second_480p, video_reference_surcharge_per_second_480p),
    // Everything else (including 720p and unsupported resolutions) prices at 720p.
    _ => (cents_per_second_720p, video_reference_surcharge_per_second_720p),
  };

  let mut cents_per_second = base_per_second;
  if has_video_reference {
    cents_per_second += video_reference_surcharge_per_second;
  }

  (cents_per_second * duration_seconds as f64 * batch_count as f64).ceil() as u64
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

  // ── Seedance 2.0 Mini ──
  //
  // Every combination (480p/720p × with/without video reference × 4/5/10/15s)
  // at batch 1. These are the supplier's per-combo cost plus a 5% margin,
  // rounded up to whole cents.

  mod mini {
    use super::*;

    fn cents(res: CommonResolution, dur: u16, has_ref: bool) -> u64 {
      seedance_2p0_mini_usd_cents(res, dur, 1, has_ref)
    }

    #[test]
    fn four_eighty_p_without_video_reference() {
      assert_eq!(cents(CommonResolution::FourEightyP, 4, false), 13);
      assert_eq!(cents(CommonResolution::FourEightyP, 5, false), 17);
      assert_eq!(cents(CommonResolution::FourEightyP, 10, false), 33);
      assert_eq!(cents(CommonResolution::FourEightyP, 15, false), 49);
    }

    #[test]
    fn four_eighty_p_with_video_reference() {
      assert_eq!(cents(CommonResolution::FourEightyP, 4, true), 17);
      assert_eq!(cents(CommonResolution::FourEightyP, 5, true), 21);
      assert_eq!(cents(CommonResolution::FourEightyP, 10, true), 42);
      assert_eq!(cents(CommonResolution::FourEightyP, 15, true), 62);
    }

    #[test]
    fn seven_twenty_p_without_video_reference() {
      assert_eq!(cents(CommonResolution::SevenTwentyP, 4, false), 35);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 5, false), 44);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 10, false), 87);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 15, false), 130);
    }

    #[test]
    fn seven_twenty_p_with_video_reference() {
      assert_eq!(cents(CommonResolution::SevenTwentyP, 4, true), 42);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 5, true), 52);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 10, true), 104);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 15, true), 156);
    }

    #[test]
    fn video_reference_always_costs_more() {
      for res in [CommonResolution::FourEightyP, CommonResolution::SevenTwentyP] {
        for dur in [4u16, 5, 10, 15] {
          assert!(
            cents(res, dur, true) > cents(res, dur, false),
            "video ref should cost more at {res:?} {dur}s",
          );
        }
      }
    }

    #[test]
    fn unsupported_resolution_prices_at_720p() {
      assert_eq!(
        seedance_2p0_mini_usd_cents(CommonResolution::TenEightyP, 5, 1, false),
        seedance_2p0_mini_usd_cents(CommonResolution::SevenTwentyP, 5, 1, false),
      );
    }

    #[test]
    fn batch_count_scales_the_total() {
      // Batch is baked in before the single round-up, so batched totals can be
      // a cent under N× the single price.
      assert_eq!(seedance_2p0_mini_usd_cents(CommonResolution::SevenTwentyP, 5, 2, false), 87);
      assert_eq!(seedance_2p0_mini_usd_cents(CommonResolution::SevenTwentyP, 5, 4, false), 173);
      assert_eq!(seedance_2p0_mini_usd_cents(CommonResolution::FourEightyP, 5, 2, false), 33);
    }
  }

  // ── Seedance 2.0 BytePlus / BytePlus Ultra Mini ──
  //
  // Same combinations as the regular Mini, but at a higher margin (6% vs 5%),
  // so the prices are equal-or-higher than the regular Mini.

  mod byteplus_mini {
    use super::*;

    fn cents(res: CommonResolution, dur: u16, has_ref: bool) -> u64 {
      seedance_2p0_byteplus_mini_usd_cents(res, dur, 1, has_ref)
    }

    #[test]
    fn four_eighty_p_without_video_reference() {
      assert_eq!(cents(CommonResolution::FourEightyP, 4, false), 14);
      assert_eq!(cents(CommonResolution::FourEightyP, 5, false), 17);
      assert_eq!(cents(CommonResolution::FourEightyP, 10, false), 33);
      assert_eq!(cents(CommonResolution::FourEightyP, 15, false), 50);
    }

    #[test]
    fn four_eighty_p_with_video_reference() {
      assert_eq!(cents(CommonResolution::FourEightyP, 4, true), 17);
      assert_eq!(cents(CommonResolution::FourEightyP, 5, true), 21);
      assert_eq!(cents(CommonResolution::FourEightyP, 10, true), 42);
      assert_eq!(cents(CommonResolution::FourEightyP, 15, true), 63);
    }

    #[test]
    fn seven_twenty_p_without_video_reference() {
      assert_eq!(cents(CommonResolution::SevenTwentyP, 4, false), 35);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 5, false), 44);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 10, false), 88);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 15, false), 131);
    }

    #[test]
    fn seven_twenty_p_with_video_reference() {
      assert_eq!(cents(CommonResolution::SevenTwentyP, 4, true), 42);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 5, true), 53);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 10, true), 105);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 15, true), 158);
    }

    #[test]
    fn never_cheaper_than_regular_mini() {
      for res in [CommonResolution::FourEightyP, CommonResolution::SevenTwentyP] {
        for dur in [4u16, 5, 10, 15] {
          for has_ref in [false, true] {
            assert!(
              seedance_2p0_byteplus_mini_usd_cents(res, dur, 1, has_ref)
                >= seedance_2p0_mini_usd_cents(res, dur, 1, has_ref),
              "byteplus mini (6%) should be >= regular mini (5%) at {res:?} {dur}s ref={has_ref}",
            );
          }
        }
      }
    }

    #[test]
    fn unsupported_resolution_prices_at_720p() {
      assert_eq!(
        seedance_2p0_byteplus_mini_usd_cents(CommonResolution::TenEightyP, 5, 1, false),
        seedance_2p0_byteplus_mini_usd_cents(CommonResolution::SevenTwentyP, 5, 1, false),
      );
    }

    #[test]
    fn batch_count_scales_the_total() {
      assert_eq!(seedance_2p0_byteplus_mini_usd_cents(CommonResolution::SevenTwentyP, 5, 2, false), 88);
      assert_eq!(seedance_2p0_byteplus_mini_usd_cents(CommonResolution::SevenTwentyP, 5, 4, false), 175);
      assert_eq!(seedance_2p0_byteplus_mini_usd_cents(CommonResolution::FourEightyP, 5, 2, false), 33);
    }
  }
}

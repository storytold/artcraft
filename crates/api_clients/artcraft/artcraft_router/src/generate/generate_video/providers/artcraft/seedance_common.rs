//! Shared pricing for the Seedance 2.0 family of ArtCraft providers.
//!
//! ArtCraft credits equal USD cents (100 credits = $1.00).

use enums::common::generation::common_resolution::CommonResolution;
use kinovi_web_client::generate::video::generate_seedance_2p5::{
  MAX_BILLED_INPUT_SECONDS, MIN_BILLED_INPUT_SECONDS,
};

// 4K is priced uniformly across the non-Fast Seedance 2.0 models. Rates are held
// in hundredths of a USD cent per second so the math is exact integer arithmetic
// (no floating point), then rounded up to whole cents.

/// 4K output price, in hundredths of a USD cent per second (89.30 ¢/s).
const FOUR_K_CENTI_CENTS_PER_SECOND: u64 = 8930;

/// ArtCraft's price (USD cents) for Seedance 2.0 at 4K with no reference
/// videos attached. Each model prices reference videos through its own
/// with-reference rate card. The cost scales with duration and batch count,
/// rounded up to whole cents.
pub fn seedance_2p0_four_k_usd_cents(
  duration_seconds: u16,
  batch_count: u16,
) -> u64 {
  let total_centi_cents =
    FOUR_K_CENTI_CENTS_PER_SECOND * duration_seconds as u64 * batch_count as u64;

  // Round up to whole cents.
  total_centi_cents.div_ceil(100)
}

// ── Seedance 2.0 Mini pricing ──
//
// Mini offers only 480p and 720p. The rates below are the price in USD cents
// per second; a reference video adds a per-second surcharge. Rates are
// fractional, so the total is rounded UP to a whole cent once at the end
// (after multiplying by duration × batch).
//
// The regular Mini and the BytePlus / BytePlus Ultra Minis have separate
// rate sets and helpers below.

/// Regular Mini — 480p price, USD cents per second.
const MINI_CENTS_PER_SECOND_480P: f64 = 3.45;
/// Regular Mini — 480p reference-video surcharge, USD cents per second.
const MINI_VIDEO_REFERENCE_SURCHARGE_CENTS_PER_SECOND_480P: f64 = 0.90;
/// Regular Mini — 720p price, USD cents per second.
const MINI_CENTS_PER_SECOND_720P: f64 = 8.90;
/// Regular Mini — 720p reference-video surcharge, USD cents per second.
const MINI_VIDEO_REFERENCE_SURCHARGE_CENTS_PER_SECOND_720P: f64 = 1.80;

/// BytePlus / BytePlus Ultra Mini — 480p price, USD cents per second.
const BYTEPLUS_MINI_CENTS_PER_SECOND_480P: f64 = 3.55;
/// BytePlus / BytePlus Ultra Mini — 480p reference-video surcharge, USD cents per second.
const BYTEPLUS_MINI_VIDEO_REFERENCE_SURCHARGE_CENTS_PER_SECOND_480P: f64 = 0.95;
/// BytePlus / BytePlus Ultra Mini — 720p price, USD cents per second.
const BYTEPLUS_MINI_CENTS_PER_SECOND_720P: f64 = 9.10;
/// BytePlus / BytePlus Ultra Mini — 720p reference-video surcharge, USD cents per second.
const BYTEPLUS_MINI_VIDEO_REFERENCE_SURCHARGE_CENTS_PER_SECOND_720P: f64 = 1.85;

/// ArtCraft's price (USD cents) for the regular Seedance 2.0 Mini.
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

/// ArtCraft's price (USD cents) for the Seedance 2.0 BytePlus Mini and
/// BytePlus Ultra Mini (which share the same rates).
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

// ── Seedance 2.5 Preview pricing ──
//
// 2.5 Preview offers only 480p and 720p, generates one video per request (no
// batching), and — unlike the 2.0 family — references of any kind do NOT
// change the price.

/// Seedance 2.5 Preview — 480p price, USD cents per second.
const SEEDANCE_2P5_PREVIEW_CENTS_PER_SECOND_480P: f64 = 21.38234568;
/// Seedance 2.5 Preview — 720p price, USD cents per second.
const SEEDANCE_2P5_PREVIEW_CENTS_PER_SECOND_720P: f64 = 42.76469136;

/// ArtCraft's price (USD cents) for Seedance 2.5 Preview.
///
/// Only 480p and 720p are offered; any other resolution prices at 720p.
/// References never affect the price and there is no batching. The fractional
/// total is rounded UP to a whole cent.
pub fn seedance_2p5_preview_usd_cents(
  resolution: CommonResolution,
  duration_seconds: u16,
) -> u64 {
  let cents_per_second = match resolution {
    CommonResolution::FourEightyP => SEEDANCE_2P5_PREVIEW_CENTS_PER_SECOND_480P,
    // Everything else (including 720p and unsupported resolutions) prices at 720p.
    _ => SEEDANCE_2P5_PREVIEW_CENTS_PER_SECOND_720P,
  };

  (cents_per_second * duration_seconds as f64).ceil() as u64
}

/// Seedance 2.5 — 480p price, USD cents per second.
const SEEDANCE_2P5_CENTS_PER_SECOND_480P: f64 = 11.76954733;
/// Seedance 2.5 — 720p price, USD cents per second.
const SEEDANCE_2P5_CENTS_PER_SECOND_720P: f64 = 26.70781893;
/// Seedance 2.5 — 480p price with video references, USD cents per second.
const SEEDANCE_2P5_VIDEO_REFERENCE_CENTS_PER_SECOND_480P: f64 = 7.24279835;
/// Seedance 2.5 — 720p price with video references, USD cents per second.
const SEEDANCE_2P5_VIDEO_REFERENCE_CENTS_PER_SECOND_720P: f64 = 15.84362140;

/// ArtCraft's price (USD cents) for Seedance 2.5.
///
/// Only 480p and 720p are offered; any other resolution prices at 720p.
/// Without video references, billed seconds = output duration. With video
/// references, the per-second rate drops but the billed seconds are the
/// output duration PLUS the total seconds of reference video input (clamped
/// to the 4..=30 second billing range). The fractional total is rounded UP
/// to a whole cent. No batching.
pub fn seedance_2p5_usd_cents(
  resolution: CommonResolution,
  duration_seconds: u16,
  has_video_references: bool,
  maybe_total_input_seconds: Option<u16>,
) -> u64 {
  let (cents_per_second, billed_seconds) = if has_video_references {
    let rate = match resolution {
      CommonResolution::FourEightyP => SEEDANCE_2P5_VIDEO_REFERENCE_CENTS_PER_SECOND_480P,
      // Everything else (including 720p and unsupported resolutions) prices at 720p.
      _ => SEEDANCE_2P5_VIDEO_REFERENCE_CENTS_PER_SECOND_720P,
    };
    // The TOTAL input duration clamps to the 4..=30 second billing range
    // (three 1s videos sum to 3 and bill 4; three 3s videos bill 9).
    //
    // FAILSAFE: an unknown (never probed) or zero input duration bills the
    // 30-second MAXIMUM, matching the provider client's own fallback. It
    // must never default toward the minimum — billing 4 input seconds for
    // an unmeasured input while the provider assumes 30 sells input seconds
    // far below cost.
    let billed_input_seconds = match maybe_total_input_seconds {
      None | Some(0) => u16::from(MAX_BILLED_INPUT_SECONDS),
      Some(seconds) => {
        seconds.clamp(u16::from(MIN_BILLED_INPUT_SECONDS), u16::from(MAX_BILLED_INPUT_SECONDS))
      }
    };
    (rate, u64::from(duration_seconds) + u64::from(billed_input_seconds))
  } else {
    let rate = match resolution {
      CommonResolution::FourEightyP => SEEDANCE_2P5_CENTS_PER_SECOND_480P,
      _ => SEEDANCE_2P5_CENTS_PER_SECOND_720P,
    };
    (rate, u64::from(duration_seconds))
  };

  (cents_per_second * billed_seconds as f64).ceil() as u64
}

/// Seedance 2.5 Ultra — 480p price, USD cents per second.
const SEEDANCE_2P5_ULTRA_CENTS_PER_SECOND_480P: f64 = 13.90946502;
/// Seedance 2.5 Ultra — 720p price, USD cents per second.
const SEEDANCE_2P5_ULTRA_CENTS_PER_SECOND_720P: f64 = 31.56378601;
/// Seedance 2.5 Ultra — 480p price with video references, USD cents per second.
const SEEDANCE_2P5_ULTRA_VIDEO_REFERENCE_CENTS_PER_SECOND_480P: f64 = 8.55967078;
/// Seedance 2.5 Ultra — 720p price with video references, USD cents per second.
const SEEDANCE_2P5_ULTRA_VIDEO_REFERENCE_CENTS_PER_SECOND_720P: f64 = 18.72427984;

/// ArtCraft's price (USD cents) for Seedance 2.5 Ultra.
///
/// Only 480p and 720p are offered; any other resolution prices at 720p.
/// Without video references, billed seconds = output duration. With video
/// references, the per-second rate drops but the billed seconds are the
/// output duration PLUS the total seconds of reference video input. The
/// fractional total is rounded UP to a whole cent. No batching.
pub fn seedance_2p5_ultra_usd_cents(
  resolution: CommonResolution,
  duration_seconds: u16,
  has_video_references: bool,
  maybe_total_input_seconds: Option<u16>,
) -> u64 {
  let (cents_per_second, billed_seconds) = if has_video_references {
    let rate = match resolution {
      CommonResolution::FourEightyP => SEEDANCE_2P5_ULTRA_VIDEO_REFERENCE_CENTS_PER_SECOND_480P,
      // Everything else (including 720p and unsupported resolutions) prices at 720p.
      _ => SEEDANCE_2P5_ULTRA_VIDEO_REFERENCE_CENTS_PER_SECOND_720P,
    };
    // The TOTAL input duration clamps to the 4..=30 second billing range
    // (three 1s videos sum to 3 and bill 4; three 3s videos bill 9).
    //
    // FAILSAFE: an unknown (never probed) or zero input duration bills the
    // 30-second MAXIMUM, matching the provider client's own fallback. It
    // must never default toward the minimum — billing 4 input seconds for
    // an unmeasured input while the provider assumes 30 sells input seconds
    // far below cost.
    let billed_input_seconds = match maybe_total_input_seconds {
      None | Some(0) => u16::from(MAX_BILLED_INPUT_SECONDS),
      Some(seconds) => {
        seconds.clamp(u16::from(MIN_BILLED_INPUT_SECONDS), u16::from(MAX_BILLED_INPUT_SECONDS))
      }
    };
    (rate, u64::from(duration_seconds) + u64::from(billed_input_seconds))
  } else {
    let rate = match resolution {
      CommonResolution::FourEightyP => SEEDANCE_2P5_ULTRA_CENTS_PER_SECOND_480P,
      _ => SEEDANCE_2P5_ULTRA_CENTS_PER_SECOND_720P,
    };
    (rate, u64::from(duration_seconds))
  };

  (cents_per_second * billed_seconds as f64).ceil() as u64
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
  fn four_k_base_prices() {
    assert_eq!(seedance_2p0_four_k_usd_cents(4, 1), 358);
    assert_eq!(seedance_2p0_four_k_usd_cents(5, 1), 447);
    assert_eq!(seedance_2p0_four_k_usd_cents(10, 1), 893);
    assert_eq!(seedance_2p0_four_k_usd_cents(15, 1), 1340);
  }

  #[test]
  fn batch_count_multiplies() {
    assert_eq!(seedance_2p0_four_k_usd_cents(5, 2), 893);
    assert_eq!(seedance_2p0_four_k_usd_cents(5, 4), 1786);
  }

  // ── Seedance 2.0 Mini ──
  //
  // Every combination (480p/720p × with/without video reference × 4/5/10/15s)
  // at batch 1, rounded up to whole cents.

  mod mini {
    use super::*;

    fn cents(res: CommonResolution, dur: u16, has_ref: bool) -> u64 {
      seedance_2p0_mini_usd_cents(res, dur, 1, has_ref)
    }

    #[test]
    fn four_eighty_p_without_video_reference() {
      assert_eq!(cents(CommonResolution::FourEightyP, 4, false), 14);
      assert_eq!(cents(CommonResolution::FourEightyP, 5, false), 18);
      assert_eq!(cents(CommonResolution::FourEightyP, 10, false), 35);
      assert_eq!(cents(CommonResolution::FourEightyP, 15, false), 52);
    }

    #[test]
    fn four_eighty_p_with_video_reference() {
      assert_eq!(cents(CommonResolution::FourEightyP, 4, true), 18);
      assert_eq!(cents(CommonResolution::FourEightyP, 5, true), 22);
      assert_eq!(cents(CommonResolution::FourEightyP, 10, true), 44);
      assert_eq!(cents(CommonResolution::FourEightyP, 15, true), 66);
    }

    #[test]
    fn seven_twenty_p_without_video_reference() {
      assert_eq!(cents(CommonResolution::SevenTwentyP, 4, false), 36);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 5, false), 45);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 10, false), 89);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 15, false), 134);
    }

    #[test]
    fn seven_twenty_p_with_video_reference() {
      assert_eq!(cents(CommonResolution::SevenTwentyP, 4, true), 43);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 5, true), 54);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 10, true), 108);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 15, true), 161);
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
      assert_eq!(seedance_2p0_mini_usd_cents(CommonResolution::SevenTwentyP, 5, 2, false), 89);
      assert_eq!(seedance_2p0_mini_usd_cents(CommonResolution::SevenTwentyP, 5, 4, false), 178);
      assert_eq!(seedance_2p0_mini_usd_cents(CommonResolution::FourEightyP, 5, 2, false), 35);
    }
  }

  // ── Seedance 2.0 BytePlus / BytePlus Ultra Mini ──
  //
  // Same combinations as the regular Mini; the prices are equal-or-higher
  // than the regular Mini.

  mod byteplus_mini {
    use super::*;

    fn cents(res: CommonResolution, dur: u16, has_ref: bool) -> u64 {
      seedance_2p0_byteplus_mini_usd_cents(res, dur, 1, has_ref)
    }

    #[test]
    fn four_eighty_p_without_video_reference() {
      assert_eq!(cents(CommonResolution::FourEightyP, 4, false), 15);
      assert_eq!(cents(CommonResolution::FourEightyP, 5, false), 18);
      assert_eq!(cents(CommonResolution::FourEightyP, 10, false), 36);
      assert_eq!(cents(CommonResolution::FourEightyP, 15, false), 54);
    }

    #[test]
    fn four_eighty_p_with_video_reference() {
      assert_eq!(cents(CommonResolution::FourEightyP, 4, true), 18);
      assert_eq!(cents(CommonResolution::FourEightyP, 5, true), 23);
      assert_eq!(cents(CommonResolution::FourEightyP, 10, true), 45);
      assert_eq!(cents(CommonResolution::FourEightyP, 15, true), 68);
    }

    #[test]
    fn seven_twenty_p_without_video_reference() {
      assert_eq!(cents(CommonResolution::SevenTwentyP, 4, false), 37);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 5, false), 46);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 10, false), 91);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 15, false), 137);
    }

    #[test]
    fn seven_twenty_p_with_video_reference() {
      assert_eq!(cents(CommonResolution::SevenTwentyP, 4, true), 44);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 5, true), 55);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 10, true), 110);
      assert_eq!(cents(CommonResolution::SevenTwentyP, 15, true), 165);
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
      assert_eq!(seedance_2p0_byteplus_mini_usd_cents(CommonResolution::SevenTwentyP, 5, 2, false), 91);
      assert_eq!(seedance_2p0_byteplus_mini_usd_cents(CommonResolution::SevenTwentyP, 5, 4, false), 182);
      assert_eq!(seedance_2p0_byteplus_mini_usd_cents(CommonResolution::FourEightyP, 5, 2, false), 36);
    }
  }
}

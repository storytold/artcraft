use crate::cost::constants::CREDITS_PER_DOLLAR;

/// The cost of a Kinovi Seedance 2.0 Mini generation, with the video-reference
/// surcharge broken out from the base price.
///
/// Unlike the other Seedance models, Mini credits can be FRACTIONAL (480p is
/// 7.5 credits/sec, so odd durations land on half-credits like 37.5). Credits
/// are therefore tracked as `f64`. USD conversions are derived from the exact
/// fractional credit amount.
///
/// `total_cost` covers base + surcharge. NB: the total's USD conversions are
/// computed from the SUMMED credits (rounded once), so they may differ by a
/// cent from adding the parts' rounded USD values together.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct KinoviSeedanceMiniGenerationCost {
  /// The full cost (base + any surcharge), in credits and USD cents.
  pub total_cost: KinoviMiniGenerationCost,

  /// The base generation cost (resolution rate × output duration × batch
  /// count), excluding any surcharges.
  pub base_cost: KinoviMiniGenerationCost,

  /// The video-reference surcharge, when one or more reference videos are
  /// attached. `None` when no reference videos are attached.
  pub video_reference_surcharge_cost: Option<KinoviMiniGenerationCost>,
}

impl KinoviSeedanceMiniGenerationCost {
  /// Build a cost from base credits plus an optional video-reference
  /// surcharge (both in Kinovi credits, possibly fractional). The per-part
  /// and total USD conversions are derived.
  pub fn from_base_and_surcharge(
    base_credits: f64,
    maybe_video_reference_surcharge_credits: Option<f64>,
  ) -> Self {
    let total_credits = base_credits + maybe_video_reference_surcharge_credits.unwrap_or(0.0);
    Self {
      total_cost: KinoviMiniGenerationCost::from_kinovi_credits(total_credits),
      base_cost: KinoviMiniGenerationCost::from_kinovi_credits(base_credits),
      video_reference_surcharge_cost: maybe_video_reference_surcharge_credits
        .map(KinoviMiniGenerationCost::from_kinovi_credits),
    }
  }
}

/// The cost of a Kinovi Seedance 2.0 Mini generation, in both native credits
/// (fractional) and USD cents.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct KinoviMiniGenerationCost {
  /// The cost of the generation in Kinovi credits. May be fractional (e.g.
  /// 37.5 for 480p at 5 seconds).
  pub kinovi_credits: f64,

  /// Estimated cost in cents, rounded up to the nearest whole cent.
  /// This does not account for discounts, prorations, etc.
  pub usd_cents_rounded_up: u64,

  /// Estimated cost in cents, rounded down to the nearest whole cent.
  pub usd_cents_rounded_down: u64,

  /// Estimated cost in cents without rounding (the exact fractional value).
  pub usd_cents_fractional: f64,
}

impl KinoviMiniGenerationCost {
  /// Build a cost from a (possibly fractional) Kinovi credit amount, deriving
  /// the USD cents via the credit-package rate.
  ///
  /// Mini credits are always multiples of 0.5, so the USD conversion is done
  /// on integer half-credits to keep it exact (no floating-point rounding in
  /// the integer cent results).
  pub fn from_kinovi_credits(kinovi_credits: f64) -> Self {
    // half_credits = credits × 2 (exact, since credits is a multiple of 0.5).
    // credits × 100 == half_credits × 50, so this is the same numerator the
    // integer KinoviGenerationCost uses, computed without fractional drift.
    let half_credits = (kinovi_credits * 2.0).round() as u64;
    let total_hundredths = half_credits * 50;
    Self {
      kinovi_credits,
      usd_cents_rounded_up: total_hundredths.div_ceil(CREDITS_PER_DOLLAR),
      usd_cents_rounded_down: total_hundredths / CREDITS_PER_DOLLAR,
      usd_cents_fractional: total_hundredths as f64 / CREDITS_PER_DOLLAR as f64,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  const FLOAT_TOLERANCE: f64 = 1e-9;

  mod generation_cost {
    use super::*;

    #[test]
    fn fractional_credits_convert_to_usd() {
      // 37.5 credits; 3750/243 = 15.4320 cents.
      let cost = KinoviMiniGenerationCost::from_kinovi_credits(37.5);
      assert_eq!(cost.kinovi_credits, 37.5);
      assert_eq!(cost.usd_cents_rounded_up, 16);
      assert_eq!(cost.usd_cents_rounded_down, 15);
      assert!((cost.usd_cents_fractional - (3750.0 / 243.0)).abs() < FLOAT_TOLERANCE);
    }

    #[test]
    fn whole_credits_convert_to_usd() {
      // 100 credits; 10000/243 = 41.1522 cents.
      let cost = KinoviMiniGenerationCost::from_kinovi_credits(100.0);
      assert_eq!(cost.kinovi_credits, 100.0);
      assert_eq!(cost.usd_cents_rounded_up, 42);
      assert_eq!(cost.usd_cents_rounded_down, 41);
      assert!((cost.usd_cents_fractional - (10000.0 / 243.0)).abs() < FLOAT_TOLERANCE);
    }

    #[test]
    fn rounded_bounds_bracket_the_fractional_value() {
      for half_credits in [0u64, 1, 15, 75, 95, 200, 225, 600, 720] {
        let credits = half_credits as f64 / 2.0;
        let cost = KinoviMiniGenerationCost::from_kinovi_credits(credits);
        assert!(cost.usd_cents_rounded_down as f64 <= cost.usd_cents_fractional);
        assert!(cost.usd_cents_fractional <= cost.usd_cents_rounded_up as f64);
        assert!(cost.usd_cents_rounded_up - cost.usd_cents_rounded_down <= 1);
      }
    }
  }

  mod seedance_mini_cost {
    use super::*;

    #[test]
    fn without_surcharge_total_equals_base() {
      let cost = KinoviSeedanceMiniGenerationCost::from_base_and_surcharge(37.5, None);
      assert!(cost.video_reference_surcharge_cost.is_none());
      assert_eq!(cost.base_cost.kinovi_credits, 37.5);
      assert_eq!(cost.total_cost, cost.base_cost);
    }

    #[test]
    fn with_surcharge_sums_into_total() {
      // 480p 5s with video ref: 37.5 base + 10 surcharge = 47.5 total.
      let cost = KinoviSeedanceMiniGenerationCost::from_base_and_surcharge(37.5, Some(10.0));
      assert_eq!(cost.base_cost.kinovi_credits, 37.5);
      assert_eq!(
        cost.video_reference_surcharge_cost.map(|c| c.kinovi_credits),
        Some(10.0),
      );
      assert_eq!(cost.total_cost.kinovi_credits, 47.5);
      // 47.5 credits; 4750/243 = 19.5473 → 20¢.
      assert_eq!(cost.total_cost.usd_cents_rounded_up, 20);
      assert_eq!(cost.total_cost.usd_cents_rounded_down, 19);
    }
  }
}

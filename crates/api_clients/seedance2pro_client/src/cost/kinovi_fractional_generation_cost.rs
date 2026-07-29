use crate::cost::constants::CREDITS_PER_DOLLAR;

/// The cost of a Kinovi generation that bills FRACTIONAL credits, in both
/// native credits and USD cents.
///
/// This is the fractional-credit counterpart of
/// [`crate::cost::kinovi_generation_cost::KinoviGenerationCost`] (which uses
/// `u64`). Some Kinovi models bill non-integer credits — e.g. Seedance 2.0
/// Mini at 480p bills 7.5 credits/sec, landing on half-credits like 37.5 at
/// odd durations. Any model with a fractional credit rate uses this type;
/// whole-credit models use the cheaper `u64` `KinoviGenerationCost`.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct KinoviFractionalGenerationCost {
  /// The cost of the generation in Kinovi credits. May be fractional (e.g.
  /// 37.5 for Seedance 2.0 Mini 480p at 5 seconds).
  pub kinovi_credits: f64,

  /// Estimated cost in cents, rounded up to the nearest whole cent.
  /// This does not account for discounts, prorations, etc.
  pub usd_cents_rounded_up: u64,

  /// Estimated cost in cents, rounded down to the nearest whole cent.
  pub usd_cents_rounded_down: u64,

  /// Estimated cost in cents without rounding (the exact fractional value).
  pub usd_cents_fractional: f64,
}

impl KinoviFractionalGenerationCost {
  /// Build a cost from a (possibly fractional) Kinovi credit amount, deriving
  /// the USD cents via the credit-package rate.
  ///
  /// The conversion is done on integer hundredths-of-a-credit, so the integer
  /// cent results are exact (no floating-point drift). Credit amounts are
  /// rounded to the nearest hundredth of a credit, which covers every Kinovi
  /// rate seen so far (e.g. Mini's half-credits).
  pub fn from_kinovi_credits(kinovi_credits: f64) -> Self {
    // usd_cents == credits × 100 / CREDITS_PER_DOLLAR == hundredths / CREDITS_PER_DOLLAR.
    let hundredths_of_credit = (kinovi_credits * 100.0).round() as u64;
    Self {
      kinovi_credits,
      usd_cents_rounded_up: hundredths_of_credit.div_ceil(CREDITS_PER_DOLLAR),
      usd_cents_rounded_down: hundredths_of_credit / CREDITS_PER_DOLLAR,
      usd_cents_fractional: hundredths_of_credit as f64 / CREDITS_PER_DOLLAR as f64,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  const FLOAT_TOLERANCE: f64 = 1e-9;

  #[test]
  fn fractional_credits_convert_to_usd() {
    // 37.5 credits; 3750/243 = 15.4320 cents.
    let cost = KinoviFractionalGenerationCost::from_kinovi_credits(37.5);
    assert_eq!(cost.kinovi_credits, 37.5);
    assert_eq!(cost.usd_cents_rounded_up, 16);
    assert_eq!(cost.usd_cents_rounded_down, 15);
    assert!((cost.usd_cents_fractional - (3750.0 / 243.0)).abs() < FLOAT_TOLERANCE);
  }

  #[test]
  fn whole_credits_convert_to_usd() {
    // 100 credits; 10000/243 = 41.1522 cents.
    let cost = KinoviFractionalGenerationCost::from_kinovi_credits(100.0);
    assert_eq!(cost.kinovi_credits, 100.0);
    assert_eq!(cost.usd_cents_rounded_up, 42);
    assert_eq!(cost.usd_cents_rounded_down, 41);
    assert!((cost.usd_cents_fractional - (10000.0 / 243.0)).abs() < FLOAT_TOLERANCE);
  }

  #[test]
  fn rounded_bounds_bracket_the_fractional_value() {
    for half_credits in [0u64, 1, 15, 75, 95, 200, 225, 600, 720] {
      let credits = half_credits as f64 / 2.0;
      let cost = KinoviFractionalGenerationCost::from_kinovi_credits(credits);
      assert!(cost.usd_cents_rounded_down as f64 <= cost.usd_cents_fractional);
      assert!(cost.usd_cents_fractional <= cost.usd_cents_rounded_up as f64);
      assert!(cost.usd_cents_rounded_up - cost.usd_cents_rounded_down <= 1);
    }
  }
}

use crate::cost::constants::CREDITS_PER_DOLLAR;

/// The cost of a Kinovi generation, in both native credits and USD cents.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct KinoviGenerationCost {
  /// The cost of the generation in Kinovi credits.
  pub kinovi_credits: u64,

  /// Estimated cost in cents, rounded up to the nearest whole cent.
  /// This does not account for discounts, prorations, etc.
  /// This is always rounded up when fractional.
  pub usd_cents_rounded_up: u64,

  /// Estimated cost in cents, rounded down to the nearest whole cent.
  pub usd_cents_rounded_down: u64,

  /// Estimated cost in cents without rounding (the exact fractional value).
  pub usd_cents_fractional: f64,
}

impl KinoviGenerationCost {
  /// Build a cost from a Kinovi credit amount, deriving the USD cents via
  /// the credit-package rate.
  pub fn from_kinovi_credits(kinovi_credits: u64) -> Self {
    let total_hundredths = kinovi_credits * 100;
    Self {
      kinovi_credits,
      // Integer ceiling / floor of (credits * 100 / CREDITS_PER_DOLLAR).
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

  #[test]
  fn zero_credits_is_zero_cents() {
    let cost = KinoviGenerationCost::from_kinovi_credits(0);
    assert_eq!(cost.kinovi_credits, 0);
    assert_eq!(cost.usd_cents_rounded_up, 0);
    assert_eq!(cost.usd_cents_rounded_down, 0);
    assert!((cost.usd_cents_fractional - 0.0).abs() < FLOAT_TOLERANCE);
  }

  #[test]
  fn exact_dollar_boundaries_do_not_round() {
    // 243 credits = exactly $1.00 — all three representations agree.
    let cost = KinoviGenerationCost::from_kinovi_credits(243);
    assert_eq!(cost.kinovi_credits, 243);
    assert_eq!(cost.usd_cents_rounded_up, 100);
    assert_eq!(cost.usd_cents_rounded_down, 100);
    assert!((cost.usd_cents_fractional - 100.0).abs() < FLOAT_TOLERANCE);

    let cost = KinoviGenerationCost::from_kinovi_credits(486);
    assert_eq!(cost.usd_cents_rounded_up, 200);
    assert_eq!(cost.usd_cents_rounded_down, 200);
    assert!((cost.usd_cents_fractional - 200.0).abs() < FLOAT_TOLERANCE);
  }

  #[test]
  fn fractional_cents_round_in_both_directions() {
    // 244 credits = 100.411... cents.
    let cost = KinoviGenerationCost::from_kinovi_credits(244);
    assert_eq!(cost.usd_cents_rounded_up, 101);
    assert_eq!(cost.usd_cents_rounded_down, 100);
    assert!((cost.usd_cents_fractional - (24400.0 / 243.0)).abs() < FLOAT_TOLERANCE);

    // 1 credit = 0.432... cents.
    let cost = KinoviGenerationCost::from_kinovi_credits(1);
    assert_eq!(cost.usd_cents_rounded_up, 1);
    assert_eq!(cost.usd_cents_rounded_down, 0);
    assert!((cost.usd_cents_fractional - (100.0 / 243.0)).abs() < FLOAT_TOLERANCE);
  }

  #[test]
  fn rounded_bounds_bracket_the_fractional_value() {
    for credits in [0, 1, 12, 75, 200, 243, 244, 450, 1350] {
      let cost = KinoviGenerationCost::from_kinovi_credits(credits);
      assert!(cost.usd_cents_rounded_down as f64 <= cost.usd_cents_fractional);
      assert!(cost.usd_cents_fractional <= cost.usd_cents_rounded_up as f64);
      assert!(cost.usd_cents_rounded_up - cost.usd_cents_rounded_down <= 1);
    }
  }
}

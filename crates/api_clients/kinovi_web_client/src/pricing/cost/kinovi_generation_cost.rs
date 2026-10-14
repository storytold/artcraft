use crate::pricing::constants::ENTERPRISE_CREDITS_PER_DOLLAR;

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
    let total_hundredths = u128::from(kinovi_credits) * 100;
    let credits_per_dollar = u128::from(ENTERPRISE_CREDITS_PER_DOLLAR);
    let rounded_up = total_hundredths.div_ceil(credits_per_dollar);
    let rounded_down = total_hundredths / credits_per_dollar;

    Self {
      kinovi_credits,
      // Keep the intermediate multiplication wide enough for every u64 credit amount.
      usd_cents_rounded_up: u64::try_from(rounded_up).unwrap_or(u64::MAX),
      usd_cents_rounded_down: u64::try_from(rounded_down).unwrap_or(u64::MAX),
      usd_cents_fractional: total_hundredths as f64 / credits_per_dollar as f64,
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

  #[test]
  fn large_credit_values_do_not_overflow_intermediate_math() {
    // `credits * 100` used to overflow u64 immediately above this threshold.
    let threshold = u64::MAX / 100;

    let cost = KinoviGenerationCost::from_kinovi_credits(threshold);
    assert_eq!(cost.usd_cents_rounded_up, 75_912_527_052_302_682);
    assert_eq!(cost.usd_cents_rounded_down, 75_912_527_052_302_681);

    let cost = KinoviGenerationCost::from_kinovi_credits(threshold + 1);
    assert_eq!(cost.usd_cents_rounded_up, 75_912_527_052_302_682);
    assert_eq!(cost.usd_cents_rounded_down, 75_912_527_052_302_681);

    let cost = KinoviGenerationCost::from_kinovi_credits(u64::MAX);
    assert_eq!(cost.usd_cents_rounded_up, 7_591_252_705_230_268_155);
    assert_eq!(cost.usd_cents_rounded_down, 7_591_252_705_230_268_154);
    assert!(cost.usd_cents_fractional.is_finite());
  }
}

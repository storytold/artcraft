/// Kinovi credits per US dollar.
/// Credit package: 22,000 credits for $114 (~192.98 credits/$1, rounded to 193).
const CREDITS_PER_DOLLAR: u64 = 193;

/// The cost of a Kinovi generation, in both native credits and USD cents.
pub struct KinoviGenerationCost {
  /// The cost of the generation in Kinovi credits.
  pub kinovi_credits: u64,

  /// Estimated cost in cents, rounded up to the nearest whole cent.
  /// This does not account for discounts, prorations, etc.
  /// This is always rounded up when fractional.
  pub usd_cents_rounded_up: u64,
}

impl KinoviGenerationCost {
  /// Build a cost from a Kinovi credit amount, deriving the USD cents via
  /// the credit-package rate (always rounding up fractional cents).
  pub fn from_kinovi_credits(kinovi_credits: u64) -> Self {
    // Integer ceiling of (credits * 100 / CREDITS_PER_DOLLAR).
    let usd_cents_rounded_up = (kinovi_credits * 100).div_ceil(CREDITS_PER_DOLLAR);
    Self {
      kinovi_credits,
      usd_cents_rounded_up,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn zero_credits_is_zero_cents() {
    let cost = KinoviGenerationCost::from_kinovi_credits(0);
    assert_eq!(cost.kinovi_credits, 0);
    assert_eq!(cost.usd_cents_rounded_up, 0);
  }

  #[test]
  fn exact_dollar_boundaries_do_not_round() {
    // 193 credits = exactly $1.00.
    let cost = KinoviGenerationCost::from_kinovi_credits(193);
    assert_eq!(cost.kinovi_credits, 193);
    assert_eq!(cost.usd_cents_rounded_up, 100);

    let cost = KinoviGenerationCost::from_kinovi_credits(386);
    assert_eq!(cost.usd_cents_rounded_up, 200);
  }

  #[test]
  fn fractional_cents_round_up() {
    // 194 credits = 100.518... cents -> 101.
    let cost = KinoviGenerationCost::from_kinovi_credits(194);
    assert_eq!(cost.usd_cents_rounded_up, 101);

    // 1 credit = 0.518... cents -> 1.
    let cost = KinoviGenerationCost::from_kinovi_credits(1);
    assert_eq!(cost.usd_cents_rounded_up, 1);
  }
}

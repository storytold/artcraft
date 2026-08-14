use crate::cost::constants::{CONSUMER_CREDITS_PER_DOLLAR_FLOAT, ENTERPRISE_CREDITS_PER_DOLLAR_FLOAT};
use crate::cost::kinovi_fractional_generation_cost::KinoviFractionalGenerationCost;

/// Which credit purchase rate and per-model credit rate to price against.
///
/// Enterprise is our own bulk pricing: the enterprise credit purchase rate
/// plus any negotiated per-model/per-modality credit discount. Consumer is
/// what an ordinary Kinovi customer pays: the consumer credit purchase rate
/// and the standard per-model credit rate.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum KinoviPricingTier {
  Enterprise,
  Consumer,
}

impl KinoviPricingTier {
  /// The credit purchase rate for this tier, in credits per US dollar.
  pub const fn credits_per_dollar(self) -> f64 {
    match self {
      KinoviPricingTier::Enterprise => ENTERPRISE_CREDITS_PER_DOLLAR_FLOAT,
      KinoviPricingTier::Consumer => CONSUMER_CREDITS_PER_DOLLAR_FLOAT,
    }
  }

  /// Convert a (possibly fractional) credit amount into a
  /// [`KinoviFractionalGenerationCost`] at this tier's purchase rate.
  ///
  /// The credit amount is snapped to the nearest hundredth of a credit, so
  /// totals land exactly on the observed values (e.g. 46.15 × 15 = 692.25,
  /// not the 692.250000000001 float artifact) and the integer cent results
  /// are exact.
  pub fn cost_from_credits(self, kinovi_credits: f64) -> KinoviFractionalGenerationCost {
    let credit_hundredths = (kinovi_credits * 100.0).round();
    // usd_cents == credits × 100 / credits_per_dollar == hundredths / credits_per_dollar.
    let usd_cents_fractional = credit_hundredths / self.credits_per_dollar();
    KinoviFractionalGenerationCost {
      kinovi_credits: credit_hundredths / 100.0,
      usd_cents_rounded_up: usd_cents_fractional.ceil() as u64,
      usd_cents_rounded_down: usd_cents_fractional.floor() as u64,
      usd_cents_fractional,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  const FLOAT_TOLERANCE: f64 = 1e-9;

  #[test]
  fn credits_per_dollar_rates() {
    assert_eq!(KinoviPricingTier::Enterprise.credits_per_dollar(), 243.16);
    assert_eq!(KinoviPricingTier::Consumer.credits_per_dollar(), 192.98);
  }

  #[test]
  fn spot_check_enterprise() {
    // One dollar's worth of credits at the enterprise rate = exactly 100¢.
    // Breaks if the rate changes.
    assert_eq!(KinoviPricingTier::Enterprise.cost_from_credits(243.16).kinovi_credits, 243.16);
    assert_eq!(KinoviPricingTier::Enterprise.cost_from_credits(243.16).usd_cents_rounded_up, 100);
    assert_eq!(KinoviPricingTier::Enterprise.cost_from_credits(243.16).usd_cents_rounded_down, 100);
    assert_eq!(KinoviPricingTier::Enterprise.cost_from_credits(243.16).usd_cents_fractional, 100.0);
  }

  #[test]
  fn spot_check_consumer() {
    // One dollar's worth of credits at the consumer rate = exactly 100¢.
    // Breaks if the rate changes.
    assert_eq!(KinoviPricingTier::Consumer.cost_from_credits(192.98).kinovi_credits, 192.98);
    assert_eq!(KinoviPricingTier::Consumer.cost_from_credits(192.98).usd_cents_rounded_up, 100);
    assert_eq!(KinoviPricingTier::Consumer.cost_from_credits(192.98).usd_cents_rounded_down, 100);
    assert_eq!(KinoviPricingTier::Consumer.cost_from_credits(192.98).usd_cents_fractional, 100.0);
  }

  #[test]
  fn enterprise_cost_from_credits() {
    // 37.5 credits; 3750/243.16 = 15.4221 cents.
    let cost = KinoviPricingTier::Enterprise.cost_from_credits(37.5);
    assert_eq!(cost.kinovi_credits, 37.5);
    assert_eq!(cost.usd_cents_rounded_up, 16);
    assert_eq!(cost.usd_cents_rounded_down, 15);
    assert!((cost.usd_cents_fractional - (3750.0 / 243.16)).abs() < FLOAT_TOLERANCE);
  }

  #[test]
  fn consumer_cost_from_credits() {
    // 37.5 credits; 3750/192.98 = 19.4321 cents.
    let cost = KinoviPricingTier::Consumer.cost_from_credits(37.5);
    assert_eq!(cost.kinovi_credits, 37.5);
    assert_eq!(cost.usd_cents_rounded_up, 20);
    assert_eq!(cost.usd_cents_rounded_down, 19);
    assert!((cost.usd_cents_fractional - (3750.0 / 192.98)).abs() < FLOAT_TOLERANCE);
  }

  #[test]
  fn credits_snap_to_the_nearest_hundredth() {
    // 46.15 × 15 accumulates float drift (692.250000000001); the conversion
    // must land exactly on 692.25.
    let cost = KinoviPricingTier::Enterprise.cost_from_credits(46.15 * 15.0);
    assert_eq!(cost.kinovi_credits, 692.25);
  }
}

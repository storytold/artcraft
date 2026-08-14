use crate::cost::kinovi_pricing_tier::KinoviPricingTier;

/// The credit cost of one billable unit (e.g. one second of video for the
/// Seedance models) at each pricing tier.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct KinoviPricingRate {
  /// The standard rate every Kinovi customer pays.
  pub consumer_credits: f64,
  /// A negotiated enterprise discount rate, when one exists. Enterprise
  /// pricing falls back to `consumer_credits` when absent.
  pub maybe_enterprise_credits: Option<f64>,
}

impl KinoviPricingRate {
  /// The credit rate at the given tier. Enterprise falls back to the
  /// consumer rate when no discount exists.
  pub fn credits(&self, tier: KinoviPricingTier) -> f64 {
    match tier {
      KinoviPricingTier::Enterprise => self.maybe_enterprise_credits.unwrap_or(self.consumer_credits),
      KinoviPricingTier::Consumer => self.consumer_credits,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn discounted_rate_applies_to_enterprise_only() {
    let rate = KinoviPricingRate { consumer_credits: 46.15, maybe_enterprise_credits: Some(42.13) };
    assert_eq!(rate.credits(KinoviPricingTier::Consumer), 46.15);
    assert_eq!(rate.credits(KinoviPricingTier::Enterprise), 42.13);
  }

  #[test]
  fn enterprise_falls_back_to_consumer_rate_when_no_discount() {
    let rate = KinoviPricingRate { consumer_credits: 10.0, maybe_enterprise_credits: None };
    assert_eq!(rate.credits(KinoviPricingTier::Enterprise), 10.0);
    assert_eq!(rate.credits(KinoviPricingTier::Consumer), 10.0);
  }
}

use crate::pricing::kinovi_pricing_tier::KinoviPricingTier;

/// Prices a generation request at either pricing tier.
///
/// NOTE: the Seedance video models implement this; the other models still
/// expose single-rate inherent `calculate_costs()` methods and will migrate
/// here.
pub trait KinoviCostCalculatorTrait {
  type Cost;

  fn calculate_costs(&self, tier: KinoviPricingTier) -> Self::Cost;

  fn calculate_consumer_costs(&self) -> Self::Cost {
    self.calculate_costs(KinoviPricingTier::Consumer)
  }

  fn calculate_enterprise_costs(&self) -> Self::Cost {
    self.calculate_costs(KinoviPricingTier::Enterprise)
  }
}

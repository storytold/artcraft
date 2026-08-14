use crate::pricing::cost::kinovi_fractional_generation_cost::KinoviFractionalGenerationCost;
use crate::pricing::kinovi_pricing_tier::KinoviPricingTier;

/// The cost of a Kinovi Seedance generation (Seedance 2.0, Fast, and Mini),
/// with the video-reference surcharge broken out from the base price.
///
/// Credits are fractional (`f64`): Mini's consumer 480p rate is 7.5/sec, and
/// the enterprise discount rates land on fractional credits at most
/// durations (e.g. Seedance 2.0 at 37.9/sec).
///
/// `total_cost` covers base + surcharge. NB: the total's USD conversions are
/// computed from the SUMMED credits (rounded once), so they may differ by a
/// cent from adding the parts' rounded USD values together.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct KinoviSeedanceFractionalGenerationCost {
  /// The full cost (base + any surcharge), in credits and USD cents.
  pub total_cost: KinoviFractionalGenerationCost,

  /// The base generation cost (resolution rate × output duration × batch
  /// count), excluding any surcharges.
  pub base_cost: KinoviFractionalGenerationCost,

  /// The video-reference surcharge, when one or more reference videos are
  /// attached. `None` when no reference videos are attached.
  pub video_reference_surcharge_cost: Option<KinoviFractionalGenerationCost>,
}

impl KinoviSeedanceFractionalGenerationCost {
  /// Build a cost from base credits plus an optional video-reference
  /// surcharge (both in Kinovi credits, possibly fractional), converting to
  /// USD at the given pricing tier's credit purchase rate.
  pub fn from_base_and_surcharge_at_tier(
    tier: KinoviPricingTier,
    base_credits: f64,
    maybe_video_reference_surcharge_credits: Option<f64>,
  ) -> Self {
    let total_credits = base_credits + maybe_video_reference_surcharge_credits.unwrap_or(0.0);
    Self {
      total_cost: tier.cost_from_credits(total_credits),
      base_cost: tier.cost_from_credits(base_credits),
      video_reference_surcharge_cost: maybe_video_reference_surcharge_credits
        .map(|credits| tier.cost_from_credits(credits)),
    }
  }

}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn without_surcharge_total_equals_base() {
    let cost = KinoviSeedanceFractionalGenerationCost::from_base_and_surcharge_at_tier(
      KinoviPricingTier::Enterprise, 37.5, None,
    );
    assert!(cost.video_reference_surcharge_cost.is_none());
    assert_eq!(cost.base_cost.kinovi_credits, 37.5);
    assert_eq!(cost.total_cost, cost.base_cost);
  }

  #[test]
  fn with_surcharge_sums_into_total_at_the_enterprise_rate() {
    // 37.5 base + 10 surcharge = 47.5 total; 4750/243.16 = 19.5344 → 20¢.
    let cost = KinoviSeedanceFractionalGenerationCost::from_base_and_surcharge_at_tier(
      KinoviPricingTier::Enterprise, 37.5, Some(10.0),
    );
    assert_eq!(cost.base_cost.kinovi_credits, 37.5);
    assert_eq!(
      cost.video_reference_surcharge_cost.map(|c| c.kinovi_credits),
      Some(10.0),
    );
    assert_eq!(cost.total_cost.kinovi_credits, 47.5);
    assert_eq!(cost.total_cost.usd_cents_rounded_up, 20);
    assert_eq!(cost.total_cost.usd_cents_rounded_down, 19);
  }

  #[test]
  fn consumer_tier_converts_at_the_consumer_rate() {
    // 47.5 credits; 4750/192.98 = 24.6139 → 25¢.
    let cost = KinoviSeedanceFractionalGenerationCost::from_base_and_surcharge_at_tier(
      KinoviPricingTier::Consumer, 37.5, Some(10.0),
    );
    assert_eq!(cost.total_cost.usd_cents_rounded_up, 25);
    assert_eq!(cost.total_cost.usd_cents_rounded_down, 24);
  }
}

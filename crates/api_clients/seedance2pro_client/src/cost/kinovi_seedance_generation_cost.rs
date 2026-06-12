use crate::cost::kinovi_generation_cost::KinoviGenerationCost;

/// The cost of a Kinovi Seedance generation, with the video-reference
/// surcharge broken out from the base price.
///
/// `total_cost` covers base + surcharge. NB: the total's USD conversions are
/// computed from the SUMMED credits (rounded once), so they may differ by a
/// cent from adding the parts' rounded USD values together.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct KinoviSeedanceGenerationCost {
  /// The full cost (base + any surcharge), in credits and USD cents.
  pub total_cost: KinoviGenerationCost,

  /// The base generation cost (resolution rate × output duration × batch
  /// count), excluding any surcharges.
  pub base_cost: KinoviGenerationCost,

  /// The video-reference surcharge, when one or more reference videos are
  /// attached. `None` when no reference videos are attached.
  pub video_reference_surcharge_cost: Option<KinoviGenerationCost>,
}

impl KinoviSeedanceGenerationCost {
  /// Build a cost from base credits plus an optional video-reference
  /// surcharge (both in Kinovi credits). The per-part and total USD
  /// conversions are derived.
  pub fn from_base_and_surcharge(
    base_credits: u64,
    maybe_video_reference_surcharge_credits: Option<u64>,
  ) -> Self {
    let total_credits = base_credits + maybe_video_reference_surcharge_credits.unwrap_or(0);
    Self {
      total_cost: KinoviGenerationCost::from_kinovi_credits(total_credits),
      base_cost: KinoviGenerationCost::from_kinovi_credits(base_credits),
      video_reference_surcharge_cost: maybe_video_reference_surcharge_credits
        .map(KinoviGenerationCost::from_kinovi_credits),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  const FLOAT_TOLERANCE: f64 = 1e-9;

  #[test]
  fn without_surcharge() {
    let cost = KinoviSeedanceGenerationCost::from_base_and_surcharge(200, None);

    assert!(cost.video_reference_surcharge_cost.is_none());

    // Base: 200 credits; 20000/243 = 82.30.
    assert_eq!(cost.base_cost.kinovi_credits, 200);
    assert_eq!(cost.base_cost.usd_cents_rounded_up, 83);
    assert_eq!(cost.base_cost.usd_cents_rounded_down, 82);
    assert!((cost.base_cost.usd_cents_fractional - (20000.0 / 243.0)).abs() < FLOAT_TOLERANCE);

    // Total equals base when there's no surcharge.
    assert_eq!(cost.total_cost, cost.base_cost);
  }

  #[test]
  fn with_surcharge() {
    let cost = KinoviSeedanceGenerationCost::from_base_and_surcharge(200, Some(40));

    // Base: 200 credits; 20000/243 = 82.30.
    assert_eq!(cost.base_cost.kinovi_credits, 200);
    assert_eq!(cost.base_cost.usd_cents_rounded_up, 83);
    assert_eq!(cost.base_cost.usd_cents_rounded_down, 82);
    assert!((cost.base_cost.usd_cents_fractional - (20000.0 / 243.0)).abs() < FLOAT_TOLERANCE);

    // Surcharge: 40 credits; 4000/243 = 16.46.
    let surcharge = cost.video_reference_surcharge_cost.expect("should have surcharge");
    assert_eq!(surcharge.kinovi_credits, 40);
    assert_eq!(surcharge.usd_cents_rounded_up, 17);
    assert_eq!(surcharge.usd_cents_rounded_down, 16);
    assert!((surcharge.usd_cents_fractional - (4000.0 / 243.0)).abs() < FLOAT_TOLERANCE);

    // Total: 240 credits; 24000/243 = 98.77.
    assert_eq!(cost.total_cost.kinovi_credits, 240);
    assert_eq!(cost.total_cost.usd_cents_rounded_up, 99);
    assert_eq!(cost.total_cost.usd_cents_rounded_down, 98);
    assert!((cost.total_cost.usd_cents_fractional - (24000.0 / 243.0)).abs() < FLOAT_TOLERANCE);
  }

  #[test]
  fn total_credits_are_base_plus_surcharge() {
    let cost = KinoviSeedanceGenerationCost::from_base_and_surcharge(450, Some(90));
    assert_eq!(
      cost.total_cost.kinovi_credits,
      cost.base_cost.kinovi_credits + cost.video_reference_surcharge_cost.unwrap().kinovi_credits);
  }

  /// The total's USD is rounded ONCE on the summed credits, so it can be a
  /// cent under the sum of the parts' rounded-up values.
  #[test]
  fn total_usd_is_rounded_once_not_per_part() {
    let cost = KinoviSeedanceGenerationCost::from_base_and_surcharge(200, Some(40));
    let surcharge = cost.video_reference_surcharge_cost.unwrap();

    // Parts round up to 83 + 17 = 100, but the total (240 credits) rounds
    // once to 99 — one cent less than summing the rounded parts.
    assert_eq!(cost.base_cost.usd_cents_rounded_up + surcharge.usd_cents_rounded_up, 100);
    assert_eq!(cost.total_cost.usd_cents_rounded_up, 99);

    // …but the fractional parts always sum exactly to the fractional total.
    let parts = cost.base_cost.usd_cents_fractional + surcharge.usd_cents_fractional;
    assert!((parts - cost.total_cost.usd_cents_fractional).abs() < FLOAT_TOLERANCE);
  }
}

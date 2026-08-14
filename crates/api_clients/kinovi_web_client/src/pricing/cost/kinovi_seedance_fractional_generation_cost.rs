use crate::pricing::cost::kinovi_fractional_generation_cost::KinoviFractionalGenerationCost;
use crate::pricing::kinovi_pricing_tier::KinoviPricingTier;

// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS TYPE EXISTS (don't merge it into KinoviSeedanceGenerationCost):
//
// This is the fractional twin of `KinoviSeedanceGenerationCost`. It is
// structurally identical (base + optional video-reference surcharge = total)
// and prices the SAME way conceptually — but its credits are fractional
// (`KinoviFractionalGenerationCost`, `f64`) rather than whole
// (`KinoviGenerationCost`, `u64`).
//
// Seedance 2.0 Mini at 480p bills 7.5 credits/sec, so odd durations land on
// FRACTIONAL credits (5s = 37.5, 15s = 112.5), and Seedance 2.0's enterprise
// rates are fractional (37.9 credits/sec at 720p). The remaining whole-credit
// Seedance video models use `KinoviSeedanceGenerationCost` (u64 credits).
//
// Making the shared `u64` credit type fractional would ripple `f64` through
// those whole-credit models AND `artcraft_router` (which stores credits as
// `u64`), forcing hundreds of integer-literal edits. Keeping fractional
// credits in their own small type is the cheaper, better-isolated choice.
// ─────────────────────────────────────────────────────────────────────────────

/// The cost of a fractional-credit Kinovi Seedance generation (Seedance 2.0,
/// Seedance 2.0 Mini), with the video-reference surcharge broken out from the
/// base price.
///
/// Mirrors [`crate::pricing::cost::kinovi_seedance_generation_cost::KinoviSeedanceGenerationCost`],
/// but with FRACTIONAL credits (see the module note above).
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

  /// Build a cost at the historical single-rate enterprise conversion.
  /// Still used by Seedance 2.0 Mini, which hasn't migrated to tiered
  /// pricing yet.
  pub fn from_base_and_surcharge(
    base_credits: f64,
    maybe_video_reference_surcharge_credits: Option<f64>,
  ) -> Self {
    let total_credits = base_credits + maybe_video_reference_surcharge_credits.unwrap_or(0.0);
    Self {
      total_cost: KinoviFractionalGenerationCost::from_kinovi_credits(total_credits),
      base_cost: KinoviFractionalGenerationCost::from_kinovi_credits(base_credits),
      video_reference_surcharge_cost: maybe_video_reference_surcharge_credits
        .map(KinoviFractionalGenerationCost::from_kinovi_credits),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn without_surcharge_total_equals_base() {
    let cost = KinoviSeedanceFractionalGenerationCost::from_base_and_surcharge(37.5, None);
    assert!(cost.video_reference_surcharge_cost.is_none());
    assert_eq!(cost.base_cost.kinovi_credits, 37.5);
    assert_eq!(cost.total_cost, cost.base_cost);
  }

  #[test]
  fn with_surcharge_sums_into_total() {
    // 480p 5s with video ref: 37.5 base + 10 surcharge = 47.5 total.
    let cost = KinoviSeedanceFractionalGenerationCost::from_base_and_surcharge(37.5, Some(10.0));
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

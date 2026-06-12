use crate::cost::kinovi_generation_cost::KinoviGenerationCost;

/// The cost of a Kinovi Seedance generation, with the video-reference
/// surcharge broken out from the base price.
///
/// `total_cost` covers `base_credits_cost + video_reference_surcharge_cost`.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct KinoviSeedanceGenerationCost {
  /// The full cost (base + any surcharge), in credits and USD cents.
  pub total_cost: KinoviGenerationCost,

  /// The base generation cost in Kinovi credits (resolution rate × output
  /// duration × batch count), excluding any surcharges.
  pub base_credits_cost: u64,

  /// The video-reference surcharge in Kinovi credits, when one or more
  /// reference videos are attached. `None` when no reference videos are
  /// attached.
  pub video_reference_surcharge_cost: Option<u64>,
}

impl KinoviSeedanceGenerationCost {
  /// Build a cost from base credits plus an optional video-reference
  /// surcharge. The total (and its USD conversion) is derived.
  pub fn from_base_and_surcharge(
    base_credits_cost: u64,
    video_reference_surcharge_cost: Option<u64>,
  ) -> Self {
    let total_credits = base_credits_cost + video_reference_surcharge_cost.unwrap_or(0);
    Self {
      total_cost: KinoviGenerationCost::from_kinovi_credits(total_credits),
      base_credits_cost,
      video_reference_surcharge_cost,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn without_surcharge() {
    let cost = KinoviSeedanceGenerationCost::from_base_and_surcharge(200, None);
    assert_eq!(cost.base_credits_cost, 200);
    assert_eq!(cost.video_reference_surcharge_cost, None);
    assert_eq!(cost.total_cost.kinovi_credits, 200);
    // 20000/193 = 103.63 -> 104.
    assert_eq!(cost.total_cost.usd_cents_rounded_up, 104);
  }

  #[test]
  fn with_surcharge() {
    let cost = KinoviSeedanceGenerationCost::from_base_and_surcharge(200, Some(40));
    assert_eq!(cost.base_credits_cost, 200);
    assert_eq!(cost.video_reference_surcharge_cost, Some(40));
    assert_eq!(cost.total_cost.kinovi_credits, 240);
    // 24000/193 = 124.35 -> 125.
    assert_eq!(cost.total_cost.usd_cents_rounded_up, 125);
  }

  #[test]
  fn total_is_base_plus_surcharge() {
    let cost = KinoviSeedanceGenerationCost::from_base_and_surcharge(450, Some(90));
    assert_eq!(
      cost.total_cost.kinovi_credits,
      cost.base_credits_cost + cost.video_reference_surcharge_cost.unwrap());
  }
}

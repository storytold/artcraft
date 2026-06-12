use seedance2pro_client::generate::image::generate_midjourney_v7_niji::{
  GenerateMidjourneyV7NijiAspectRatio, GenerateMidjourneyV7NijiRequest, KinoviMidjourneyBatchCount,
};

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::providers::kinovi::midjourney_7_niji::draft::KinoviMidjourney7NijiDraftState;
use crate::generate::generate_image::providers::kinovi::midjourney_7_niji::request::KinoviMidjourney7NijiRequestState;

/// Midjourney v7 Niji (via Kinovi) cost state. Pricing is flat per task
/// regardless of aspect ratio or quality, identical to v7 / v8.
pub struct KinoviMidjourney7NijiCostState {
  pub batch_count: KinoviMidjourneyBatchCount,
}

impl KinoviMidjourney7NijiCostState {
  pub fn from_request(request: &KinoviMidjourney7NijiRequestState) -> Self {
    Self { batch_count: request.request.batch_count }
  }

  pub fn from_draft(draft: &KinoviMidjourney7NijiDraftState) -> Self {
    Self { batch_count: draft.batch_count }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    let pricing_request = GenerateMidjourneyV7NijiRequest {
      batch_count: self.batch_count,
      prompt: String::new(),
      aspect_ratio: GenerateMidjourneyV7NijiAspectRatio::Square1x1,
      negative_prompt: None,
      stylize: None,
      weird: None,
      chaos: None,
      quality: None,
      raw_mode: false,
      reference_image_urls: None,
    };

    let costs = pricing_request.calculate_costs();
    let cost_in_credits = costs.kinovi_credits;
    let cost_in_usd_cents = costs.usd_cents_rounded_up;

    ImageGenerationCostEstimate {
      cost_in_credits: Some(cost_in_credits),
      cost_in_usd_cents: Some(cost_in_usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
      failures_are_refunded: None,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn batch_one_is_twelve_credits_and_five_cents() {
    let cost = KinoviMidjourney7NijiCostState { batch_count: KinoviMidjourneyBatchCount::One }
      .estimate_cost();
    assert_eq!(cost.cost_in_credits, Some(12));
    assert_eq!(cost.cost_in_usd_cents, Some(5)); // 1200/243 = 4.94 -> rounds UP
  }

  #[test]
  fn batch_two_doubles() {
    let cost = KinoviMidjourney7NijiCostState { batch_count: KinoviMidjourneyBatchCount::Two }
      .estimate_cost();
    assert_eq!(cost.cost_in_credits, Some(24));
    assert_eq!(cost.cost_in_usd_cents, Some(10)); // 2400/243 = 9.88 -> rounds UP
  }

  #[test]
  fn batch_four_quadruples() {
    let cost = KinoviMidjourney7NijiCostState { batch_count: KinoviMidjourneyBatchCount::Four }
      .estimate_cost();
    assert_eq!(cost.cost_in_credits, Some(48));
    assert_eq!(cost.cost_in_usd_cents, Some(20));
  }

  #[test]
  fn flags_are_correct() {
    let cost = KinoviMidjourney7NijiCostState { batch_count: KinoviMidjourneyBatchCount::One }
      .estimate_cost();
    assert!(!cost.is_free);
    assert!(!cost.is_unlimited);
    assert!(!cost.is_rate_limited);
    assert!(!cost.has_watermark);
  }
}

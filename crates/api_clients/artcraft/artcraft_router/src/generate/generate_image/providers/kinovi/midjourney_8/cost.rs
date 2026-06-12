use seedance2pro_client::generate::image::generate_midjourney_v8::{
  GenerateMidjourneyV8AspectRatio, GenerateMidjourneyV8Request, KinoviMidjourneyBatchCount,
};

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::providers::kinovi::midjourney_8::draft::KinoviMidjourney8DraftState;
use crate::generate::generate_image::providers::kinovi::midjourney_8::request::KinoviMidjourney8RequestState;

/// Midjourney v8 (via Kinovi) cost state. Pricing is flat per task,
/// identical to v7 / v7 niji.
pub struct KinoviMidjourney8CostState {
  pub batch_count: KinoviMidjourneyBatchCount,
}

impl KinoviMidjourney8CostState {
  pub fn from_request(request: &KinoviMidjourney8RequestState) -> Self {
    Self { batch_count: request.request.batch_count }
  }

  pub fn from_draft(draft: &KinoviMidjourney8DraftState) -> Self {
    Self { batch_count: draft.batch_count }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    let pricing_request = GenerateMidjourneyV8Request {
      batch_count: self.batch_count,
      prompt: String::new(),
      aspect_ratio: GenerateMidjourneyV8AspectRatio::Square1x1,
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
    let cost = KinoviMidjourney8CostState { batch_count: KinoviMidjourneyBatchCount::One }
      .estimate_cost();
    assert_eq!(cost.cost_in_credits, Some(12));
    assert_eq!(cost.cost_in_usd_cents, Some(5)); // 1200/243 = 4.94 -> rounds UP
  }

  #[test]
  fn batch_two_doubles() {
    let cost = KinoviMidjourney8CostState { batch_count: KinoviMidjourneyBatchCount::Two }
      .estimate_cost();
    assert_eq!(cost.cost_in_credits, Some(24));
    assert_eq!(cost.cost_in_usd_cents, Some(10)); // 2400/243 = 9.88 -> rounds UP
  }

  #[test]
  fn batch_four_quadruples() {
    let cost = KinoviMidjourney8CostState { batch_count: KinoviMidjourneyBatchCount::Four }
      .estimate_cost();
    assert_eq!(cost.cost_in_credits, Some(48));
    assert_eq!(cost.cost_in_usd_cents, Some(20));
  }
}

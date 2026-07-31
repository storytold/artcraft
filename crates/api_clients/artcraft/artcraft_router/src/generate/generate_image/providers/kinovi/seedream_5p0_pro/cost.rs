use seedance2pro_web_client::generate::image::generate_seedream_5p0_pro::{
  GenerateSeedream5p0ProRequest, KinoviSeedream5p0ProAspectRatio, KinoviSeedream5p0ProBatchCount,
  KinoviSeedream5p0ProResolution,
};

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::providers::kinovi::seedream_5p0_pro::draft::KinoviSeedream5p0ProDraftState;
use crate::generate::generate_image::providers::kinovi::seedream_5p0_pro::request::KinoviSeedream5p0ProRequestState;

/// Seedream 5.0 Pro (via Kinovi) cost state. Pricing is per image and
/// resolution-dependent (1k vs 2k); batch count multiplies.
pub struct KinoviSeedream5p0ProCostState {
  pub resolution: KinoviSeedream5p0ProResolution,
  pub batch_count: KinoviSeedream5p0ProBatchCount,
}

impl KinoviSeedream5p0ProCostState {
  pub fn from_request(request: &KinoviSeedream5p0ProRequestState) -> Self {
    Self {
      resolution: request.request.resolution,
      batch_count: request.request.batch_count,
    }
  }

  pub fn from_draft(draft: &KinoviSeedream5p0ProDraftState) -> Self {
    Self {
      resolution: draft.resolution,
      batch_count: draft.batch_count,
    }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    let pricing_request = GenerateSeedream5p0ProRequest {
      prompt: String::new(),
      aspect_ratio: KinoviSeedream5p0ProAspectRatio::Auto,
      resolution: self.resolution,
      batch_count: self.batch_count,
      reference_image_urls: None,
    };

    let costs = pricing_request.calculate_costs();

    ImageGenerationCostEstimate {
      cost_in_credits: Some(costs.kinovi_credits),
      cost_in_usd_cents: Some(costs.usd_cents_rounded_up),
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
  fn one_1k_image_is_fourteen_credits_and_six_cents() {
    let cost = KinoviSeedream5p0ProCostState {
      resolution: KinoviSeedream5p0ProResolution::OneK,
      batch_count: KinoviSeedream5p0ProBatchCount::One,
    }.estimate_cost();
    assert_eq!(cost.cost_in_credits, Some(14));
    assert_eq!(cost.cost_in_usd_cents, Some(6)); // 1400/243 = 5.76 -> rounds UP
  }

  #[test]
  fn one_2k_image_is_twentyfour_credits_and_ten_cents() {
    let cost = KinoviSeedream5p0ProCostState {
      resolution: KinoviSeedream5p0ProResolution::TwoK,
      batch_count: KinoviSeedream5p0ProBatchCount::One,
    }.estimate_cost();
    assert_eq!(cost.cost_in_credits, Some(24));
    assert_eq!(cost.cost_in_usd_cents, Some(10)); // 2400/243 = 9.88 -> rounds UP
  }

  /// Mirrors capture 4_seedream_5_misc.txt: 2k, batch of 4 → 96 credits.
  #[test]
  fn four_2k_images_is_ninetysix_credits() {
    let cost = KinoviSeedream5p0ProCostState {
      resolution: KinoviSeedream5p0ProResolution::TwoK,
      batch_count: KinoviSeedream5p0ProBatchCount::Four,
    }.estimate_cost();
    assert_eq!(cost.cost_in_credits, Some(96));
    assert_eq!(cost.cost_in_usd_cents, Some(40)); // 9600/243 = 39.51 -> rounds UP
  }

  /// Mirrors capture 5_seedream_5_misc2.txt: 1k, batch of 8 → 112 credits.
  #[test]
  fn eight_1k_images_is_one_hundred_twelve_credits() {
    let cost = KinoviSeedream5p0ProCostState {
      resolution: KinoviSeedream5p0ProResolution::OneK,
      batch_count: KinoviSeedream5p0ProBatchCount::Eight,
    }.estimate_cost();
    assert_eq!(cost.cost_in_credits, Some(112));
    assert_eq!(cost.cost_in_usd_cents, Some(47)); // 11200/243 = 46.09 -> rounds UP
  }
}

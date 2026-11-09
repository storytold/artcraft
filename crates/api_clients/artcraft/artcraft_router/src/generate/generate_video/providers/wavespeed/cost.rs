use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub fn estimate_cost() -> VideoGenerationCostEstimate {
  VideoGenerationCostEstimate { cost_in_credits: None, cost_in_usd_cents: None, is_free: false, is_unlimited: false, is_rate_limited: false, has_watermark: false, failures_are_refunded: None }
}

#[cfg(test)]
mod tests {
  #[test]
  fn leaves_unverified_video_prices_unknown() {
    let estimate = super::estimate_cost();
    assert!(estimate.cost_in_usd_cents.is_none());
    assert!(!estimate.is_free);
    assert!(!estimate.is_unlimited);
  }
}

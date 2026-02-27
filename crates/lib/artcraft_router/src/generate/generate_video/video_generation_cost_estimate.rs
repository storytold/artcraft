/// The result of estimating the cost of a video generation plan.
pub struct VideoGenerationCostEstimate {
  pub cost_in_credits: Option<u64>,
  pub cost_in_usd_cents: Option<u64>,
  pub is_free: bool,
  pub is_unlimited: bool,
  pub is_rate_limited: bool,
  pub has_watermark: bool,
}

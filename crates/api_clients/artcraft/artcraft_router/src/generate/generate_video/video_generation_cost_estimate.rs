/// The result of estimating the cost of a video generation plan.
#[derive(Clone, Debug)]
pub struct VideoGenerationCostEstimate {
  pub cost_in_credits: Option<u64>,
  pub cost_in_usd_cents: Option<u64>,
  pub is_free: bool,
  pub is_unlimited: bool,
  pub is_rate_limited: bool,
  pub has_watermark: bool,
  
  /// Whether failures are refunded.
  /// True: 100% yes
  /// False: 100% no
  /// None: Unknown or variable
  pub failures_are_refunded: Option<bool>,
}

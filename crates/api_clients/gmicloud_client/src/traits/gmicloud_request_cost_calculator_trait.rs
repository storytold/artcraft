/// Cost in US cents (1¢ = 1 unit).
pub type UsdCents = u64;

/// Implemented on request types to estimate the cost of a GmiCloud API call.
pub trait GmiCloudRequestCostCalculator {
  fn calculate_cost_in_cents(&self) -> UsdCents;
}

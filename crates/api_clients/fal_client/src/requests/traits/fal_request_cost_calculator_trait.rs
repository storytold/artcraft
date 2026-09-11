
/// Cost in pennies.
pub type UsdCents = u64;

pub trait FalRequestCostCalculator {
  
  /// Calculate the cost of the request.
  fn calculate_cost_in_cents(&self) -> UsdCents;
}

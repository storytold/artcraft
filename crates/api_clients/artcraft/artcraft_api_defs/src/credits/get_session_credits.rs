use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GetSessionCreditsResponse {
  pub success: bool,

  /// Any free credits the user might have
  /// We might support daily free credits.
  pub free_credits: u64,

  /// Any monthly refilling credits the user might have
  pub monthly_credits: u64,

  /// Any banked credits the user might have.
  pub banked_credits: u64,

  /// All the credit amounts added together.
  pub sum_total_credits: u64,
}

use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

/// Response body for the omni-gen image cost estimate endpoint.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct OmniGenImageCostResponse {
  pub success: bool,

  /// Estimated cost in credits.
  pub cost_in_credits: Option<u64>,

  /// Estimated cost in USD cents.
  pub cost_in_usd_cents: Option<u64>,

  /// Whether the generation is free for this user/plan.
  pub is_free: bool,

  /// Whether the user has unlimited generations.
  pub is_unlimited: bool,

  /// Whether the user is rate limited.
  pub is_rate_limited: bool,

  /// Whether the output will have a watermark.
  pub has_watermark: bool,
}

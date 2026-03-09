use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use enums::common::generation::common_splat_model::CommonSplatModel;
use enums::common::generation_provider::GenerationProvider;

pub const ESTIMATE_SPLAT_COST_PATH: &str = "/v1/generate/cost_estimate/splat";

/// Request body for the splat cost estimate endpoint.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct EstimateSplatCostRequest {
  /// The splat model to estimate costs for.
  pub model: CommonSplatModel,

  /// The provider to route the generation through.
  pub provider: GenerationProvider,

  /// Whether the request includes a reference image.
  pub has_reference_image: Option<bool>,
}

/// Response body for the splat cost estimate endpoint.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct EstimateSplatCostResponse {
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

/// Error response for the splat cost estimate endpoint.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct EstimateSplatCostError {
  pub success: bool,
  pub error_type: EstimateSplatCostErrorType,
  pub error_message: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum EstimateSplatCostErrorType {
  InvalidProviderForModel,
  InvalidInput,
}

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::providers::midjourney::request::MidjourneyRequestState;

/// Direct Midjourney uses the user's paid subscription; it consumes no ArtCraft credits.
pub struct MidjourneyCostState;

impl MidjourneyCostState {
  pub fn from_request(_request: &MidjourneyRequestState) -> Self {
    Self
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    ImageGenerationCostEstimate { cost_in_credits: Some(0), cost_in_usd_cents: None, is_free: false, is_unlimited: false, is_rate_limited: true, has_watermark: false, failures_are_refunded: None }
  }
}

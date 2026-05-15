use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::gpt_image_2::request::FalGptImage2RequestState;

#[derive(Clone, Debug)]
pub struct FalGptImage2CostState {
  request: FalGptImage2RequestState,
}

impl FalGptImage2CostState {
  pub fn from_request(request: &FalGptImage2RequestState) -> Self {
    Self { request: request.clone() }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    let cost_in_usd_cents = match &self.request {
      FalGptImage2RequestState::TextToImage(req) => req.calculate_cost_in_cents(),
      FalGptImage2RequestState::EditImage(req) => req.calculate_cost_in_cents(),
    };

    ImageGenerationCostEstimate {
      cost_in_credits: None,
      cost_in_usd_cents: Some(cost_in_usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
    }
  }
}

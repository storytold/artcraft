use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::gpt_image_1p5::request::FalGptImage1p5RequestState;

#[derive(Clone, Debug)]
pub struct FalGptImage1p5CostState {
  request: FalGptImage1p5RequestState,
}

impl FalGptImage1p5CostState {
  pub fn from_request(request: &FalGptImage1p5RequestState) -> Self {
    Self { request: request.clone() }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    let cost_in_usd_cents = match &self.request {
      FalGptImage1p5RequestState::TextToImage(req) => req.calculate_cost_in_cents(),
      FalGptImage1p5RequestState::EditImage(req) => req.calculate_cost_in_cents(),
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

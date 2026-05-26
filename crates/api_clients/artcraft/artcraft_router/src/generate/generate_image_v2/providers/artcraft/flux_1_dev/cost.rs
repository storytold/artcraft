use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::artcraft::flux_1_dev::request::ArtcraftFlux1DevRequestState;

/// Cost state for Artcraft Flux 1 Dev. Pricing mirrors v1
/// (`estimate_image_cost_artcraft_flux_1_dev`): flat 2¢ per output image.
#[derive(Clone, Debug)]
pub struct ArtcraftFlux1DevCostState {
  pub num_images: u16,
}

impl ArtcraftFlux1DevCostState {
  pub fn from_request(request: &ArtcraftFlux1DevRequestState) -> Self {
    Self {
      num_images: request.request.image_batch_count.unwrap_or(1),
    }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    // Pricing: $0.02/image. 1 credit = 1 USD cent.
    let cost_in_usd_cents = 2u64 * self.num_images as u64;
    ImageGenerationCostEstimate {
      cost_in_credits: Some(cost_in_usd_cents),
      cost_in_usd_cents: Some(cost_in_usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
      failures_are_refunded: None,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::common_image_model::CommonImageModel;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;

  fn cost_cents(image_batch_count: u16) -> u64 {
    let builder = GenerateImageRequestBuilder {
      model: CommonImageModel::Flux1Dev,
      provider: Provider::Artcraft,
      prompt: None,
      image_inputs: None,
      resolution: None,
      aspect_ratio: None,
      quality: None,
      image_batch_count: Some(image_batch_count),
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
    };
    builder.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn one_image_costs_2_cents() { assert_eq!(cost_cents(1), 2); }

  #[test]
  fn two_images_costs_4_cents() { assert_eq!(cost_cents(2), 4); }

  #[test]
  fn three_images_costs_6_cents() { assert_eq!(cost_cents(3), 6); }

  #[test]
  fn four_images_costs_8_cents() { assert_eq!(cost_cents(4), 8); }
}

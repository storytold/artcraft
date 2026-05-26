use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::artcraft::flux_1_schnell::request::ArtcraftFlux1SchnellRequestState;

/// Cost state for Artcraft Flux 1 Schnell. Pricing mirrors v1
/// (`estimate_image_cost_artcraft_flux_1_schnell`): free, no per-image cost,
/// rate-limited by Artcraft.
#[derive(Clone, Debug)]
pub struct ArtcraftFlux1SchnellCostState;

impl ArtcraftFlux1SchnellCostState {
  pub fn from_request(_request: &ArtcraftFlux1SchnellRequestState) -> Self {
    Self
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    ImageGenerationCostEstimate {
      cost_in_credits: None,
      cost_in_usd_cents: None,
      is_free: true,
      is_unlimited: true,
      is_rate_limited: false,
      has_watermark: false,
      failures_are_refunded: None,
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_image_model::CommonImageModel;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;

  fn build_estimate() -> crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate {
    let builder = GenerateImageRequestBuilder {
      model: CommonImageModel::Flux1Schnell,
      provider: Provider::Artcraft,
      prompt: None,
      image_inputs: None,
      resolution: None,
      aspect_ratio: None,
      quality: None,
      image_batch_count: Some(1),
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
    };
    builder.build2().unwrap().estimate_cost().unwrap()
  }

  #[test]
  fn cost_is_none() {
    let estimate = build_estimate();
    assert!(estimate.cost_in_usd_cents.is_none());
    assert!(estimate.cost_in_credits.is_none());
  }

  #[test]
  fn is_free_is_true() {
    assert!(build_estimate().is_free);
  }

  #[test]
  fn is_unlimited_is_true() {
    assert!(build_estimate().is_unlimited);
  }
}

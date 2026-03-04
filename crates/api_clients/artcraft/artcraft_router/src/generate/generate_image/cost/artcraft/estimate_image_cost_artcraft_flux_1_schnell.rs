use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_flux_1_schnell::PlanArtcraftFlux1Schnell;

pub(crate) fn estimate_image_cost_artcraft_flux_1_schnell(
  _plan: &PlanArtcraftFlux1Schnell<'_>,
) -> ImageGenerationCostEstimate {
  // Pricing: not available
  ImageGenerationCostEstimate {
    cost_in_credits: None,
    cost_in_usd_cents: None,
    is_free: true,
    is_unlimited: true,
    is_rate_limited: false,
    has_watermark: false,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_image_model::CommonImageModel;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request::GenerateImageRequest;

  #[test]
  fn test_estimate_cost_is_none() {
    let request = GenerateImageRequest {
      model: CommonImageModel::Flux1Schnell,
      provider: Provider::Artcraft,
      prompt: None,
      image_inputs: None,
      resolution: None,
      aspect_ratio: None,
      image_batch_count: Some(1),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
    };
    let estimate = request.build()
      .expect("build should succeed")
      .estimate_costs();
    assert!(estimate.cost_in_usd_cents.is_none());
    assert!(estimate.cost_in_credits.is_none());
  }
}

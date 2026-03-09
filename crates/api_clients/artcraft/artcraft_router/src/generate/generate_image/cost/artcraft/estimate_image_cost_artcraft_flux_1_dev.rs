use artcraft_api_defs::generate::image::text::generate_flux_1_dev_text_to_image::GenerateFlux1DevTextToImageNumImages;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_flux_1_dev::PlanArtcraftFlux1Dev;

pub(crate) fn estimate_image_cost_artcraft_flux_1_dev(
  plan: &PlanArtcraftFlux1Dev<'_>,
) -> ImageGenerationCostEstimate {
  // Pricing: $0.02/image (2 cents). 1 credit = 1 USD cent.
  let cost_per_image: u64 = 2;

  let num_images: u64 = match plan.num_images {
    GenerateFlux1DevTextToImageNumImages::One => 1,
    GenerateFlux1DevTextToImageNumImages::Two => 2,
    GenerateFlux1DevTextToImageNumImages::Three => 3,
    GenerateFlux1DevTextToImageNumImages::Four => 4,
  };

  let cost_in_usd_cents = cost_per_image * num_images;

  ImageGenerationCostEstimate {
    cost_in_credits: Some(cost_in_usd_cents),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
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

  fn estimate_usd_cents(image_batch_count: u16) -> u64 {
    let request = GenerateImageRequest {
      model: CommonImageModel::Flux1Dev,
      provider: Provider::Artcraft,
      prompt: None,
      image_inputs: None,
      resolution: None,
      aspect_ratio: None,
      image_batch_count: Some(image_batch_count),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
    };
    request.build()
      .expect("build should succeed")
      .estimate_costs()
      .cost_in_usd_cents
      .expect("cost_in_usd_cents should be present")
  }

  #[test]
  fn test_estimate_cost_usd_cents() {
    // $0.02/image = 2 cents each
    assert_eq!(estimate_usd_cents(1), 2);
    assert_eq!(estimate_usd_cents(2), 4);
    assert_eq!(estimate_usd_cents(3), 6);
    assert_eq!(estimate_usd_cents(4), 8);
  }
}

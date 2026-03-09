use artcraft_api_defs::generate::image::text::generate_flux_pro_11_ultra_text_to_image::GenerateFluxPro11UltraTextToImageNumImages;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_flux_pro_1p1_ultra::PlanArtcraftFluxPro11Ultra;

pub(crate) fn estimate_image_cost_artcraft_flux_pro_1p1_ultra(
  plan: &PlanArtcraftFluxPro11Ultra<'_>,
) -> ImageGenerationCostEstimate {
  // Pricing: $0.06/image (6 cents). 1 credit = 1 USD cent.
  let cost_per_image: u64 = 6;

  let num_images: u64 = match plan.num_images {
    GenerateFluxPro11UltraTextToImageNumImages::One => 1,
    GenerateFluxPro11UltraTextToImageNumImages::Two => 2,
    GenerateFluxPro11UltraTextToImageNumImages::Three => 3,
    GenerateFluxPro11UltraTextToImageNumImages::Four => 4,
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
      model: CommonImageModel::FluxPro11Ultra,
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
    // $0.06/image = 6 cents each
    assert_eq!(estimate_usd_cents(1), 6);
    assert_eq!(estimate_usd_cents(2), 12);
    assert_eq!(estimate_usd_cents(3), 18);
    assert_eq!(estimate_usd_cents(4), 24);
  }
}

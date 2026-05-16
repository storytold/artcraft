use artcraft_api_defs::generate::image::text::generate_flux_pro_11_text_to_image::GenerateFluxPro11TextToImageNumImages;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_flux_pro_1p1::PlanArtcraftFluxPro11;

pub(crate) fn estimate_image_cost_artcraft_flux_pro_1p1(
  plan: &PlanArtcraftFluxPro11,
) -> ImageGenerationCostEstimate {
  // Fal pricing: $0.04 per megapixel, billed by rounding up to the nearest
  // megapixel. The default image_size values are ~1MP, so 4 cents per image.
  // (The legacy `generate_flux_pro_11_text_to_image_handler` charges this same
  // amount via `FluxPro11Args::calculate_cost_in_cents`.)
  let cost_per_image: u64 = 4;

  let num_images: u64 = match plan.num_images {
    GenerateFluxPro11TextToImageNumImages::One => 1,
    GenerateFluxPro11TextToImageNumImages::Two => 2,
    GenerateFluxPro11TextToImageNumImages::Three => 3,
    GenerateFluxPro11TextToImageNumImages::Four => 4,
  };

  let cost_in_usd_cents = cost_per_image * num_images;

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

#[cfg(test)]
mod tests {
  use crate::api::common_image_model::CommonImageModel;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;

  fn estimate_usd_cents(image_batch_count: u16) -> u64 {
    let request = GenerateImageRequestBuilder {
      model: CommonImageModel::FluxPro11,
      provider: Provider::Artcraft,
      prompt: None,
      image_inputs: None,
      resolution: None,
      aspect_ratio: None,
      quality: None,
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
    // $0.04/image = 4 cents each (Fal's $0.04/MP at the default ~1MP).
    assert_eq!(estimate_usd_cents(1), 4);
    assert_eq!(estimate_usd_cents(2), 8);
    assert_eq!(estimate_usd_cents(3), 12);
    assert_eq!(estimate_usd_cents(4), 16);
  }
}

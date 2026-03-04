use artcraft_api_defs::generate::image::multi_function::nano_banana_multi_function_image_gen::NanoBananaMultiFunctionImageGenNumImages;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_nano_banana::PlanArtcraftNanaBanana;

pub(crate) fn estimate_image_cost_artcraft_nano_banana(
  plan: &PlanArtcraftNanaBanana<'_>,
) -> ImageGenerationCostEstimate {
  // Pricing: $0.04/image (4 cents). 1 credit = 1 USD cent.
  let cost_per_image: u64 = 4;

  let num_images: u64 = match plan.num_images {
    NanoBananaMultiFunctionImageGenNumImages::One => 1,
    NanoBananaMultiFunctionImageGenNumImages::Two => 2,
    NanoBananaMultiFunctionImageGenNumImages::Three => 3,
    NanoBananaMultiFunctionImageGenNumImages::Four => 4,
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
      model: CommonImageModel::NanaBanana,
      provider: Provider::Artcraft,
      prompt: None,
      image_inputs: None,
      resolution: None,
      aspect_ratio: None,
      image_batch_count: Some(image_batch_count),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      idempotency_token: None,
    };
    request.build()
      .expect("build should succeed")
      .estimate_costs()
      .cost_in_usd_cents
      .expect("cost_in_usd_cents should be present")
  }

  #[test]
  fn test_estimate_cost_usd_cents() {
    // $0.04/image = 4 cents each
    assert_eq!(estimate_usd_cents(1), 4);
    assert_eq!(estimate_usd_cents(2), 8);
    assert_eq!(estimate_usd_cents(3), 12);
    assert_eq!(estimate_usd_cents(4), 16);
  }
}

use artcraft_api_defs::generate::image::multi_function::bytedance_seedream_v4_multi_function_image_gen::BytedanceSeedreamV4MultiFunctionImageGenNumImages;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_seedream_4::PlanArtcraftSeedream4;

pub(crate) fn estimate_image_cost_artcraft_seedream_4(
  plan: &PlanArtcraftSeedream4<'_>,
) -> ImageGenerationCostEstimate {
  // Pricing: $0.03/image (3 cents). 1 credit = 1 USD cent.
  let cost_per_image: u64 = 3;

  let num_images: u64 = match plan.num_images {
    BytedanceSeedreamV4MultiFunctionImageGenNumImages::One => 1,
    BytedanceSeedreamV4MultiFunctionImageGenNumImages::Two => 2,
    BytedanceSeedreamV4MultiFunctionImageGenNumImages::Three => 3,
    BytedanceSeedreamV4MultiFunctionImageGenNumImages::Four => 4,
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
      model: CommonImageModel::Seedream4,
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
    // $0.03/image = 3 cents each
    assert_eq!(estimate_usd_cents(1), 3);
    assert_eq!(estimate_usd_cents(2), 6);
    assert_eq!(estimate_usd_cents(3), 9);
    assert_eq!(estimate_usd_cents(4), 12);
  }
}

use artcraft_api_defs::generate::image::multi_function::nano_banana_pro_multi_function_image_gen::{
  NanoBananaProMultiFunctionImageGenImageResolution, NanoBananaProMultiFunctionImageGenNumImages,
};

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_nano_banana_pro::PlanArtcraftNanaBananaPro;

pub(crate) fn estimate_image_cost_artcraft_nano_banana_pro(
  plan: &PlanArtcraftNanaBananaPro<'_>,
) -> ImageGenerationCostEstimate {
  // Pricing: $0.15/image at 1K or 2K resolution, $0.30/image at 4K.
  // (Stored as USD cents.)
  let cost_per_image: u64 = match plan.resolution {
    Some(NanoBananaProMultiFunctionImageGenImageResolution::FourK) => 30,
    _ => 15,
  };

  let num_images: u64 = match plan.num_images {
    NanoBananaProMultiFunctionImageGenNumImages::One => 1,
    NanoBananaProMultiFunctionImageGenNumImages::Two => 2,
    NanoBananaProMultiFunctionImageGenNumImages::Three => 3,
    NanoBananaProMultiFunctionImageGenNumImages::Four => 4,
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
  use crate::api::common_resolution::CommonResolution;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request::GenerateImageRequest;

  fn estimate_usd_cents(resolution: Option<CommonResolution>, image_batch_count: u16) -> u64 {
    let request = GenerateImageRequest {
      model: CommonImageModel::NanaBananaPro,
      provider: Provider::Artcraft,
      prompt: None,
      image_inputs: None,
      resolution,
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
    // 1K/2K: $0.15/image = 15 cents
    assert_eq!(estimate_usd_cents(None, 1), 15);
    assert_eq!(estimate_usd_cents(Some(CommonResolution::OneK), 1), 15);
    assert_eq!(estimate_usd_cents(Some(CommonResolution::TwoK), 1), 15);
    assert_eq!(estimate_usd_cents(Some(CommonResolution::OneK), 2), 30);
    assert_eq!(estimate_usd_cents(Some(CommonResolution::OneK), 3), 45);
    assert_eq!(estimate_usd_cents(Some(CommonResolution::OneK), 4), 60);

    // 4K: $0.30/image = 30 cents
    assert_eq!(estimate_usd_cents(Some(CommonResolution::FourK), 1), 30);
    assert_eq!(estimate_usd_cents(Some(CommonResolution::FourK), 2), 60);
    assert_eq!(estimate_usd_cents(Some(CommonResolution::FourK), 4), 120);
  }
}

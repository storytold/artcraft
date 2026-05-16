use artcraft_api_defs::generate::image::multi_function::nano_banana_2_multi_function_image_gen::{
  NanaBanana2MultiFunctionImageGenImageResolution, NanaBanana2MultiFunctionImageGenNumImages,
};

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_nano_banana_2::PlanArtcraftNanaBanana2;

pub(crate) fn estimate_image_cost_artcraft_nano_banana_2(
  plan: &PlanArtcraftNanaBanana2,
) -> ImageGenerationCostEstimate {
  // Pricing (USD cents per image), scaled off the 1K base cost of $0.08:
  //   0.5K → $0.06 (0.75×)
  //   1K   → $0.08 (1×, default)
  //   2K   → $0.12 (1.5×)
  //   4K   → $0.16 (2×)
  let cost_per_image: u64 = match plan.resolution {
    Some(NanaBanana2MultiFunctionImageGenImageResolution::HalfK) => 6,
    Some(NanaBanana2MultiFunctionImageGenImageResolution::OneK) => 8,
    Some(NanaBanana2MultiFunctionImageGenImageResolution::TwoK) => 12,
    Some(NanaBanana2MultiFunctionImageGenImageResolution::FourK) => 16,
    None => 8, // default 1K
  };

  let num_images: u64 = match plan.num_images {
    NanaBanana2MultiFunctionImageGenNumImages::One => 1,
    NanaBanana2MultiFunctionImageGenNumImages::Two => 2,
    NanaBanana2MultiFunctionImageGenNumImages::Three => 3,
    NanaBanana2MultiFunctionImageGenNumImages::Four => 4,
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
  use crate::api::common_resolution::CommonResolution;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;

  fn estimate_usd_cents(resolution: Option<CommonResolution>, image_batch_count: u16) -> u64 {
    let request = GenerateImageRequestBuilder {
      model: CommonImageModel::NanoBanana2,
      provider: Provider::Artcraft,
      prompt: None,
      image_inputs: None,
      resolution,
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

  // ── Default (None → 1K → 8¢/image) ─────────────────────────────────────────

  #[test]
  fn default_resolution_one_image_costs_8_cents() {
    assert_eq!(estimate_usd_cents(None, 1), 8);
  }

  #[test]
  fn default_resolution_two_images_costs_16_cents() {
    assert_eq!(estimate_usd_cents(None, 2), 16);
  }

  #[test]
  fn default_resolution_three_images_costs_24_cents() {
    assert_eq!(estimate_usd_cents(None, 3), 24);
  }

  #[test]
  fn default_resolution_four_images_costs_32_cents() {
    assert_eq!(estimate_usd_cents(None, 4), 32);
  }

  // ── 0.5K → 6¢/image (0.75× base) ───────────────────────────────────────────

  #[test]
  fn half_k_one_image_costs_6_cents() {
    assert_eq!(estimate_usd_cents(Some(CommonResolution::HalfK), 1), 6);
  }

  #[test]
  fn half_k_two_images_costs_12_cents() {
    assert_eq!(estimate_usd_cents(Some(CommonResolution::HalfK), 2), 12);
  }

  #[test]
  fn half_k_three_images_costs_18_cents() {
    assert_eq!(estimate_usd_cents(Some(CommonResolution::HalfK), 3), 18);
  }

  #[test]
  fn half_k_four_images_costs_24_cents() {
    assert_eq!(estimate_usd_cents(Some(CommonResolution::HalfK), 4), 24);
  }

  // ── 1K → 8¢/image (base) ───────────────────────────────────────────────────

  #[test]
  fn one_k_one_image_costs_8_cents() {
    assert_eq!(estimate_usd_cents(Some(CommonResolution::OneK), 1), 8);
  }

  #[test]
  fn one_k_two_images_costs_16_cents() {
    assert_eq!(estimate_usd_cents(Some(CommonResolution::OneK), 2), 16);
  }

  #[test]
  fn one_k_three_images_costs_24_cents() {
    assert_eq!(estimate_usd_cents(Some(CommonResolution::OneK), 3), 24);
  }

  #[test]
  fn one_k_four_images_costs_32_cents() {
    assert_eq!(estimate_usd_cents(Some(CommonResolution::OneK), 4), 32);
  }

  // ── 2K → 12¢/image (1.5× base) ─────────────────────────────────────────────

  #[test]
  fn two_k_one_image_costs_12_cents() {
    assert_eq!(estimate_usd_cents(Some(CommonResolution::TwoK), 1), 12);
  }

  #[test]
  fn two_k_two_images_costs_24_cents() {
    assert_eq!(estimate_usd_cents(Some(CommonResolution::TwoK), 2), 24);
  }

  #[test]
  fn two_k_three_images_costs_36_cents() {
    assert_eq!(estimate_usd_cents(Some(CommonResolution::TwoK), 3), 36);
  }

  #[test]
  fn two_k_four_images_costs_48_cents() {
    assert_eq!(estimate_usd_cents(Some(CommonResolution::TwoK), 4), 48);
  }

  // ── 4K → 16¢/image (2× base) ───────────────────────────────────────────────

  #[test]
  fn four_k_one_image_costs_16_cents() {
    assert_eq!(estimate_usd_cents(Some(CommonResolution::FourK), 1), 16);
  }

  #[test]
  fn four_k_two_images_costs_32_cents() {
    assert_eq!(estimate_usd_cents(Some(CommonResolution::FourK), 2), 32);
  }

  #[test]
  fn four_k_three_images_costs_48_cents() {
    assert_eq!(estimate_usd_cents(Some(CommonResolution::FourK), 3), 48);
  }

  #[test]
  fn four_k_four_images_costs_64_cents() {
    assert_eq!(estimate_usd_cents(Some(CommonResolution::FourK), 4), 64);
  }

  // ── 3K (unsupported) falls back to 2K pricing ──────────────────────────────

  #[test]
  fn three_k_one_image_falls_back_to_two_k_pricing() {
    assert_eq!(estimate_usd_cents(Some(CommonResolution::ThreeK), 1), 12);
  }

  #[test]
  fn three_k_four_images_falls_back_to_two_k_pricing() {
    assert_eq!(estimate_usd_cents(Some(CommonResolution::ThreeK), 4), 48);
  }
}

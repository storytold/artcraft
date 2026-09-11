use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::providers::artcraft::nano_banana_pro::request::ArtcraftNanoBananaProRequestState;

/// Cost state for Artcraft Nano Banana Pro. Pricing mirrors v1
/// (`estimate_image_cost_artcraft_nano_banana_pro`):
///
///   ≤2K (default 1K) → 15¢, 4K → 30¢. 3K falls back to 2K pricing; legacy
///   video resolutions and 0.5K fall back to 1K pricing.
#[derive(Clone, Debug)]
pub struct ArtcraftNanoBananaProCostState {
  pub resolution: Option<CommonResolutionEnum>,
  pub num_images: u16,
}

impl ArtcraftNanoBananaProCostState {
  pub fn from_request(request: &ArtcraftNanoBananaProRequestState) -> Self {
    Self {
      resolution: request.request.resolution,
      num_images: request.request.image_batch_count.unwrap_or(1),
    }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    let cost_per_image: u64 = match self.resolution {
      Some(CommonResolutionEnum::FourK) => 30,
      _ => 15,
    };
    let cost_in_usd_cents = cost_per_image * self.num_images as u64;
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
  use crate::api::router_image_model::RouterImageModel;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_provider::RouterProvider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;

  fn cost_cents(resolution: Option<RouterResolution>, image_batch_count: u16) -> u64 {
    let builder = GenerateImageRequestBuilder {
      model: RouterImageModel::NanoBananaPro,
      provider: RouterProvider::Artcraft,
      prompt: None,
      image_inputs: None,
      resolution,
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

  // ── ≤2K → 15¢/image ────────────────────────────────────────────────────────

  #[test]
  fn default_resolution_one_image_is_15c() { assert_eq!(cost_cents(None, 1), 15); }

  #[test]
  fn one_k_one_image_is_15c() { assert_eq!(cost_cents(Some(RouterResolution::OneK), 1), 15); }

  #[test]
  fn two_k_one_image_is_15c() { assert_eq!(cost_cents(Some(RouterResolution::TwoK), 1), 15); }

  #[test]
  fn one_k_two_images_is_30c() { assert_eq!(cost_cents(Some(RouterResolution::OneK), 2), 30); }

  #[test]
  fn one_k_four_images_is_60c() { assert_eq!(cost_cents(Some(RouterResolution::OneK), 4), 60); }

  // ── 4K → 30¢/image ────────────────────────────────────────────────────────

  #[test]
  fn four_k_one_image_is_30c() { assert_eq!(cost_cents(Some(RouterResolution::FourK), 1), 30); }

  #[test]
  fn four_k_two_images_is_60c() { assert_eq!(cost_cents(Some(RouterResolution::FourK), 2), 60); }

  #[test]
  fn four_k_four_images_is_120c() { assert_eq!(cost_cents(Some(RouterResolution::FourK), 4), 120); }

  // ── 3K and legacy resolutions fall back to 15¢ ─────────────────────────────

  #[test]
  fn three_k_falls_back_to_15c() { assert_eq!(cost_cents(Some(RouterResolution::ThreeK), 1), 15); }

  #[test]
  fn half_k_falls_back_to_15c() { assert_eq!(cost_cents(Some(RouterResolution::HalfK), 1), 15); }

  #[test]
  fn ten_eighty_p_falls_back_to_15c() { assert_eq!(cost_cents(Some(RouterResolution::TenEightyP), 1), 15); }
}

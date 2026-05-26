use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::artcraft::nano_banana_2::request::ArtcraftNanoBanana2RequestState;

/// Cost state for Artcraft Nano Banana 2. Pricing mirrors v1
/// (`estimate_image_cost_artcraft_nano_banana_2`):
///
///   0.5K → 6¢, 1K (default) → 8¢, 2K → 12¢, 4K → 16¢. 3K falls back to 2K
///   pricing; legacy video resolutions (480p/720p/1080p) fall back to 1K.
#[derive(Clone, Debug)]
pub struct ArtcraftNanoBanana2CostState {
  pub resolution: Option<CommonResolutionEnum>,
  pub num_images: u16,
}

impl ArtcraftNanoBanana2CostState {
  pub fn from_request(request: &ArtcraftNanoBanana2RequestState) -> Self {
    Self {
      resolution: request.request.resolution,
      num_images: request.request.image_batch_count.unwrap_or(1),
    }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    let cost_per_image: u64 = cost_per_image_in_cents(self.resolution);
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

fn cost_per_image_in_cents(resolution: Option<CommonResolutionEnum>) -> u64 {
  use CommonResolutionEnum as R;
  match resolution {
    Some(R::HalfK) => 6,
    None
    | Some(R::OneK)
    | Some(R::FourEightyP)
    | Some(R::SevenTwentyP)
    | Some(R::TenEightyP) => 8,
    Some(R::TwoK) | Some(R::ThreeK) => 12,
    Some(R::FourK) => 16,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_image_model::CommonImageModel;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;

  fn cost_cents(resolution: Option<CommonResolution>, image_batch_count: u16) -> u64 {
    let builder = GenerateImageRequestBuilder {
      model: CommonImageModel::NanoBanana2,
      provider: Provider::Artcraft,
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

  // ── Default / 1K (8¢) ──────────────────────────────────────────────────────

  #[test]
  fn default_resolution_one_image_is_8c() { assert_eq!(cost_cents(None, 1), 8); }

  #[test]
  fn default_resolution_four_images_is_32c() { assert_eq!(cost_cents(None, 4), 32); }

  #[test]
  fn one_k_one_image_is_8c() { assert_eq!(cost_cents(Some(CommonResolution::OneK), 1), 8); }

  // ── 0.5K (6¢) ──────────────────────────────────────────────────────────────

  #[test]
  fn half_k_one_image_is_6c() { assert_eq!(cost_cents(Some(CommonResolution::HalfK), 1), 6); }

  #[test]
  fn half_k_four_images_is_24c() { assert_eq!(cost_cents(Some(CommonResolution::HalfK), 4), 24); }

  // ── 2K (12¢) ───────────────────────────────────────────────────────────────

  #[test]
  fn two_k_one_image_is_12c() { assert_eq!(cost_cents(Some(CommonResolution::TwoK), 1), 12); }

  #[test]
  fn two_k_four_images_is_48c() { assert_eq!(cost_cents(Some(CommonResolution::TwoK), 4), 48); }

  // ── 3K falls back to 2K pricing ────────────────────────────────────────────

  #[test]
  fn three_k_one_image_falls_back_to_two_k_pricing() {
    assert_eq!(cost_cents(Some(CommonResolution::ThreeK), 1), 12);
  }

  // ── 4K (16¢) ───────────────────────────────────────────────────────────────

  #[test]
  fn four_k_one_image_is_16c() { assert_eq!(cost_cents(Some(CommonResolution::FourK), 1), 16); }

  #[test]
  fn four_k_four_images_is_64c() { assert_eq!(cost_cents(Some(CommonResolution::FourK), 4), 64); }
}

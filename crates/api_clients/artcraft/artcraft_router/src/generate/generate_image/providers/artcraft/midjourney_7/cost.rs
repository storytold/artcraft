use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::providers::artcraft::midjourney_7::request::ArtcraftMidjourney7RequestState;

/// Cost state for Artcraft Midjourney 7. Pricing mirrors the Kinovi
/// midjourney_7 provider 1:1 in USD cents — ArtCraft credits map cent-for-cent.
///
/// | batch | credits | USD cents |
/// |-------|---------|-----------|
/// |   1   |    6    |    6¢     |
/// |   2   |   12    |   12¢     |
/// |   3   |   19    |   19¢     |  (interpolated; Kinovi doesn't expose 3)
/// |   4   |   25    |   25¢     |
///
/// Kinovi-side math (historical, 22,000-credit package at 193 credits/$1):
/// 12 Kinovi credits per Midjourney task → batches 1/2/4 land on 6/12/25¢;
/// batch 3 is `ceil((12 × 3 / 193) × 100) = 19`. Under the current
/// 525,000-credit package (243 credits/$1) Kinovi costs only 5/10/20¢ —
/// user pricing is intentionally kept at the 193-derived values.
#[derive(Clone, Debug)]
pub struct ArtcraftMidjourney7CostState {
  pub num_images: u16,
}

impl ArtcraftMidjourney7CostState {
  pub fn from_request(request: &ArtcraftMidjourney7RequestState) -> Self {
    Self {
      num_images: request.request.image_batch_count.unwrap_or(1),
    }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    let cost_in_usd_cents = midjourney_cost_for_batch(self.num_images);
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

/// Returns the customer-facing midjourney cost in USD cents for a given
/// batch count. Shared between v7, v7-niji, and v8 (all three Midjourney
/// models have identical pricing on Kinovi).
pub(crate) fn midjourney_cost_for_batch(batch_count: u16) -> u64 {
  match batch_count {
    0 => 0, // Defensive; the builder rejects zero before reaching cost.
    1 => 6,
    2 => 12,
    3 => 19,
    4 => 25,
    // Should never happen — `plan_batch_count` clamps to 1..=4.
    _ => 25,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::router_image_model::RouterImageModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;

  fn cost_cents(image_batch_count: u16) -> u64 {
    let builder = GenerateImageRequestBuilder {
      model: RouterImageModel::Midjourney7,
      provider: RouterProvider::Artcraft,
      prompt: Some("a corgi astronaut".to_string()),
      image_inputs: None,
      resolution: None,
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

  fn cost_credits(image_batch_count: u16) -> u64 {
    let builder = GenerateImageRequestBuilder {
      model: RouterImageModel::Midjourney7,
      provider: RouterProvider::Artcraft,
      prompt: Some("a corgi astronaut".to_string()),
      image_inputs: None,
      resolution: None,
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
    builder.build2().unwrap().estimate_cost().unwrap().cost_in_credits.unwrap()
  }

  // ── Spot checks: each supported batch size ──

  #[test]
  fn one_image_is_six_cents() { assert_eq!(cost_cents(1), 6); }

  #[test]
  fn two_images_is_twelve_cents() { assert_eq!(cost_cents(2), 12); }

  #[test]
  fn three_images_is_nineteen_cents() { assert_eq!(cost_cents(3), 19); }

  #[test]
  fn four_images_is_twentyfive_cents() { assert_eq!(cost_cents(4), 25); }

  // ── Credits track USD cents exactly (1 credit = 1 cent) ──

  #[test]
  fn credits_equal_usd_cents() {
    for batch in 1..=4u16 {
      assert_eq!(cost_credits(batch), cost_cents(batch),
        "credits should equal usd cents at batch {}", batch);
    }
  }

  // ── Monotonicity ──

  #[test]
  fn cost_is_monotonically_increasing() {
    let c1 = cost_cents(1);
    let c2 = cost_cents(2);
    let c3 = cost_cents(3);
    let c4 = cost_cents(4);
    assert!(c1 < c2, "{} < {}", c1, c2);
    assert!(c2 < c3, "{} < {}", c2, c3);
    assert!(c3 < c4, "{} < {}", c3, c4);
  }

  // ── Flags ──

  #[test]
  fn cost_flags_are_correct() {
    let cost = ArtcraftMidjourney7CostState { num_images: 1 }.estimate_cost();
    assert!(!cost.is_free);
    assert!(!cost.is_unlimited);
    assert!(!cost.is_rate_limited);
    assert!(!cost.has_watermark);
    assert_eq!(cost.failures_are_refunded, None);
  }
}

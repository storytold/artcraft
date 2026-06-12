use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::providers::artcraft::midjourney_7::cost::midjourney_cost_for_batch;
use crate::generate::generate_image::providers::artcraft::midjourney_8::request::ArtcraftMidjourney8RequestState;

/// Cost state for Artcraft Midjourney 8. Pricing is identical to v7 and
/// v7-niji on Kinovi; shares the per-batch table via
/// `midjourney_cost_for_batch`.
#[derive(Clone, Debug)]
pub struct ArtcraftMidjourney8CostState {
  pub num_images: u16,
}

impl ArtcraftMidjourney8CostState {
  pub fn from_request(request: &ArtcraftMidjourney8RequestState) -> Self {
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

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::router_image_model::RouterImageModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;

  fn cost_cents(image_batch_count: u16) -> u64 {
    let builder = GenerateImageRequestBuilder {
      model: RouterImageModel::Midjourney8,
      provider: RouterProvider::Artcraft,
      prompt: Some("a haunted mansion".to_string()),
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

  #[test]
  fn batch_1_is_6() { assert_eq!(cost_cents(1), 6); }

  #[test]
  fn batch_2_is_12() { assert_eq!(cost_cents(2), 12); }

  #[test]
  fn batch_3_is_19() { assert_eq!(cost_cents(3), 19); }

  #[test]
  fn batch_4_is_25() { assert_eq!(cost_cents(4), 25); }

  #[test]
  fn v8_pricing_matches_v7() {
    use crate::generate::generate_image::providers::artcraft::midjourney_7::cost::ArtcraftMidjourney7CostState;
    for batch in 1..=4u16 {
      let v7 = ArtcraftMidjourney7CostState { num_images: batch }.estimate_cost();
      let v8 = ArtcraftMidjourney8CostState { num_images: batch }.estimate_cost();
      assert_eq!(v7.cost_in_usd_cents, v8.cost_in_usd_cents, "batch {}", batch);
      assert_eq!(v7.cost_in_credits, v8.cost_in_credits, "batch {}", batch);
    }
  }

}

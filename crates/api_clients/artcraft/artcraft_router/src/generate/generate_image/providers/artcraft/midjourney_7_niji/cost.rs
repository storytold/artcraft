use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::providers::artcraft::midjourney_7::cost::midjourney_cost_for_batch;
use crate::generate::generate_image::providers::artcraft::midjourney_7_niji::request::ArtcraftMidjourney7NijiRequestState;

/// Cost state for Artcraft Midjourney 7 Niji. Pricing is identical to v7
/// and v8 on Kinovi, so we share the per-batch table via
/// `midjourney_cost_for_batch`.
#[derive(Clone, Debug)]
pub struct ArtcraftMidjourney7NijiCostState {
  pub num_images: u16,
}

impl ArtcraftMidjourney7NijiCostState {
  pub fn from_request(request: &ArtcraftMidjourney7NijiRequestState) -> Self {
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
      model: RouterImageModel::Midjourney7Niji,
      provider: RouterProvider::Artcraft,
      prompt: Some("anime forest".to_string()),
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
  fn niji_pricing_matches_v7() {
    use crate::generate::generate_image::providers::artcraft::midjourney_7::cost::ArtcraftMidjourney7CostState;
    for batch in 1..=4u16 {
      let v7 = ArtcraftMidjourney7CostState { num_images: batch }.estimate_cost();
      let niji = ArtcraftMidjourney7NijiCostState { num_images: batch }.estimate_cost();
      assert_eq!(v7.cost_in_usd_cents, niji.cost_in_usd_cents, "batch {}", batch);
      assert_eq!(v7.cost_in_credits, niji.cost_in_credits, "batch {}", batch);
    }
  }

}

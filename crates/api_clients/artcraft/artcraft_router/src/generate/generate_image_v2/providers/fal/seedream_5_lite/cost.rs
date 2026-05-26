use fal_client::requests::webhook::image::edit::enqueue_bytedance_seedream_v5_lite_edit_image_webhook::EnqueueBytedanceSeedreamV5LiteEditImageNumImages;
use fal_client::requests::webhook::image::text::enqueue_bytedance_seedream_v5_lite_text_to_image_webhook::EnqueueBytedanceSeedreamV5LiteTextToImageNumImages;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::seedream_5_lite::request::FalSeedream5LiteRequestState;

pub struct FalSeedream5LiteCostState {
  num_images: u64,
}

impl FalSeedream5LiteCostState {
  pub fn from_request(request: &FalSeedream5LiteRequestState) -> Self {
    let num_images = match request {
      FalSeedream5LiteRequestState::TextToImage(req) => match req.num_images {
        Some(EnqueueBytedanceSeedreamV5LiteTextToImageNumImages::One) => 1,
        Some(EnqueueBytedanceSeedreamV5LiteTextToImageNumImages::Two) => 2,
        Some(EnqueueBytedanceSeedreamV5LiteTextToImageNumImages::Three) => 3,
        Some(EnqueueBytedanceSeedreamV5LiteTextToImageNumImages::Four) => 4,
        None => 1,
      },
      FalSeedream5LiteRequestState::EditImage(req) => match req.num_images {
        Some(EnqueueBytedanceSeedreamV5LiteEditImageNumImages::One) => 1,
        Some(EnqueueBytedanceSeedreamV5LiteEditImageNumImages::Two) => 2,
        Some(EnqueueBytedanceSeedreamV5LiteEditImageNumImages::Three) => 3,
        Some(EnqueueBytedanceSeedreamV5LiteEditImageNumImages::Four) => 4,
        None => 1,
      },
    };
    Self { num_images }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    // Pricing: $0.035 per image — rounded up to 4 cents. Matches v1.
    const COST_PER_IMAGE: u64 = 4;
    let cost_in_usd_cents = COST_PER_IMAGE * self.num_images;

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
  use fal_client::requests::webhook::image::edit::enqueue_bytedance_seedream_v5_lite_edit_image_webhook::EnqueueBytedanceSeedreamV5LiteEditImageRequest;
  use fal_client::requests::webhook::image::text::enqueue_bytedance_seedream_v5_lite_text_to_image_webhook::EnqueueBytedanceSeedreamV5LiteTextToImageRequest;

  fn t2i_cost(n: EnqueueBytedanceSeedreamV5LiteTextToImageNumImages) -> ImageGenerationCostEstimate {
    FalSeedream5LiteCostState::from_request(&FalSeedream5LiteRequestState::TextToImage(
      EnqueueBytedanceSeedreamV5LiteTextToImageRequest {
        prompt: "test".to_string(),
        num_images: Some(n),
        max_images: None,
        image_size: None,
      },
    )).estimate_cost()
  }

  fn edit_cost(n: EnqueueBytedanceSeedreamV5LiteEditImageNumImages) -> ImageGenerationCostEstimate {
    FalSeedream5LiteCostState::from_request(&FalSeedream5LiteRequestState::EditImage(
      EnqueueBytedanceSeedreamV5LiteEditImageRequest {
        prompt: "test".to_string(),
        image_urls: vec!["https://example.com/x.jpg".to_string()],
        num_images: Some(n),
        max_images: None,
        image_size: None,
      },
    )).estimate_cost()
  }

  #[test]
  fn t2i_one_image_is_4_cents() {
    assert_eq!(t2i_cost(EnqueueBytedanceSeedreamV5LiteTextToImageNumImages::One).cost_in_usd_cents, Some(4));
  }

  #[test]
  fn t2i_two_images_is_8_cents() {
    assert_eq!(t2i_cost(EnqueueBytedanceSeedreamV5LiteTextToImageNumImages::Two).cost_in_usd_cents, Some(8));
  }

  #[test]
  fn t2i_four_images_is_16_cents() {
    assert_eq!(t2i_cost(EnqueueBytedanceSeedreamV5LiteTextToImageNumImages::Four).cost_in_usd_cents, Some(16));
  }

  #[test]
  fn edit_two_images_matches_t2i_two_images() {
    assert_eq!(
      edit_cost(EnqueueBytedanceSeedreamV5LiteEditImageNumImages::Two).cost_in_usd_cents,
      t2i_cost(EnqueueBytedanceSeedreamV5LiteTextToImageNumImages::Two).cost_in_usd_cents,
    );
  }

  #[test]
  fn credits_equal_cents() {
    let c = t2i_cost(EnqueueBytedanceSeedreamV5LiteTextToImageNumImages::Two);
    assert_eq!(c.cost_in_credits, c.cost_in_usd_cents);
  }
}

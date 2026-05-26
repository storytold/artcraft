use fal_client::requests::webhook::image::edit::enqueue_bytedance_seedream_v4_edit_image_webhook::EnqueueBytedanceSeedreamV4EditImageNumImages;
use fal_client::requests::webhook::image::text::enqueue_bytedance_seedream_v4_text_to_image_webhook::EnqueueBytedanceSeedreamV4TextToImageNumImages;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::seedream_4::request::FalSeedream4RequestState;

pub struct FalSeedream4CostState {
  num_images: u64,
}

impl FalSeedream4CostState {
  pub fn from_request(request: &FalSeedream4RequestState) -> Self {
    let num_images = match request {
      FalSeedream4RequestState::TextToImage(req) => match req.num_images {
        Some(EnqueueBytedanceSeedreamV4TextToImageNumImages::One) => 1,
        Some(EnqueueBytedanceSeedreamV4TextToImageNumImages::Two) => 2,
        Some(EnqueueBytedanceSeedreamV4TextToImageNumImages::Three) => 3,
        Some(EnqueueBytedanceSeedreamV4TextToImageNumImages::Four) => 4,
        None => 1, // default
      },
      FalSeedream4RequestState::EditImage(req) => match req.num_images {
        Some(EnqueueBytedanceSeedreamV4EditImageNumImages::One) => 1,
        Some(EnqueueBytedanceSeedreamV4EditImageNumImages::Two) => 2,
        Some(EnqueueBytedanceSeedreamV4EditImageNumImages::Three) => 3,
        Some(EnqueueBytedanceSeedreamV4EditImageNumImages::Four) => 4,
        None => 1,
      },
    };
    Self { num_images }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    // Pricing: $0.03 per image. Matches v1.
    const COST_PER_IMAGE: u64 = 3;
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
  use fal_client::requests::webhook::image::edit::enqueue_bytedance_seedream_v4_edit_image_webhook::EnqueueBytedanceSeedreamV4EditImageRequest;
  use fal_client::requests::webhook::image::text::enqueue_bytedance_seedream_v4_text_to_image_webhook::EnqueueBytedanceSeedreamV4TextToImageRequest;

  fn t2i_cost(n: EnqueueBytedanceSeedreamV4TextToImageNumImages) -> ImageGenerationCostEstimate {
    FalSeedream4CostState::from_request(&FalSeedream4RequestState::TextToImage(
      EnqueueBytedanceSeedreamV4TextToImageRequest {
        prompt: "test".to_string(),
        num_images: Some(n),
        max_images: None,
        image_size: None,
      },
    )).estimate_cost()
  }

  fn edit_cost(n: EnqueueBytedanceSeedreamV4EditImageNumImages) -> ImageGenerationCostEstimate {
    FalSeedream4CostState::from_request(&FalSeedream4RequestState::EditImage(
      EnqueueBytedanceSeedreamV4EditImageRequest {
        prompt: "test".to_string(),
        image_urls: vec!["https://example.com/x.jpg".to_string()],
        num_images: Some(n),
        max_images: None,
        image_size: None,
      },
    )).estimate_cost()
  }

  #[test]
  fn t2i_one_image_is_3_cents() {
    assert_eq!(t2i_cost(EnqueueBytedanceSeedreamV4TextToImageNumImages::One).cost_in_usd_cents, Some(3));
  }

  #[test]
  fn t2i_two_images_is_6_cents() {
    assert_eq!(t2i_cost(EnqueueBytedanceSeedreamV4TextToImageNumImages::Two).cost_in_usd_cents, Some(6));
  }

  #[test]
  fn t2i_three_images_is_9_cents() {
    assert_eq!(t2i_cost(EnqueueBytedanceSeedreamV4TextToImageNumImages::Three).cost_in_usd_cents, Some(9));
  }

  #[test]
  fn t2i_four_images_is_12_cents() {
    assert_eq!(t2i_cost(EnqueueBytedanceSeedreamV4TextToImageNumImages::Four).cost_in_usd_cents, Some(12));
  }

  #[test]
  fn t2i_none_num_images_defaults_to_one() {
    let cost = FalSeedream4CostState::from_request(&FalSeedream4RequestState::TextToImage(
      EnqueueBytedanceSeedreamV4TextToImageRequest {
        prompt: "test".to_string(),
        num_images: None,
        max_images: None,
        image_size: None,
      },
    )).estimate_cost();
    assert_eq!(cost.cost_in_usd_cents, Some(3));
  }

  #[test]
  fn edit_two_images_matches_t2i_two_images() {
    assert_eq!(
      edit_cost(EnqueueBytedanceSeedreamV4EditImageNumImages::Two).cost_in_usd_cents,
      t2i_cost(EnqueueBytedanceSeedreamV4TextToImageNumImages::Two).cost_in_usd_cents,
    );
  }

  #[test]
  fn credits_equal_cents() {
    let c = t2i_cost(EnqueueBytedanceSeedreamV4TextToImageNumImages::Two);
    assert_eq!(c.cost_in_credits, c.cost_in_usd_cents);
  }
}

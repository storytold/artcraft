use fal_client::requests::webhook::image::edit::enqueue_bytedance_seedream_v4p5_edit_image_webhook::EnqueueBytedanceSeedreamV4p5EditImageNumImages;
use fal_client::requests::webhook::image::text::enqueue_bytedance_seedream_v4p5_text_to_image_webhook::EnqueueBytedanceSeedreamV4p5TextToImageNumImages;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::seedream_4p5::request::FalSeedream4p5RequestState;

pub struct FalSeedream4p5CostState {
  num_images: u64,
}

impl FalSeedream4p5CostState {
  pub fn from_request(request: &FalSeedream4p5RequestState) -> Self {
    let num_images = match request {
      FalSeedream4p5RequestState::TextToImage(req) => match req.num_images {
        Some(EnqueueBytedanceSeedreamV4p5TextToImageNumImages::One) => 1,
        Some(EnqueueBytedanceSeedreamV4p5TextToImageNumImages::Two) => 2,
        Some(EnqueueBytedanceSeedreamV4p5TextToImageNumImages::Three) => 3,
        Some(EnqueueBytedanceSeedreamV4p5TextToImageNumImages::Four) => 4,
        None => 1,
      },
      FalSeedream4p5RequestState::EditImage(req) => match req.num_images {
        Some(EnqueueBytedanceSeedreamV4p5EditImageNumImages::One) => 1,
        Some(EnqueueBytedanceSeedreamV4p5EditImageNumImages::Two) => 2,
        Some(EnqueueBytedanceSeedreamV4p5EditImageNumImages::Three) => 3,
        Some(EnqueueBytedanceSeedreamV4p5EditImageNumImages::Four) => 4,
        None => 1,
      },
    };
    Self { num_images }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    // Pricing: $0.04 per image. Matches v1.
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
  use fal_client::requests::webhook::image::edit::enqueue_bytedance_seedream_v4p5_edit_image_webhook::EnqueueBytedanceSeedreamV4p5EditImageRequest;
  use fal_client::requests::webhook::image::text::enqueue_bytedance_seedream_v4p5_text_to_image_webhook::EnqueueBytedanceSeedreamV4p5TextToImageRequest;

  fn t2i_cost(n: EnqueueBytedanceSeedreamV4p5TextToImageNumImages) -> ImageGenerationCostEstimate {
    FalSeedream4p5CostState::from_request(&FalSeedream4p5RequestState::TextToImage(
      EnqueueBytedanceSeedreamV4p5TextToImageRequest {
        prompt: "test".to_string(),
        num_images: Some(n),
        max_images: None,
        image_size: None,
      },
    )).estimate_cost()
  }

  fn edit_cost(n: EnqueueBytedanceSeedreamV4p5EditImageNumImages) -> ImageGenerationCostEstimate {
    FalSeedream4p5CostState::from_request(&FalSeedream4p5RequestState::EditImage(
      EnqueueBytedanceSeedreamV4p5EditImageRequest {
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
    assert_eq!(t2i_cost(EnqueueBytedanceSeedreamV4p5TextToImageNumImages::One).cost_in_usd_cents, Some(4));
  }

  #[test]
  fn t2i_two_images_is_8_cents() {
    assert_eq!(t2i_cost(EnqueueBytedanceSeedreamV4p5TextToImageNumImages::Two).cost_in_usd_cents, Some(8));
  }

  #[test]
  fn t2i_four_images_is_16_cents() {
    assert_eq!(t2i_cost(EnqueueBytedanceSeedreamV4p5TextToImageNumImages::Four).cost_in_usd_cents, Some(16));
  }

  #[test]
  fn edit_two_images_matches_t2i_two_images() {
    assert_eq!(
      edit_cost(EnqueueBytedanceSeedreamV4p5EditImageNumImages::Two).cost_in_usd_cents,
      t2i_cost(EnqueueBytedanceSeedreamV4p5TextToImageNumImages::Two).cost_in_usd_cents,
    );
  }

  #[test]
  fn credits_equal_cents() {
    let c = t2i_cost(EnqueueBytedanceSeedreamV4p5TextToImageNumImages::Two);
    assert_eq!(c.cost_in_credits, c.cost_in_usd_cents);
  }
}

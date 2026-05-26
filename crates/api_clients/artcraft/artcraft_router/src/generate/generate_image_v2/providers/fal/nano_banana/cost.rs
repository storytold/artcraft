use fal_client::requests::webhook::image::edit::enqueue_gemini_25_flash_edit_webhook::Gemini25FlashEditNumImages;
use fal_client::requests::webhook::image::text::enqueue_gemini_25_flash_text_to_image_webhook::Gemini25FlashTextToImageNumImages;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::nano_banana::request::FalNanoBananaRequestState;

pub struct FalNanoBananaCostState {
  num_images: u64,
}

impl FalNanoBananaCostState {
  pub fn from_request(request: &FalNanoBananaRequestState) -> Self {
    let num_images = match request {
      FalNanoBananaRequestState::TextToImage(req) => match req.num_images {
        Gemini25FlashTextToImageNumImages::One => 1,
        Gemini25FlashTextToImageNumImages::Two => 2,
        Gemini25FlashTextToImageNumImages::Three => 3,
        Gemini25FlashTextToImageNumImages::Four => 4,
      },
      FalNanoBananaRequestState::EditImage(req) => match req.num_images {
        Gemini25FlashEditNumImages::One => 1,
        Gemini25FlashEditNumImages::Two => 2,
        Gemini25FlashEditNumImages::Three => 3,
        Gemini25FlashEditNumImages::Four => 4,
      },
    };
    Self { num_images }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    // Pricing: $0.039/image — rounded up to 4 cents (no resolution multiplier,
    // Gemini 2.5 Flash has no resolution option). Matches v1.
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
  use fal_client::requests::webhook::image::edit::enqueue_gemini_25_flash_edit_webhook::Gemini25FlashEditRequest;
  use fal_client::requests::webhook::image::text::enqueue_gemini_25_flash_text_to_image_webhook::Gemini25FlashTextToImageRequest;

  fn t2i_cost(n: Gemini25FlashTextToImageNumImages) -> ImageGenerationCostEstimate {
    FalNanoBananaCostState::from_request(&FalNanoBananaRequestState::TextToImage(
      Gemini25FlashTextToImageRequest {
        prompt: "test".to_string(),
        num_images: n,
        aspect_ratio: None,
      },
    )).estimate_cost()
  }

  fn edit_cost(n: Gemini25FlashEditNumImages) -> ImageGenerationCostEstimate {
    FalNanoBananaCostState::from_request(&FalNanoBananaRequestState::EditImage(
      Gemini25FlashEditRequest {
        prompt: "test".to_string(),
        image_urls: vec!["https://example.com/x.jpg".to_string()],
        num_images: n,
        aspect_ratio: None,
      },
    )).estimate_cost()
  }

  #[test]
  fn t2i_one_image_is_4_cents() {
    assert_eq!(t2i_cost(Gemini25FlashTextToImageNumImages::One).cost_in_usd_cents, Some(4));
  }

  #[test]
  fn t2i_two_images_is_8_cents() {
    assert_eq!(t2i_cost(Gemini25FlashTextToImageNumImages::Two).cost_in_usd_cents, Some(8));
  }

  #[test]
  fn t2i_three_images_is_12_cents() {
    assert_eq!(t2i_cost(Gemini25FlashTextToImageNumImages::Three).cost_in_usd_cents, Some(12));
  }

  #[test]
  fn t2i_four_images_is_16_cents() {
    assert_eq!(t2i_cost(Gemini25FlashTextToImageNumImages::Four).cost_in_usd_cents, Some(16));
  }

  #[test]
  fn edit_two_images_matches_t2i_two_images() {
    assert_eq!(
      edit_cost(Gemini25FlashEditNumImages::Two).cost_in_usd_cents,
      t2i_cost(Gemini25FlashTextToImageNumImages::Two).cost_in_usd_cents,
    );
  }

  #[test]
  fn credits_equal_cents() {
    let c = t2i_cost(Gemini25FlashTextToImageNumImages::Two);
    assert_eq!(c.cost_in_credits, c.cost_in_usd_cents);
  }

  #[test]
  fn cost_flags_match_v1() {
    let c = t2i_cost(Gemini25FlashTextToImageNumImages::One);
    assert!(!c.is_free);
    assert!(!c.is_unlimited);
    assert!(!c.is_rate_limited);
    assert!(!c.has_watermark);
    assert!(c.failures_are_refunded.is_none());
  }
}

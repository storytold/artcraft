use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::nano_banana_2::request::FalNanoBanana2RequestState;

pub struct FalNanoBanana2CostState {
  cost_in_usd_cents: u64,
}

impl FalNanoBanana2CostState {
  pub fn from_request(request: &FalNanoBanana2RequestState) -> Self {
    let cost_in_usd_cents = match request {
      FalNanoBanana2RequestState::TextToImage(req) => req.calculate_cost_in_cents(),
      FalNanoBanana2RequestState::EditImage(req) => req.calculate_cost_in_cents(),
    };
    Self { cost_in_usd_cents }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    ImageGenerationCostEstimate {
      cost_in_credits: None,
      cost_in_usd_cents: Some(self.cost_in_usd_cents),
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
  use fal_client::requests::api::image::edit::nano_banana_2_edit_image::api::{
    NanoBanana2EditImageNumImages, NanoBanana2EditImageRequest,
    NanoBanana2EditImageResolution,
  };
  use fal_client::requests::api::image::text::nano_banana_2_text_to_image::api::{
    NanoBanana2TextToImageNumImages, NanoBanana2TextToImageRequest,
    NanoBanana2TextToImageResolution,
  };

  mod text_to_image_costs {
    use super::*;

    fn make_t2i(
      num_images: NanoBanana2TextToImageNumImages,
      resolution: Option<NanoBanana2TextToImageResolution>,
    ) -> FalNanoBanana2RequestState {
      FalNanoBanana2RequestState::TextToImage(NanoBanana2TextToImageRequest {
        prompt: "test".to_string(),
        num_images,
        resolution,
        aspect_ratio: None,
      })
    }

    #[test]
    fn one_image_default_resolution() {
      let state = FalNanoBanana2CostState::from_request(
        &make_t2i(NanoBanana2TextToImageNumImages::One, None),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(15));
    }

    #[test]
    fn one_image_half_k() {
      let state = FalNanoBanana2CostState::from_request(
        &make_t2i(NanoBanana2TextToImageNumImages::One, Some(NanoBanana2TextToImageResolution::HalfK)),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(8));
    }

    #[test]
    fn four_images_one_k() {
      let state = FalNanoBanana2CostState::from_request(
        &make_t2i(NanoBanana2TextToImageNumImages::Four, Some(NanoBanana2TextToImageResolution::OneK)),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(60));
    }

    #[test]
    fn one_image_four_k() {
      let state = FalNanoBanana2CostState::from_request(
        &make_t2i(NanoBanana2TextToImageNumImages::One, Some(NanoBanana2TextToImageResolution::FourK)),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(30));
    }

    #[test]
    fn two_images_four_k() {
      let state = FalNanoBanana2CostState::from_request(
        &make_t2i(NanoBanana2TextToImageNumImages::Two, Some(NanoBanana2TextToImageResolution::FourK)),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(60));
    }
  }

  mod edit_image_costs {
    use super::*;

    fn make_edit(
      num_images: NanoBanana2EditImageNumImages,
      resolution: Option<NanoBanana2EditImageResolution>,
    ) -> FalNanoBanana2RequestState {
      FalNanoBanana2RequestState::EditImage(NanoBanana2EditImageRequest {
        prompt: "test".to_string(),
        image_urls: vec!["https://example.com/image.jpg".to_string()],
        num_images,
        resolution,
        aspect_ratio: None,
      })
    }

    #[test]
    fn one_image_default_resolution() {
      let state = FalNanoBanana2CostState::from_request(
        &make_edit(NanoBanana2EditImageNumImages::One, None),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(15));
    }

    #[test]
    fn one_image_half_k() {
      let state = FalNanoBanana2CostState::from_request(
        &make_edit(NanoBanana2EditImageNumImages::One, Some(NanoBanana2EditImageResolution::HalfK)),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(8));
    }

    #[test]
    fn three_images_two_k() {
      let state = FalNanoBanana2CostState::from_request(
        &make_edit(NanoBanana2EditImageNumImages::Three, Some(NanoBanana2EditImageResolution::TwoK)),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(45));
    }

    #[test]
    fn one_image_four_k() {
      let state = FalNanoBanana2CostState::from_request(
        &make_edit(NanoBanana2EditImageNumImages::One, Some(NanoBanana2EditImageResolution::FourK)),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(30));
    }
  }

  #[test]
  fn cost_flags_are_correct() {
    let state = FalNanoBanana2CostState::from_request(
      &FalNanoBanana2RequestState::TextToImage(NanoBanana2TextToImageRequest {
        prompt: "test".to_string(),
        num_images: NanoBanana2TextToImageNumImages::One,
        resolution: None,
        aspect_ratio: None,
      }),
    );
    let cost = state.estimate_cost();
    assert!(!cost.is_free);
    assert!(!cost.is_unlimited);
    assert!(!cost.is_rate_limited);
    assert!(!cost.has_watermark);
    assert!(cost.cost_in_credits.is_none());
  }
}

use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::nano_banana_pro::request::FalNanoBananaProRequestState;

pub struct FalNanoBananaProCostState {
  cost_in_usd_cents: u64,
}

impl FalNanoBananaProCostState {
  pub fn from_request(request: &FalNanoBananaProRequestState) -> Self {
    let cost_in_usd_cents = match request {
      FalNanoBananaProRequestState::TextToImage(req) => req.calculate_cost_in_cents(),
      FalNanoBananaProRequestState::EditImage(req) => req.calculate_cost_in_cents(),
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
  use fal_client::requests::api::image::edit::nano_banana_pro_edit_image::api::{
    NanoBananaProEditImageNumImages, NanoBananaProEditImageRequest,
    NanoBananaProEditImageResolution,
  };
  use fal_client::requests::api::image::text::nano_banana_pro_text_to_image::api::{
    NanoBananaProTextToImageNumImages, NanoBananaProTextToImageRequest,
    NanoBananaProTextToImageResolution,
  };

  mod text_to_image_costs {
    use super::*;

    fn make_t2i(
      num_images: NanoBananaProTextToImageNumImages,
      resolution: Option<NanoBananaProTextToImageResolution>,
    ) -> FalNanoBananaProRequestState {
      FalNanoBananaProRequestState::TextToImage(NanoBananaProTextToImageRequest {
        prompt: "test".to_string(),
        num_images,
        resolution,
        aspect_ratio: None,
      })
    }

    #[test]
    fn one_image_default_resolution() {
      let state = FalNanoBananaProCostState::from_request(
        &make_t2i(NanoBananaProTextToImageNumImages::One, None),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(15));
    }

    #[test]
    fn four_images_one_k() {
      let state = FalNanoBananaProCostState::from_request(
        &make_t2i(NanoBananaProTextToImageNumImages::Four, Some(NanoBananaProTextToImageResolution::OneK)),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(60));
    }

    #[test]
    fn one_image_four_k() {
      let state = FalNanoBananaProCostState::from_request(
        &make_t2i(NanoBananaProTextToImageNumImages::One, Some(NanoBananaProTextToImageResolution::FourK)),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(30));
    }

    #[test]
    fn two_images_four_k() {
      let state = FalNanoBananaProCostState::from_request(
        &make_t2i(NanoBananaProTextToImageNumImages::Two, Some(NanoBananaProTextToImageResolution::FourK)),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(60));
    }
  }

  mod edit_image_costs {
    use super::*;

    fn make_edit(
      num_images: NanoBananaProEditImageNumImages,
      resolution: Option<NanoBananaProEditImageResolution>,
    ) -> FalNanoBananaProRequestState {
      FalNanoBananaProRequestState::EditImage(NanoBananaProEditImageRequest {
        prompt: "test".to_string(),
        image_urls: vec!["https://example.com/img.jpg".to_string()],
        num_images,
        resolution,
        aspect_ratio: None,
      })
    }

    #[test]
    fn one_image_default_resolution() {
      let state = FalNanoBananaProCostState::from_request(
        &make_edit(NanoBananaProEditImageNumImages::One, None),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(15));
    }

    #[test]
    fn three_images_two_k() {
      let state = FalNanoBananaProCostState::from_request(
        &make_edit(NanoBananaProEditImageNumImages::Three, Some(NanoBananaProEditImageResolution::TwoK)),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(45));
    }

    #[test]
    fn one_image_four_k() {
      let state = FalNanoBananaProCostState::from_request(
        &make_edit(NanoBananaProEditImageNumImages::One, Some(NanoBananaProEditImageResolution::FourK)),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(30));
    }
  }

  #[test]
  fn cost_flags_are_correct() {
    let state = FalNanoBananaProCostState::from_request(
      &FalNanoBananaProRequestState::TextToImage(NanoBananaProTextToImageRequest {
        prompt: "test".to_string(),
        num_images: NanoBananaProTextToImageNumImages::One,
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

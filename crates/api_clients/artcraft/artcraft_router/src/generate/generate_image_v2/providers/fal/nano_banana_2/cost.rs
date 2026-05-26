use fal_client::requests::api::image::edit::nano_banana_2_edit_image::api::{
  NanoBanana2EditImageNumImages, NanoBanana2EditImageResolution,
};
use fal_client::requests::api::image::text::nano_banana_2_text_to_image::api::{
  NanoBanana2TextToImageNumImages, NanoBanana2TextToImageResolution,
};

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::nano_banana_2::request::FalNanoBanana2RequestState;

/// Cost state for Fal Nano Banana 2. Mirrors v1
/// (`estimate_image_cost_fal_nano_banana_2`):
///
///   $0.08/image base (1K). Multipliers: 0.5K = 0.75x, 2K = 1.5x, 4K = 2x.
///     0.5K → 6¢, 1K → 8¢ (also default), 2K → 12¢, 4K → 16¢
///
/// The hand-rolled rates here intentionally override fal_client's trait,
/// whose rates are placeholder values from a `TODO(bt): Verify pricing` block
/// (8/15/15/30 instead of v1's 6/8/12/16). Keep this in sync with the v1
/// cost file.
pub struct FalNanoBanana2CostState {
  cost_in_usd_cents: u64,
}

impl FalNanoBanana2CostState {
  pub fn from_request(request: &FalNanoBanana2RequestState) -> Self {
    let (cost_per_image, num_images) = match request {
      FalNanoBanana2RequestState::TextToImage(req) => {
        (cost_per_image_for_t2i_resolution(req.resolution), t2i_num_images(req.num_images))
      }
      FalNanoBanana2RequestState::EditImage(req) => {
        (cost_per_image_for_edit_resolution(req.resolution), edit_num_images(req.num_images))
      }
    };
    Self { cost_in_usd_cents: cost_per_image * num_images }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    ImageGenerationCostEstimate {
      // v1 sets cost_in_credits to the same value as USD cents (1:1).
      cost_in_credits: Some(self.cost_in_usd_cents),
      cost_in_usd_cents: Some(self.cost_in_usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
      failures_are_refunded: None,
    }
  }
}

fn cost_per_image_for_t2i_resolution(r: Option<NanoBanana2TextToImageResolution>) -> u64 {
  match r {
    Some(NanoBanana2TextToImageResolution::HalfK) => 6,
    Some(NanoBanana2TextToImageResolution::OneK) | None => 8,
    Some(NanoBanana2TextToImageResolution::TwoK) => 12,
    Some(NanoBanana2TextToImageResolution::FourK) => 16,
  }
}

fn cost_per_image_for_edit_resolution(r: Option<NanoBanana2EditImageResolution>) -> u64 {
  match r {
    Some(NanoBanana2EditImageResolution::HalfK) => 6,
    Some(NanoBanana2EditImageResolution::OneK) | None => 8,
    Some(NanoBanana2EditImageResolution::TwoK) => 12,
    Some(NanoBanana2EditImageResolution::FourK) => 16,
  }
}

fn t2i_num_images(n: NanoBanana2TextToImageNumImages) -> u64 {
  match n {
    NanoBanana2TextToImageNumImages::One => 1,
    NanoBanana2TextToImageNumImages::Two => 2,
    NanoBanana2TextToImageNumImages::Three => 3,
    NanoBanana2TextToImageNumImages::Four => 4,
  }
}

fn edit_num_images(n: NanoBanana2EditImageNumImages) -> u64 {
  match n {
    NanoBanana2EditImageNumImages::One => 1,
    NanoBanana2EditImageNumImages::Two => 2,
    NanoBanana2EditImageNumImages::Three => 3,
    NanoBanana2EditImageNumImages::Four => 4,
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
      // None defaults to 1K = 8¢ per v1's rate table.
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(8));
    }

    #[test]
    fn one_image_half_k() {
      let state = FalNanoBanana2CostState::from_request(
        &make_t2i(NanoBanana2TextToImageNumImages::One, Some(NanoBanana2TextToImageResolution::HalfK)),
      );
      // HalfK = 0.75x base = 6¢ per v1's rate table.
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(6));
    }

    #[test]
    fn four_images_one_k() {
      let state = FalNanoBanana2CostState::from_request(
        &make_t2i(NanoBanana2TextToImageNumImages::Four, Some(NanoBanana2TextToImageResolution::OneK)),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(32));
    }

    #[test]
    fn one_image_four_k() {
      let state = FalNanoBanana2CostState::from_request(
        &make_t2i(NanoBanana2TextToImageNumImages::One, Some(NanoBanana2TextToImageResolution::FourK)),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(16));
    }

    #[test]
    fn two_images_four_k() {
      let state = FalNanoBanana2CostState::from_request(
        &make_t2i(NanoBanana2TextToImageNumImages::Two, Some(NanoBanana2TextToImageResolution::FourK)),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(32));
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
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(8));
    }

    #[test]
    fn one_image_half_k() {
      let state = FalNanoBanana2CostState::from_request(
        &make_edit(NanoBanana2EditImageNumImages::One, Some(NanoBanana2EditImageResolution::HalfK)),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(6));
    }

    #[test]
    fn three_images_two_k() {
      let state = FalNanoBanana2CostState::from_request(
        &make_edit(NanoBanana2EditImageNumImages::Three, Some(NanoBanana2EditImageResolution::TwoK)),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(36));
    }

    #[test]
    fn one_image_four_k() {
      let state = FalNanoBanana2CostState::from_request(
        &make_edit(NanoBanana2EditImageNumImages::One, Some(NanoBanana2EditImageResolution::FourK)),
      );
      assert_eq!(state.estimate_cost().cost_in_usd_cents, Some(16));
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
    assert_eq!(cost.cost_in_credits, cost.cost_in_usd_cents);
  }
}

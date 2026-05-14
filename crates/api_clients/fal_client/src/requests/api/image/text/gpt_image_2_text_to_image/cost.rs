use crate::requests::api::image::text::gpt_image_2_text_to_image::api::{
  GptImage2TextToImageNumImages, GptImage2TextToImageQuality,
  GptImage2TextToImageRequest, GptImage2TextToImageSize,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for GptImage2TextToImageRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Cost table (per image) by approximate pixel dimensions:
    //
    // landscape_4_3 (~1024x768):  low=$0.01, medium=$0.04, high=$0.15
    // square        (~1024x1024): low=$0.01, medium=$0.06, high=$0.22
    // portrait_4_3  (~768x1024):  low=$0.01, medium=$0.04, high=$0.15
    // landscape_16_9(~1920x1080): low=$0.01, medium=$0.04, high=$0.16
    // portrait_16_9 (~1080x1920): low=$0.01, medium=$0.04, high=$0.16
    // square_hd     (~2048x2048): low=$0.01, medium=$0.06, high=$0.23
    // auto          (varies):     estimated as square
    let use_quality = self.quality.unwrap_or(GptImage2TextToImageQuality::High);
    let use_size = self.image_size.unwrap_or(GptImage2TextToImageSize::Square);

    use GptImage2TextToImageQuality::*;
    use GptImage2TextToImageSize::*;

    let base_cost = match (use_quality, use_size) {
      (Low, _) => 1,
      (Medium, Landscape4x3 | Portrait4x3 | Landscape16x9 | Portrait16x9) => 4,
      (Medium, Square) => 6,
      (Medium, SquareHd) => 6,
      (High, Landscape4x3 | Portrait4x3) => 15,
      (High, Landscape16x9 | Portrait16x9) => 16,
      (High, Square) => 22,
      (High, SquareHd) => 23,
    };

    let cost = match self.num_images {
      GptImage2TextToImageNumImages::One => base_cost,
      GptImage2TextToImageNumImages::Two => base_cost * 2,
      GptImage2TextToImageNumImages::Three => base_cost * 3,
      GptImage2TextToImageNumImages::Four => base_cost * 4,
    };
    cost as UsdCents
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(
    num_images: GptImage2TextToImageNumImages,
    quality: Option<GptImage2TextToImageQuality>,
    image_size: Option<GptImage2TextToImageSize>,
  ) -> GptImage2TextToImageRequest {
    GptImage2TextToImageRequest {
      prompt: "test".to_string(),
      num_images,
      image_size,
      quality,
      output_format: None,
    }
  }

  mod default_tests {
    use super::*;

    #[test]
    fn cost_defaults_one_image() {
      // Default quality=High, size=Square => 22 cents
      assert_eq!(
        make_request(GptImage2TextToImageNumImages::One, None, None)
          .calculate_cost_in_cents(), 22);
    }

    #[test]
    fn cost_defaults_four_images() {
      assert_eq!(
        make_request(GptImage2TextToImageNumImages::Four, None, None)
          .calculate_cost_in_cents(), 88);
    }
  }

  mod low_quality_tests {
    use super::*;

    #[test]
    fn cost_low_any_size_one_image() {
      // Low quality is always 1 cent per image regardless of size
      assert_eq!(
        make_request(GptImage2TextToImageNumImages::One, Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::SquareHd))
          .calculate_cost_in_cents(), 1);
    }

    #[test]
    fn cost_low_any_size_four_images() {
      assert_eq!(
        make_request(GptImage2TextToImageNumImages::Four, Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::Square))
          .calculate_cost_in_cents(), 4);
    }
  }

  mod medium_quality_tests {
    use super::*;

    #[test]
    fn cost_medium_landscape_4x3() {
      assert_eq!(
        make_request(GptImage2TextToImageNumImages::One, Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::Landscape4x3))
          .calculate_cost_in_cents(), 4);
    }

    #[test]
    fn cost_medium_square() {
      assert_eq!(
        make_request(GptImage2TextToImageNumImages::One, Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::Square))
          .calculate_cost_in_cents(), 6);
    }

    #[test]
    fn cost_medium_square_hd() {
      assert_eq!(
        make_request(GptImage2TextToImageNumImages::One, Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::SquareHd))
          .calculate_cost_in_cents(), 6);
    }

    #[test]
    fn cost_medium_portrait_16x9_two_images() {
      assert_eq!(
        make_request(GptImage2TextToImageNumImages::Two, Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::Portrait16x9))
          .calculate_cost_in_cents(), 8);
    }
  }

  mod high_quality_tests {
    use super::*;

    #[test]
    fn cost_high_landscape_4x3() {
      assert_eq!(
        make_request(GptImage2TextToImageNumImages::One, Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::Landscape4x3))
          .calculate_cost_in_cents(), 15);
    }

    #[test]
    fn cost_high_portrait_4x3() {
      assert_eq!(
        make_request(GptImage2TextToImageNumImages::One, Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::Portrait4x3))
          .calculate_cost_in_cents(), 15);
    }

    #[test]
    fn cost_high_landscape_16x9() {
      assert_eq!(
        make_request(GptImage2TextToImageNumImages::One, Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::Landscape16x9))
          .calculate_cost_in_cents(), 16);
    }

    #[test]
    fn cost_high_portrait_16x9() {
      assert_eq!(
        make_request(GptImage2TextToImageNumImages::One, Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::Portrait16x9))
          .calculate_cost_in_cents(), 16);
    }

    #[test]
    fn cost_high_square() {
      assert_eq!(
        make_request(GptImage2TextToImageNumImages::One, Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::Square))
          .calculate_cost_in_cents(), 22);
    }

    #[test]
    fn cost_high_square_hd() {
      assert_eq!(
        make_request(GptImage2TextToImageNumImages::One, Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::SquareHd))
          .calculate_cost_in_cents(), 23);
    }

    #[test]
    fn cost_high_square_hd_three_images() {
      assert_eq!(
        make_request(GptImage2TextToImageNumImages::Three, Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::SquareHd))
          .calculate_cost_in_cents(), 69);
    }
  }
}

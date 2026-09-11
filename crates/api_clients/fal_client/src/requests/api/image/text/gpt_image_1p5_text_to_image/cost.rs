use crate::requests::api::image::text::gpt_image_1p5_text_to_image::api::{
  GptImage1p5TextToImageNumImages, GptImage1p5TextToImageQuality,
  GptImage1p5TextToImageRequest, GptImage1p5TextToImageSize,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for GptImage1p5TextToImageRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Per fal docs (fal-ai/gpt-image-1.5):
    //   Low:    $0.009 (1024x1024) / $0.013 (other) per image
    //   Medium: $0.034 (1024x1024) / $0.050-$0.051 (other) per image
    //   High:   $0.133 (1024x1024) / $0.199-$0.200 (other) per image
    let use_quality = self.quality.unwrap_or(GptImage1p5TextToImageQuality::Medium);
    let use_size = self.image_size.unwrap_or(GptImage1p5TextToImageSize::Square);

    let base_cost = match (use_quality, use_size) {
      (GptImage1p5TextToImageQuality::Low, GptImage1p5TextToImageSize::Square) => 1,
      (GptImage1p5TextToImageQuality::Low, _) => 1,
      (GptImage1p5TextToImageQuality::Medium, GptImage1p5TextToImageSize::Square) => 3,
      (GptImage1p5TextToImageQuality::Medium, _) => 5,
      (GptImage1p5TextToImageQuality::High, GptImage1p5TextToImageSize::Square) => 13,
      (GptImage1p5TextToImageQuality::High, _) => 20,
    };

    let cost = match self.num_images {
      GptImage1p5TextToImageNumImages::One => base_cost,
      GptImage1p5TextToImageNumImages::Two => base_cost * 2,
      GptImage1p5TextToImageNumImages::Three => base_cost * 3,
      GptImage1p5TextToImageNumImages::Four => base_cost * 4,
    };
    cost as UsdCents
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(
    num_images: GptImage1p5TextToImageNumImages,
    quality: Option<GptImage1p5TextToImageQuality>,
    image_size: Option<GptImage1p5TextToImageSize>,
  ) -> GptImage1p5TextToImageRequest {
    GptImage1p5TextToImageRequest {
      prompt: "test".to_string(),
      num_images,
      image_size,
      background: None,
      quality,
      output_format: None,
    }
  }

  mod default_tests {
    use super::*;

    #[test]
    fn cost_defaults_one_image() {
      // Default quality=Medium, size=Square => 3 cents
      assert_eq!(
        make_request(GptImage1p5TextToImageNumImages::One, None, None)
          .calculate_cost_in_cents(), 3);
    }

    #[test]
    fn cost_defaults_four_images() {
      assert_eq!(
        make_request(GptImage1p5TextToImageNumImages::Four, None, None)
          .calculate_cost_in_cents(), 12);
    }
  }

  mod low_quality_tests {
    use super::*;

    #[test]
    fn cost_low_square_one_image() {
      assert_eq!(
        make_request(GptImage1p5TextToImageNumImages::One, Some(GptImage1p5TextToImageQuality::Low), Some(GptImage1p5TextToImageSize::Square))
          .calculate_cost_in_cents(), 1);
    }

    #[test]
    fn cost_low_wide_one_image() {
      assert_eq!(
        make_request(GptImage1p5TextToImageNumImages::One, Some(GptImage1p5TextToImageQuality::Low), Some(GptImage1p5TextToImageSize::Wide))
          .calculate_cost_in_cents(), 1);
    }

    #[test]
    fn cost_low_tall_four_images() {
      assert_eq!(
        make_request(GptImage1p5TextToImageNumImages::Four, Some(GptImage1p5TextToImageQuality::Low), Some(GptImage1p5TextToImageSize::Tall))
          .calculate_cost_in_cents(), 4);
    }
  }

  mod medium_quality_tests {
    use super::*;

    #[test]
    fn cost_medium_square_one_image() {
      assert_eq!(
        make_request(GptImage1p5TextToImageNumImages::One, Some(GptImage1p5TextToImageQuality::Medium), Some(GptImage1p5TextToImageSize::Square))
          .calculate_cost_in_cents(), 3);
    }

    #[test]
    fn cost_medium_wide_one_image() {
      assert_eq!(
        make_request(GptImage1p5TextToImageNumImages::One, Some(GptImage1p5TextToImageQuality::Medium), Some(GptImage1p5TextToImageSize::Wide))
          .calculate_cost_in_cents(), 5);
    }

    #[test]
    fn cost_medium_tall_one_image() {
      assert_eq!(
        make_request(GptImage1p5TextToImageNumImages::One, Some(GptImage1p5TextToImageQuality::Medium), Some(GptImage1p5TextToImageSize::Tall))
          .calculate_cost_in_cents(), 5);
    }

    #[test]
    fn cost_medium_square_three_images() {
      assert_eq!(
        make_request(GptImage1p5TextToImageNumImages::Three, Some(GptImage1p5TextToImageQuality::Medium), Some(GptImage1p5TextToImageSize::Square))
          .calculate_cost_in_cents(), 9);
    }
  }

  mod high_quality_tests {
    use super::*;

    #[test]
    fn cost_high_square_one_image() {
      assert_eq!(
        make_request(GptImage1p5TextToImageNumImages::One, Some(GptImage1p5TextToImageQuality::High), Some(GptImage1p5TextToImageSize::Square))
          .calculate_cost_in_cents(), 13);
    }

    #[test]
    fn cost_high_wide_one_image() {
      assert_eq!(
        make_request(GptImage1p5TextToImageNumImages::One, Some(GptImage1p5TextToImageQuality::High), Some(GptImage1p5TextToImageSize::Wide))
          .calculate_cost_in_cents(), 20);
    }

    #[test]
    fn cost_high_tall_one_image() {
      assert_eq!(
        make_request(GptImage1p5TextToImageNumImages::One, Some(GptImage1p5TextToImageQuality::High), Some(GptImage1p5TextToImageSize::Tall))
          .calculate_cost_in_cents(), 20);
    }

    #[test]
    fn cost_high_square_two_images() {
      assert_eq!(
        make_request(GptImage1p5TextToImageNumImages::Two, Some(GptImage1p5TextToImageQuality::High), Some(GptImage1p5TextToImageSize::Square))
          .calculate_cost_in_cents(), 26);
    }

    #[test]
    fn cost_high_wide_four_images() {
      assert_eq!(
        make_request(GptImage1p5TextToImageNumImages::Four, Some(GptImage1p5TextToImageQuality::High), Some(GptImage1p5TextToImageSize::Wide))
          .calculate_cost_in_cents(), 80);
    }
  }
}

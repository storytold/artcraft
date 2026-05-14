use crate::requests::api::image::text::gpt_image_1_text_to_image::api::{
  GptImage1TextToImageNumImages, GptImage1TextToImageQuality,
  GptImage1TextToImageRequest, GptImage1TextToImageSize,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for GptImage1TextToImageRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Per fal docs (fal-ai/gpt-image-1/text-to-image):
    //   Low:    $0.011 (1024x1024) / $0.016 (other) per image
    //   Medium: $0.042 (1024x1024) / $0.063 (other) per image
    //   High:   $0.167 (1024x1024) / $0.25  (other) per image
    // Default quality is Medium when unspecified, square when size unspecified.
    let use_quality = self.quality.unwrap_or(GptImage1TextToImageQuality::Medium);
    let is_square = matches!(
      self.image_size,
      None | Some(GptImage1TextToImageSize::Square) | Some(GptImage1TextToImageSize::Auto)
    );

    let base_cost: u64 = match (use_quality, is_square) {
      (GptImage1TextToImageQuality::Low, true) => 2,
      (GptImage1TextToImageQuality::Low, false) => 2,
      (GptImage1TextToImageQuality::Medium, true) => 5,
      (GptImage1TextToImageQuality::Medium, false) => 7,
      (GptImage1TextToImageQuality::High, true) => 17,
      (GptImage1TextToImageQuality::High, false) => 25,
    };

    let n: u64 = match self.num_images {
      GptImage1TextToImageNumImages::One => 1,
      GptImage1TextToImageNumImages::Two => 2,
      GptImage1TextToImageNumImages::Three => 3,
      GptImage1TextToImageNumImages::Four => 4,
    };
    base_cost * n
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(
    num_images: GptImage1TextToImageNumImages,
    quality: Option<GptImage1TextToImageQuality>,
    image_size: Option<GptImage1TextToImageSize>,
  ) -> GptImage1TextToImageRequest {
    GptImage1TextToImageRequest {
      prompt: "test".to_string(),
      num_images,
      image_size,
      quality,
      background: None,
      output_format: None,
    }
  }

  mod default_tests {
    use super::*;

    #[test]
    fn cost_defaults_one_image() {
      // Default quality=Medium, size=Square => 5 cents
      assert_eq!(
        make_request(GptImage1TextToImageNumImages::One, None, None)
          .calculate_cost_in_cents(), 5);
    }

    #[test]
    fn cost_defaults_four_images() {
      assert_eq!(
        make_request(GptImage1TextToImageNumImages::Four, None, None)
          .calculate_cost_in_cents(), 20);
    }
  }

  mod low_quality_tests {
    use super::*;

    #[test]
    fn cost_low_square_one_image() {
      assert_eq!(
        make_request(GptImage1TextToImageNumImages::One, Some(GptImage1TextToImageQuality::Low), Some(GptImage1TextToImageSize::Square))
          .calculate_cost_in_cents(), 2);
    }

    #[test]
    fn cost_low_horizontal_one_image() {
      assert_eq!(
        make_request(GptImage1TextToImageNumImages::One, Some(GptImage1TextToImageQuality::Low), Some(GptImage1TextToImageSize::Horizontal))
          .calculate_cost_in_cents(), 2);
    }

    #[test]
    fn cost_low_auto_four_images() {
      assert_eq!(
        make_request(GptImage1TextToImageNumImages::Four, Some(GptImage1TextToImageQuality::Low), Some(GptImage1TextToImageSize::Auto))
          .calculate_cost_in_cents(), 8);
    }
  }

  mod medium_quality_tests {
    use super::*;

    #[test]
    fn cost_medium_square_one_image() {
      assert_eq!(
        make_request(GptImage1TextToImageNumImages::One, Some(GptImage1TextToImageQuality::Medium), Some(GptImage1TextToImageSize::Square))
          .calculate_cost_in_cents(), 5);
    }

    #[test]
    fn cost_medium_auto_one_image() {
      assert_eq!(
        make_request(GptImage1TextToImageNumImages::One, Some(GptImage1TextToImageQuality::Medium), Some(GptImage1TextToImageSize::Auto))
          .calculate_cost_in_cents(), 5);
    }

    #[test]
    fn cost_medium_horizontal_one_image() {
      assert_eq!(
        make_request(GptImage1TextToImageNumImages::One, Some(GptImage1TextToImageQuality::Medium), Some(GptImage1TextToImageSize::Horizontal))
          .calculate_cost_in_cents(), 7);
    }

    #[test]
    fn cost_medium_vertical_one_image() {
      assert_eq!(
        make_request(GptImage1TextToImageNumImages::One, Some(GptImage1TextToImageQuality::Medium), Some(GptImage1TextToImageSize::Vertical))
          .calculate_cost_in_cents(), 7);
    }

    #[test]
    fn cost_medium_horizontal_three_images() {
      assert_eq!(
        make_request(GptImage1TextToImageNumImages::Three, Some(GptImage1TextToImageQuality::Medium), Some(GptImage1TextToImageSize::Horizontal))
          .calculate_cost_in_cents(), 21);
    }
  }

  mod high_quality_tests {
    use super::*;

    #[test]
    fn cost_high_square_one_image() {
      assert_eq!(
        make_request(GptImage1TextToImageNumImages::One, Some(GptImage1TextToImageQuality::High), Some(GptImage1TextToImageSize::Square))
          .calculate_cost_in_cents(), 17);
    }

    #[test]
    fn cost_high_horizontal_one_image() {
      assert_eq!(
        make_request(GptImage1TextToImageNumImages::One, Some(GptImage1TextToImageQuality::High), Some(GptImage1TextToImageSize::Horizontal))
          .calculate_cost_in_cents(), 25);
    }

    #[test]
    fn cost_high_vertical_one_image() {
      assert_eq!(
        make_request(GptImage1TextToImageNumImages::One, Some(GptImage1TextToImageQuality::High), Some(GptImage1TextToImageSize::Vertical))
          .calculate_cost_in_cents(), 25);
    }

    #[test]
    fn cost_high_square_two_images() {
      assert_eq!(
        make_request(GptImage1TextToImageNumImages::Two, Some(GptImage1TextToImageQuality::High), Some(GptImage1TextToImageSize::Square))
          .calculate_cost_in_cents(), 34);
    }

    #[test]
    fn cost_high_vertical_four_images() {
      assert_eq!(
        make_request(GptImage1TextToImageNumImages::Four, Some(GptImage1TextToImageQuality::High), Some(GptImage1TextToImageSize::Vertical))
          .calculate_cost_in_cents(), 100);
    }
  }
}

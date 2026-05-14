use crate::requests::api::image::edit::gpt_image_1_edit_image::api::{
  GptImage1EditImageNumImages, GptImage1EditImageQuality,
  GptImage1EditImageRequest, GptImage1EditImageSize,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for GptImage1EditImageRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Per fal docs (fal-ai/gpt-image-1/edit-image):
    //   Low:    $0.011 (1024x1024) / $0.016 (other) per image
    //   Medium: $0.042 (1024x1024) / $0.063 (other) per image
    //   High:   $0.167 (1024x1024) / $0.25  (other) per image
    let use_quality = self.quality.unwrap_or(GptImage1EditImageQuality::Medium);
    let is_square = matches!(
      self.image_size,
      None | Some(GptImage1EditImageSize::Square) | Some(GptImage1EditImageSize::Auto)
    );

    let base_cost: u64 = match (use_quality, is_square) {
      (GptImage1EditImageQuality::Low, true) => 2,
      (GptImage1EditImageQuality::Low, false) => 2,
      (GptImage1EditImageQuality::Medium, true) => 5,
      (GptImage1EditImageQuality::Medium, false) => 7,
      (GptImage1EditImageQuality::High, true) => 17,
      (GptImage1EditImageQuality::High, false) => 25,
    };

    let n: u64 = match self.num_images {
      GptImage1EditImageNumImages::One => 1,
      GptImage1EditImageNumImages::Two => 2,
      GptImage1EditImageNumImages::Three => 3,
      GptImage1EditImageNumImages::Four => 4,
    };
    base_cost * n
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(
    num_images: GptImage1EditImageNumImages,
    quality: Option<GptImage1EditImageQuality>,
    image_size: Option<GptImage1EditImageSize>,
  ) -> GptImage1EditImageRequest {
    GptImage1EditImageRequest {
      prompt: "test".to_string(),
      image_urls: vec!["https://example.com/image.png".to_string()],
      num_images,
      mask_image_url: None,
      image_size,
      quality,
      input_fidelity: None,
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
        make_request(GptImage1EditImageNumImages::One, None, None)
          .calculate_cost_in_cents(), 5);
    }

    #[test]
    fn cost_defaults_four_images() {
      assert_eq!(
        make_request(GptImage1EditImageNumImages::Four, None, None)
          .calculate_cost_in_cents(), 20);
    }
  }

  mod low_quality_tests {
    use super::*;

    #[test]
    fn cost_low_square_one_image() {
      assert_eq!(
        make_request(GptImage1EditImageNumImages::One, Some(GptImage1EditImageQuality::Low), Some(GptImage1EditImageSize::Square))
          .calculate_cost_in_cents(), 2);
    }

    #[test]
    fn cost_low_horizontal_one_image() {
      assert_eq!(
        make_request(GptImage1EditImageNumImages::One, Some(GptImage1EditImageQuality::Low), Some(GptImage1EditImageSize::Horizontal))
          .calculate_cost_in_cents(), 2);
    }

    #[test]
    fn cost_low_auto_four_images() {
      // Auto is treated as square
      assert_eq!(
        make_request(GptImage1EditImageNumImages::Four, Some(GptImage1EditImageQuality::Low), Some(GptImage1EditImageSize::Auto))
          .calculate_cost_in_cents(), 8);
    }
  }

  mod medium_quality_tests {
    use super::*;

    #[test]
    fn cost_medium_square_one_image() {
      assert_eq!(
        make_request(GptImage1EditImageNumImages::One, Some(GptImage1EditImageQuality::Medium), Some(GptImage1EditImageSize::Square))
          .calculate_cost_in_cents(), 5);
    }

    #[test]
    fn cost_medium_auto_one_image() {
      assert_eq!(
        make_request(GptImage1EditImageNumImages::One, Some(GptImage1EditImageQuality::Medium), Some(GptImage1EditImageSize::Auto))
          .calculate_cost_in_cents(), 5);
    }

    #[test]
    fn cost_medium_horizontal_one_image() {
      assert_eq!(
        make_request(GptImage1EditImageNumImages::One, Some(GptImage1EditImageQuality::Medium), Some(GptImage1EditImageSize::Horizontal))
          .calculate_cost_in_cents(), 7);
    }

    #[test]
    fn cost_medium_vertical_one_image() {
      assert_eq!(
        make_request(GptImage1EditImageNumImages::One, Some(GptImage1EditImageQuality::Medium), Some(GptImage1EditImageSize::Vertical))
          .calculate_cost_in_cents(), 7);
    }

    #[test]
    fn cost_medium_horizontal_three_images() {
      assert_eq!(
        make_request(GptImage1EditImageNumImages::Three, Some(GptImage1EditImageQuality::Medium), Some(GptImage1EditImageSize::Horizontal))
          .calculate_cost_in_cents(), 21);
    }
  }

  mod high_quality_tests {
    use super::*;

    #[test]
    fn cost_high_square_one_image() {
      assert_eq!(
        make_request(GptImage1EditImageNumImages::One, Some(GptImage1EditImageQuality::High), Some(GptImage1EditImageSize::Square))
          .calculate_cost_in_cents(), 17);
    }

    #[test]
    fn cost_high_horizontal_one_image() {
      assert_eq!(
        make_request(GptImage1EditImageNumImages::One, Some(GptImage1EditImageQuality::High), Some(GptImage1EditImageSize::Horizontal))
          .calculate_cost_in_cents(), 25);
    }

    #[test]
    fn cost_high_vertical_one_image() {
      assert_eq!(
        make_request(GptImage1EditImageNumImages::One, Some(GptImage1EditImageQuality::High), Some(GptImage1EditImageSize::Vertical))
          .calculate_cost_in_cents(), 25);
    }

    #[test]
    fn cost_high_square_two_images() {
      assert_eq!(
        make_request(GptImage1EditImageNumImages::Two, Some(GptImage1EditImageQuality::High), Some(GptImage1EditImageSize::Square))
          .calculate_cost_in_cents(), 34);
    }

    #[test]
    fn cost_high_horizontal_four_images() {
      assert_eq!(
        make_request(GptImage1EditImageNumImages::Four, Some(GptImage1EditImageQuality::High), Some(GptImage1EditImageSize::Horizontal))
          .calculate_cost_in_cents(), 100);
    }
  }
}

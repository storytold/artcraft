use crate::requests::api::image::edit::gpt_image_1p5_edit_image::api::{
  GptImage1p5EditImageNumImages, GptImage1p5EditImageQuality,
  GptImage1p5EditImageRequest, GptImage1p5EditImageSize,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for GptImage1p5EditImageRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Per fal docs (fal-ai/gpt-image-1.5/edit):
    //   Low:    $0.009 (1024x1024) / $0.013 (other) per image
    //   Medium: $0.034 (1024x1024) / $0.050-$0.051 (other) per image
    //   High:   $0.133 (1024x1024) / $0.199-$0.200 (other) per image
    let use_quality = self.quality.unwrap_or(GptImage1p5EditImageQuality::Medium);
    let use_size = self.image_size.unwrap_or(GptImage1p5EditImageSize::Square);

    let base_cost = match (use_quality, use_size) {
      (GptImage1p5EditImageQuality::Low, GptImage1p5EditImageSize::Square) => 1,
      (GptImage1p5EditImageQuality::Low, _) => 1,
      (GptImage1p5EditImageQuality::Medium, GptImage1p5EditImageSize::Square) => 3,
      (GptImage1p5EditImageQuality::Medium, _) => 5,
      (GptImage1p5EditImageQuality::High, GptImage1p5EditImageSize::Square) => 13,
      (GptImage1p5EditImageQuality::High, _) => 20,
    };

    let cost = match self.num_images {
      GptImage1p5EditImageNumImages::One => base_cost,
      GptImage1p5EditImageNumImages::Two => base_cost * 2,
      GptImage1p5EditImageNumImages::Three => base_cost * 3,
      GptImage1p5EditImageNumImages::Four => base_cost * 4,
    };
    cost as UsdCents
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(
    num_images: GptImage1p5EditImageNumImages,
    quality: Option<GptImage1p5EditImageQuality>,
    image_size: Option<GptImage1p5EditImageSize>,
  ) -> GptImage1p5EditImageRequest {
    GptImage1p5EditImageRequest {
      prompt: "test".to_string(),
      image_urls: vec!["https://example.com/image.png".to_string()],
      num_images,
      mask_image_url: None,
      image_size,
      background: None,
      quality,
      input_fidelity: None,
      output_format: None,
    }
  }

  mod default_tests {
    use super::*;

    #[test]
    fn cost_defaults_one_image() {
      // Default quality=Medium, size=Square => 3 cents
      assert_eq!(
        make_request(GptImage1p5EditImageNumImages::One, None, None)
          .calculate_cost_in_cents(), 3);
    }

    #[test]
    fn cost_defaults_four_images() {
      assert_eq!(
        make_request(GptImage1p5EditImageNumImages::Four, None, None)
          .calculate_cost_in_cents(), 12);
    }
  }

  mod low_quality_tests {
    use super::*;

    #[test]
    fn cost_low_square_one_image() {
      assert_eq!(
        make_request(GptImage1p5EditImageNumImages::One, Some(GptImage1p5EditImageQuality::Low), Some(GptImage1p5EditImageSize::Square))
          .calculate_cost_in_cents(), 1);
    }

    #[test]
    fn cost_low_wide_one_image() {
      assert_eq!(
        make_request(GptImage1p5EditImageNumImages::One, Some(GptImage1p5EditImageQuality::Low), Some(GptImage1p5EditImageSize::Wide))
          .calculate_cost_in_cents(), 1);
    }

    #[test]
    fn cost_low_tall_four_images() {
      assert_eq!(
        make_request(GptImage1p5EditImageNumImages::Four, Some(GptImage1p5EditImageQuality::Low), Some(GptImage1p5EditImageSize::Tall))
          .calculate_cost_in_cents(), 4);
    }
  }

  mod medium_quality_tests {
    use super::*;

    #[test]
    fn cost_medium_square_one_image() {
      assert_eq!(
        make_request(GptImage1p5EditImageNumImages::One, Some(GptImage1p5EditImageQuality::Medium), Some(GptImage1p5EditImageSize::Square))
          .calculate_cost_in_cents(), 3);
    }

    #[test]
    fn cost_medium_wide_one_image() {
      assert_eq!(
        make_request(GptImage1p5EditImageNumImages::One, Some(GptImage1p5EditImageQuality::Medium), Some(GptImage1p5EditImageSize::Wide))
          .calculate_cost_in_cents(), 5);
    }

    #[test]
    fn cost_medium_tall_one_image() {
      assert_eq!(
        make_request(GptImage1p5EditImageNumImages::One, Some(GptImage1p5EditImageQuality::Medium), Some(GptImage1p5EditImageSize::Tall))
          .calculate_cost_in_cents(), 5);
    }

    #[test]
    fn cost_medium_wide_three_images() {
      assert_eq!(
        make_request(GptImage1p5EditImageNumImages::Three, Some(GptImage1p5EditImageQuality::Medium), Some(GptImage1p5EditImageSize::Wide))
          .calculate_cost_in_cents(), 15);
    }
  }

  mod high_quality_tests {
    use super::*;

    #[test]
    fn cost_high_square_one_image() {
      assert_eq!(
        make_request(GptImage1p5EditImageNumImages::One, Some(GptImage1p5EditImageQuality::High), Some(GptImage1p5EditImageSize::Square))
          .calculate_cost_in_cents(), 13);
    }

    #[test]
    fn cost_high_wide_one_image() {
      assert_eq!(
        make_request(GptImage1p5EditImageNumImages::One, Some(GptImage1p5EditImageQuality::High), Some(GptImage1p5EditImageSize::Wide))
          .calculate_cost_in_cents(), 20);
    }

    #[test]
    fn cost_high_tall_one_image() {
      assert_eq!(
        make_request(GptImage1p5EditImageNumImages::One, Some(GptImage1p5EditImageQuality::High), Some(GptImage1p5EditImageSize::Tall))
          .calculate_cost_in_cents(), 20);
    }

    #[test]
    fn cost_high_square_two_images() {
      assert_eq!(
        make_request(GptImage1p5EditImageNumImages::Two, Some(GptImage1p5EditImageQuality::High), Some(GptImage1p5EditImageSize::Square))
          .calculate_cost_in_cents(), 26);
    }

    #[test]
    fn cost_high_wide_four_images() {
      assert_eq!(
        make_request(GptImage1p5EditImageNumImages::Four, Some(GptImage1p5EditImageQuality::High), Some(GptImage1p5EditImageSize::Wide))
          .calculate_cost_in_cents(), 80);
    }
  }
}

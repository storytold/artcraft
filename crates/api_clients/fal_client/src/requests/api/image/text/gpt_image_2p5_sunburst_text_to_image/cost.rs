use crate::requests::api::image::text::gpt_image_2p5_sunburst_text_to_image::api::GptImage2p5SunburstTextToImageRequest;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for GptImage2p5SunburstTextToImageRequest {
  /// Flare and Sunburst are priced identically; see `gpt_image_2p5_pricing` for the model.
  fn calculate_cost_in_cents(&self) -> UsdCents {
    self.params.estimate_cost_in_cents()
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::image::common::gpt_image_2_resolution::GptImage2Resolution;
  use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_image_size::GptImage2p5ImageSize;
  use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_num_images::GptImage2p5NumImages;
  use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_quality::GptImage2p5Quality;
  use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_text_to_image_params::GptImage2p5TextToImageParams;
  use GptImage2Resolution::*;
  use GptImage2p5ImageSize::*;
  use GptImage2p5NumImages::*;
  use GptImage2p5Quality::{Low, Medium, High, XHigh, Max};

  // (size, quality, num_images, expected_cents)
  const PRESET_CASES: &[(GptImage2p5ImageSize, GptImage2p5Quality, GptImage2p5NumImages, u64)] = &[
    (Square,        Low,   One,  1),
    (Square,        High,  One,  6),
    (Square,        High,  Four, 24),
    (Square,        Max,   One,  22),
    (Landscape4x3,  High,  One,  4),
    (Landscape16x9, High,  One,  4),
    (Landscape16x9, XHigh, Two,  16),
    (SquareHd,      High,  One,  9),
    (Auto,          High,  One,  11),
  ];

  // (size, resolution, quality, num_images, expected_cents)
  const RESOLUTION_CASES: &[(GptImage2p5ImageSize, GptImage2Resolution, GptImage2p5Quality, GptImage2p5NumImages, u64)] = &[
    (Square,        OneK,   High, One, 6),
    (Square,        TwoK,   High, One, 9),
    (Square,        FourK,  High, One, 13),
    (Landscape16x9, OneK,   High, One, 3),
    (Landscape16x9, FourK,  High, One, 11),
    (Portrait4x3,   ThreeK, Medium, Three, 9),
  ];

  #[test]
  fn defaults_to_high_quality_landscape_4x3() {
    assert_eq!(make_request(One, None, None, None).calculate_cost_in_cents(), 4);
  }

  #[test]
  fn preset_costs() {
    for &(size, quality, num, expected) in PRESET_CASES {
      let actual = make_request(num, Some(quality), Some(size), None).calculate_cost_in_cents();
      assert_eq!(actual, expected, "{size:?} {quality:?} {num:?}");
    }
  }

  #[test]
  fn resolution_costs() {
    for &(size, res, quality, num, expected) in RESOLUTION_CASES {
      let actual = make_request(num, Some(quality), Some(size), Some(res)).calculate_cost_in_cents();
      assert_eq!(actual, expected, "{size:?} {res:?} {quality:?} {num:?}");
    }
  }

  #[test]
  fn matches_shared_params_estimate() {
    let request = make_request(Three, Some(XHigh), Some(Portrait16x9), Some(ThreeK));
    assert_eq!(request.calculate_cost_in_cents(), request.params.estimate_cost_in_cents());
  }

  fn make_request(
    num_images: GptImage2p5NumImages,
    quality: Option<GptImage2p5Quality>,
    image_size: Option<GptImage2p5ImageSize>,
    resolution: Option<GptImage2Resolution>,
  ) -> GptImage2p5SunburstTextToImageRequest {
    GptImage2p5SunburstTextToImageRequest {
      params: GptImage2p5TextToImageParams {
        prompt: "test".to_string(),
        num_images,
        image_size,
        resolution,
        quality,
        background: None,
        output_format: None,
        output_compression: None,
      },
    }
  }
}

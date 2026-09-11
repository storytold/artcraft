use crate::requests::api::image::edit::gpt_image_2p5_flare_edit_image::api::GptImage2p5FlareEditImageRequest;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for GptImage2p5FlareEditImageRequest {
  /// Flare and Sunburst are priced identically; see `gpt_image_2p5_pricing` for the model.
  fn calculate_cost_in_cents(&self) -> UsdCents {
    self.params.estimate_cost_in_cents()
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::image::common::gpt_image_2_resolution::GptImage2Resolution;
  use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_edit_image_params::GptImage2p5EditImageParams;
  use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_image_size::GptImage2p5ImageSize;
  use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_num_images::GptImage2p5NumImages;
  use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_quality::GptImage2p5Quality;
  use GptImage2Resolution::*;
  use GptImage2p5ImageSize::*;
  use GptImage2p5NumImages::*;
  use GptImage2p5Quality::{Low, Medium, High, XHigh, Max};

  // (num_reference_images, size, quality, num_images, expected_cents)
  const PRESET_CASES: &[(usize, GptImage2p5ImageSize, GptImage2p5Quality, GptImage2p5NumImages, u64)] = &[
    (1, Square,        Low,   One,  2),
    (1, Square,        High,  One,  7),
    (1, Square,        High,  Four, 28),
    (1, Square,        Max,   One,  22),
    (1, Landscape4x3,  High,  One,  5),
    (1, Landscape16x9, High,  One,  5),
    (3, Landscape16x9, High,  One,  7),
    (1, SquareHd,      High,  One,  10),
    (1, Auto,          High,  One,  11),
    (4, Auto,          XHigh, Two,  42),
  ];

  // (num_reference_images, size, resolution, quality, num_images, expected_cents)
  const RESOLUTION_CASES: &[(usize, GptImage2p5ImageSize, GptImage2Resolution, GptImage2p5Quality, GptImage2p5NumImages, u64)] = &[
    (1, Square,        OneK,   High,   One,   7),
    (1, Square,        TwoK,   High,   One,   10),
    (1, Square,        FourK,  High,   One,   14),
    (1, Landscape16x9, OneK,   High,   One,   4),
    (1, Landscape16x9, FourK,  High,   One,   11),
    (2, Portrait4x3,   ThreeK, Medium, Three, 15),
  ];

  #[test]
  fn defaults_to_high_quality_auto_size() {
    assert_eq!(make_request(1, One, None, None, None).calculate_cost_in_cents(), 11);
  }

  #[test]
  fn preset_costs() {
    for &(refs, size, quality, num, expected) in PRESET_CASES {
      let actual = make_request(refs, num, Some(quality), Some(size), None).calculate_cost_in_cents();
      assert_eq!(actual, expected, "{refs} refs {size:?} {quality:?} {num:?}");
    }
  }

  #[test]
  fn resolution_costs() {
    for &(refs, size, res, quality, num, expected) in RESOLUTION_CASES {
      let actual = make_request(refs, num, Some(quality), Some(size), Some(res)).calculate_cost_in_cents();
      assert_eq!(actual, expected, "{refs} refs {size:?} {res:?} {quality:?} {num:?}");
    }
  }

  #[test]
  fn matches_shared_params_estimate() {
    let request = make_request(2, Three, Some(XHigh), Some(Portrait16x9), Some(ThreeK));
    assert_eq!(request.calculate_cost_in_cents(), request.params.estimate_cost_in_cents());
  }

  fn make_request(
    num_reference_images: usize,
    num_images: GptImage2p5NumImages,
    quality: Option<GptImage2p5Quality>,
    image_size: Option<GptImage2p5ImageSize>,
    resolution: Option<GptImage2Resolution>,
  ) -> GptImage2p5FlareEditImageRequest {
    GptImage2p5FlareEditImageRequest {
      params: GptImage2p5EditImageParams {
        prompt: "test".to_string(),
        image_urls: vec!["https://example.com/image.png".to_string(); num_reference_images],
        mask_url: None,
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

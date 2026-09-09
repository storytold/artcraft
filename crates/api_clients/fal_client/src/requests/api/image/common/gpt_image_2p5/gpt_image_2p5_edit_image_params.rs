use crate::requests::api::image::common::gpt_image_2_resolution::GptImage2Resolution;
use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_background::GptImage2p5Background;
use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_image_size::GptImage2p5ImageSize;
use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_num_images::GptImage2p5NumImages;
use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_output_format::GptImage2p5OutputFormat;
use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_pricing::{
  estimate_output_image_cost, estimate_reference_images_cost, hundredths_of_cent_to_cents,
};
use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_quality::GptImage2p5Quality;
use crate::requests::api::image::common::gpt_image_2p5::raw::gpt_image_2p5_edit_image_input::GptImage2p5EditImageInput;
use crate::requests::traits::fal_request_cost_calculator_trait::UsdCents;

/// Fal rejects more than this many reference images.
pub const MAX_REFERENCE_IMAGES: usize = 16;

/// Parameters for a GPT Image 2.5 edit request. Identical for Flare and Sunburst; the
/// per-endpoint request types wrap this.
#[derive(Clone, Debug)]
pub struct GptImage2p5EditImageParams {
  /// Text prompt describing the edit. 1 to 32,000 characters.
  pub prompt: String,

  /// One to sixteen reference image URLs.
  pub image_urls: Vec<String>,

  /// Optional mask URL indicating which part of the image to edit.
  pub mask_url: Option<String>,

  /// Number of images to generate.
  pub num_images: GptImage2p5NumImages,

  /// Output image size preset. `None` lets Fal default to `auto` (inferred from the input
  /// images).
  pub image_size: Option<GptImage2p5ImageSize>,

  /// Optional resolution tier. When present (and the size is not `Auto`), a custom
  /// width x height is computed from the preset's aspect ratio and sent instead of the
  /// preset name.
  pub resolution: Option<GptImage2Resolution>,

  /// Quality tier. `None` lets Fal default to `high`.
  pub quality: Option<GptImage2p5Quality>,

  /// Background treatment. `None` lets Fal default to `auto`.
  pub background: Option<GptImage2p5Background>,

  /// Output format. `None` sends `png`.
  pub output_format: Option<GptImage2p5OutputFormat>,

  /// Compression level 0 to 100. Only sent for `jpeg` and `webp`.
  pub output_compression: Option<u8>,
}

impl GptImage2p5EditImageParams {
  /// Fal's default when `image_size` is omitted.
  pub const DEFAULT_IMAGE_SIZE: GptImage2p5ImageSize = GptImage2p5ImageSize::Auto;

  /// Fal's default when `quality` is omitted.
  pub const DEFAULT_QUALITY: GptImage2p5Quality = GptImage2p5Quality::High;

  pub fn to_raw_input(&self) -> GptImage2p5EditImageInput {
    let output_format = self.output_format.unwrap_or(GptImage2p5OutputFormat::Png);
    let output_compression = if output_format.supports_compression() {
      self.output_compression.map(|c| c.min(100))
    } else {
      None
    };

    GptImage2p5EditImageInput {
      prompt: self.prompt.clone(),
      image_urls: self.image_urls.clone(),
      mask_url: self.mask_url.clone(),
      image_size: self.image_size.map(|size| size.to_raw_param(self.resolution)),
      background: self.background.map(|b| b.to_str().to_string()),
      quality: self.quality.map(|q| q.to_str().to_string()),
      num_images: Some(self.num_images.to_u8()),
      output_format: Some(output_format.to_str().to_string()),
      output_compression,
    }
  }

  /// Estimated cost in whole cents, rounded up per image.
  ///
  /// Each output image is charged for rendering plus an allowance for reading the reference
  /// images (the mask is not counted). With no explicit size the estimate uses the
  /// conservative `Auto` dimensions.
  pub fn estimate_cost_in_cents(&self) -> UsdCents {
    let quality = self.quality.unwrap_or(Self::DEFAULT_QUALITY);
    let (width, height) = self.image_size
      .unwrap_or(Self::DEFAULT_IMAGE_SIZE)
      .estimated_output_dimensions(self.resolution);
    let hundredths_per_image = estimate_output_image_cost(quality, width, height)
      + estimate_reference_images_cost(self.image_urls.len());
    hundredths_of_cent_to_cents(hundredths_per_image) * self.num_images.to_u64()
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::image::common::gpt_image_2p5::raw::gpt_image_2p5_image_size_param::GptImage2p5ImageSizeParam;
  use GptImage2Resolution::*;
  use GptImage2p5ImageSize::*;
  use GptImage2p5NumImages::*;
  use GptImage2p5Quality::{Low, Medium, High, XHigh, Max};

  const IMAGE_URL: &str = "https://example.com/image.png";

  mod to_raw_input_tests {
    use super::*;

    #[test]
    fn minimal_request_serializes_to_expected_json() {
      let raw = make_params(1, One, None, None, None).to_raw_input();
      let json = serde_json::to_value(&raw).unwrap();
      assert_eq!(json, serde_json::json!({
        "prompt": "test",
        "image_urls": [IMAGE_URL],
        "num_images": 1,
        "output_format": "png",
      }));
    }

    #[test]
    fn full_request_serializes_to_expected_json() {
      let params = GptImage2p5EditImageParams {
        prompt: "add a hat".to_string(),
        image_urls: vec!["https://example.com/a.png".to_string(), "https://example.com/b.png".to_string()],
        mask_url: Some("https://example.com/mask.png".to_string()),
        num_images: Two,
        image_size: Some(Portrait4x3),
        resolution: Some(OneK),
        quality: Some(Max),
        background: Some(GptImage2p5Background::Opaque),
        output_format: Some(GptImage2p5OutputFormat::Jpeg),
        output_compression: Some(90),
      };
      let json = serde_json::to_value(params.to_raw_input()).unwrap();
      assert_eq!(json, serde_json::json!({
        "prompt": "add a hat",
        "image_urls": ["https://example.com/a.png", "https://example.com/b.png"],
        "mask_url": "https://example.com/mask.png",
        "image_size": { "width": 768, "height": 1024 },
        "background": "opaque",
        "quality": "max",
        "num_images": 2,
        "output_format": "jpeg",
        "output_compression": 90,
      }));
    }

    #[test]
    fn auto_size_sends_auto_preset_even_with_resolution() {
      let raw = make_params(1, One, None, Some(Auto), Some(TwoK)).to_raw_input();
      match raw.image_size.unwrap() {
        GptImage2p5ImageSizeParam::Preset(s) => assert_eq!(s, "auto"),
        GptImage2p5ImageSizeParam::Custom(_) => panic!("expected preset"),
      }
    }

    #[test]
    fn resolution_without_size_is_not_sent() {
      let raw = make_params(1, One, None, None, Some(TwoK)).to_raw_input();
      assert!(raw.image_size.is_none());
    }

    #[test]
    fn compression_dropped_for_png() {
      let mut params = make_params(1, One, None, None, None);
      params.output_compression = Some(50);
      assert!(params.to_raw_input().output_compression.is_none());
    }
  }

  mod cost_tests {
    use super::*;

    // (size, resolution, [low, medium, high, xhigh, max]) — expected cents per image with
    // one reference image. Pinned from the model in `gpt_image_2p5_pricing`.
    const GRID_ONE_REFERENCE: &[(GptImage2p5ImageSize, Option<GptImage2Resolution>, [u64; 5])] = &[
      // 1:1
      (Square,        None,         [2, 3,  7, 11, 22]), // 1024x1024
      (Square,        Some(OneK),   [2, 3,  7, 11, 22]), // 1024x1024
      (Square,        Some(TwoK),   [2, 3, 10, 16, 35]), // 2048x2048
      (Square,        Some(ThreeK), [3, 4, 14, 23, 51]), // 2880x2880
      (Square,        Some(FourK),  [3, 4, 14, 23, 51]), // 2880x2880 (pixel cap)
      (SquareHd,      None,         [2, 3, 10, 16, 35]), // 2048x2048
      (SquareHd,      Some(OneK),   [2, 3,  7, 11, 22]), // 1024x1024
      (SquareHd,      Some(TwoK),   [2, 3, 10, 16, 35]), // 2048x2048
      (SquareHd,      Some(ThreeK), [3, 4, 14, 23, 51]), // 2880x2880
      (SquareHd,      Some(FourK),  [3, 4, 14, 23, 51]), // 2880x2880 (pixel cap)
      // 4:3
      (Landscape4x3,  None,         [2, 2,  5,  8, 16]), // 1024x768
      (Landscape4x3,  Some(OneK),   [2, 2,  5,  8, 16]), // 1024x768
      (Landscape4x3,  Some(TwoK),   [2, 3,  7, 12, 25]), // 2048x1536
      (Landscape4x3,  Some(ThreeK), [2, 4, 11, 19, 40]), // 3072x2304
      (Landscape4x3,  Some(FourK),  [3, 4, 12, 21, 45]), // 3312x2480 (pixel cap)
      (Portrait4x3,   None,         [2, 2,  5,  8, 16]), // 768x1024
      (Portrait4x3,   Some(OneK),   [2, 2,  5,  8, 16]), // 768x1024
      (Portrait4x3,   Some(TwoK),   [2, 3,  7, 12, 25]), // 1536x2048
      (Portrait4x3,   Some(ThreeK), [2, 4, 11, 19, 40]), // 2304x3072
      (Portrait4x3,   Some(FourK),  [3, 4, 12, 21, 45]), // 2480x3312 (pixel cap)
      // 16:9
      (Landscape16x9, None,         [2, 2,  5,  8, 17]), // 1920x1080
      (Landscape16x9, Some(OneK),   [2, 2,  4,  6, 12]), // 1088x608
      (Landscape16x9, Some(TwoK),   [2, 2,  6,  9, 18]), // 2048x1152
      (Landscape16x9, Some(ThreeK), [2, 3,  8, 14, 30]), // 3072x1728
      (Landscape16x9, Some(FourK),  [2, 4, 11, 19, 41]), // 3840x2160
      (Portrait16x9,  None,         [2, 2,  5,  8, 17]), // 1080x1920
      (Portrait16x9,  Some(OneK),   [2, 2,  4,  6, 12]), // 608x1088
      (Portrait16x9,  Some(TwoK),   [2, 2,  6,  9, 18]), // 1152x2048
      (Portrait16x9,  Some(ThreeK), [2, 3,  8, 14, 30]), // 1728x3072
      (Portrait16x9,  Some(FourK),  [2, 4, 11, 19, 41]), // 2160x3840
      // Auto always prices at the conservative 3840x2160
      (Auto,          None,         [2, 4, 11, 19, 41]),
      (Auto,          Some(OneK),   [2, 4, 11, 19, 41]),
      (Auto,          Some(FourK),  [2, 4, 11, 19, 41]),
    ];

    const ALL_QUALITIES: [GptImage2p5Quality; 5] = [Low, Medium, High, XHigh, Max];

    #[test]
    fn exhaustive_grid_with_one_reference_image() {
      for &(size, resolution, expected) in GRID_ONE_REFERENCE {
        for (quality, expected) in ALL_QUALITIES.iter().zip(expected) {
          let actual = make_params(1, One, Some(*quality), Some(size), resolution).estimate_cost_in_cents();
          assert_eq!(actual, expected, "{size:?} {resolution:?} {quality:?}");
        }
      }
    }

    #[test]
    fn batch_scales_linearly_across_grid() {
      for &(size, resolution, _) in GRID_ONE_REFERENCE {
        let per_image = make_params(1, One, Some(High), Some(size), resolution).estimate_cost_in_cents();
        for (num, n) in [(Two, 2), (Three, 3), (Four, 4)] {
          let actual = make_params(1, num, Some(High), Some(size), resolution).estimate_cost_in_cents();
          assert_eq!(actual, per_image * n, "{size:?} {resolution:?} x{n}");
        }
      }
    }

    #[test]
    fn more_reference_images_never_cost_less() {
      for &(size, resolution, _) in GRID_ONE_REFERENCE {
        let mut previous = 0;
        for refs in 1..=16 {
          let cost = make_params(refs, One, Some(High), Some(size), resolution).estimate_cost_in_cents();
          assert!(cost >= previous, "{size:?} {resolution:?} {refs} refs: {cost} < {previous}");
          previous = cost;
        }
      }
    }

    #[test]
    fn defaults_to_high_quality_auto_size() {
      // 3840x2160 high = 1001 + one reference image 80 = 1081 hundredths => 11 cents
      assert_eq!(make_params(1, One, None, None, None).estimate_cost_in_cents(), 11);
      assert_eq!(make_params(1, One, Some(High), Some(Auto), None).estimate_cost_in_cents(), 11);
    }

    #[test]
    fn reference_images_add_to_cost() {
      // Square high = 529 hundredths; each reference image adds 80.
      assert_eq!(make_params(1, One, Some(High), Some(Square), None).estimate_cost_in_cents(), 7);  // 609
      assert_eq!(make_params(3, One, Some(High), Some(Square), None).estimate_cost_in_cents(), 8);  // 769
      assert_eq!(make_params(16, One, Some(High), Some(Square), None).estimate_cost_in_cents(), 19); // 1809
    }

    #[test]
    fn batch_multiplies_per_image_cents() {
      assert_eq!(make_params(1, One, Some(High), Some(Square), None).estimate_cost_in_cents(), 7);
      assert_eq!(make_params(1, Two, Some(High), Some(Square), None).estimate_cost_in_cents(), 14);
      assert_eq!(make_params(1, Three, Some(High), Some(Square), None).estimate_cost_in_cents(), 21);
      assert_eq!(make_params(1, Four, Some(High), Some(Square), None).estimate_cost_in_cents(), 28);
    }
  }

  fn make_params(
    num_reference_images: usize,
    num_images: GptImage2p5NumImages,
    quality: Option<GptImage2p5Quality>,
    image_size: Option<GptImage2p5ImageSize>,
    resolution: Option<GptImage2Resolution>,
  ) -> GptImage2p5EditImageParams {
    GptImage2p5EditImageParams {
      prompt: "test".to_string(),
      image_urls: vec![IMAGE_URL.to_string(); num_reference_images],
      mask_url: None,
      num_images,
      image_size,
      resolution,
      quality,
      background: None,
      output_format: None,
      output_compression: None,
    }
  }
}

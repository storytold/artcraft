use crate::requests::api::image::common::gpt_image_2_resolution::GptImage2Resolution;
use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_background::GptImage2p5Background;
use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_image_size::GptImage2p5ImageSize;
use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_num_images::GptImage2p5NumImages;
use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_output_format::GptImage2p5OutputFormat;
use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_pricing::{
  estimate_output_image_cost, hundredths_of_cent_to_cents,
};
use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_quality::GptImage2p5Quality;
use crate::requests::api::image::common::gpt_image_2p5::raw::gpt_image_2p5_text_to_image_input::GptImage2p5TextToImageInput;
use crate::requests::traits::fal_request_cost_calculator_trait::UsdCents;

/// Parameters for a GPT Image 2.5 text-to-image request. Identical for Flare and Sunburst;
/// the per-endpoint request types wrap this.
#[derive(Clone, Debug)]
pub struct GptImage2p5TextToImageParams {
  /// Text prompt describing the image to generate. 1 to 32,000 characters.
  pub prompt: String,

  /// Number of images to generate.
  pub num_images: GptImage2p5NumImages,

  /// Output image size preset. `None` lets Fal default to `landscape_4_3`.
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

impl GptImage2p5TextToImageParams {
  /// Fal's default when `image_size` is omitted.
  pub const DEFAULT_IMAGE_SIZE: GptImage2p5ImageSize = GptImage2p5ImageSize::Landscape4x3;

  /// Fal's default when `quality` is omitted.
  pub const DEFAULT_QUALITY: GptImage2p5Quality = GptImage2p5Quality::High;

  pub fn to_raw_input(&self) -> GptImage2p5TextToImageInput {
    let output_format = self.output_format.unwrap_or(GptImage2p5OutputFormat::Png);
    let output_compression = if output_format.supports_compression() {
      self.output_compression.map(|c| c.min(100))
    } else {
      None
    };

    GptImage2p5TextToImageInput {
      prompt: self.prompt.clone(),
      image_size: self.image_size.map(|size| size.to_raw_param(self.resolution)),
      background: self.background.map(|b| b.to_str().to_string()),
      quality: self.quality.map(|q| q.to_str().to_string()),
      num_images: Some(self.num_images.to_u8()),
      output_format: Some(output_format.to_str().to_string()),
      output_compression,
    }
  }

  /// Estimated cost in whole cents, rounded up per image.
  pub fn estimate_cost_in_cents(&self) -> UsdCents {
    let quality = self.quality.unwrap_or(Self::DEFAULT_QUALITY);
    let (width, height) = self.image_size
      .unwrap_or(Self::DEFAULT_IMAGE_SIZE)
      .estimated_output_dimensions(self.resolution);
    let hundredths_per_image = estimate_output_image_cost(quality, width, height);
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

  mod to_raw_input_tests {
    use super::*;

    #[test]
    fn minimal_request_only_sends_required_and_defaulted_fields() {
      let raw = make_params(One, None, None, None).to_raw_input();
      assert_eq!(raw.prompt, "test");
      assert!(raw.image_size.is_none());
      assert!(raw.background.is_none());
      assert!(raw.quality.is_none());
      assert_eq!(raw.num_images, Some(1));
      assert_eq!(raw.output_format.as_deref(), Some("png"));
      assert!(raw.output_compression.is_none());
    }

    #[test]
    fn minimal_request_serializes_to_expected_json() {
      let raw = make_params(One, None, None, None).to_raw_input();
      let json = serde_json::to_value(&raw).unwrap();
      assert_eq!(json, serde_json::json!({
        "prompt": "test",
        "num_images": 1,
        "output_format": "png",
      }));
    }

    #[test]
    fn full_request_serializes_to_expected_json() {
      let params = GptImage2p5TextToImageParams {
        prompt: "a corgi".to_string(),
        num_images: Three,
        image_size: Some(Landscape16x9),
        resolution: Some(TwoK),
        quality: Some(XHigh),
        background: Some(GptImage2p5Background::Transparent),
        output_format: Some(GptImage2p5OutputFormat::Webp),
        output_compression: Some(80),
      };
      let json = serde_json::to_value(params.to_raw_input()).unwrap();
      assert_eq!(json, serde_json::json!({
        "prompt": "a corgi",
        "image_size": { "width": 2048, "height": 1152 },
        "background": "transparent",
        "quality": "xhigh",
        "num_images": 3,
        "output_format": "webp",
        "output_compression": 80,
      }));
    }

    #[test]
    fn preset_without_resolution() {
      let raw = make_params(One, None, Some(Square), None).to_raw_input();
      match raw.image_size.unwrap() {
        GptImage2p5ImageSizeParam::Preset(s) => assert_eq!(s, "square"),
        GptImage2p5ImageSizeParam::Custom(_) => panic!("expected preset"),
      }
    }

    #[test]
    fn auto_size_sends_auto_preset() {
      let raw = make_params(One, None, Some(Auto), Some(TwoK)).to_raw_input();
      match raw.image_size.unwrap() {
        GptImage2p5ImageSizeParam::Preset(s) => assert_eq!(s, "auto"),
        GptImage2p5ImageSizeParam::Custom(_) => panic!("expected preset"),
      }
    }

    #[test]
    fn resolution_without_size_is_not_sent() {
      // No preset means no aspect ratio to derive dimensions from; let Fal default.
      let raw = make_params(One, None, None, Some(TwoK)).to_raw_input();
      assert!(raw.image_size.is_none());
    }

    #[test]
    fn compression_dropped_for_png() {
      let mut params = make_params(One, None, None, None);
      params.output_format = Some(GptImage2p5OutputFormat::Png);
      params.output_compression = Some(50);
      assert!(params.to_raw_input().output_compression.is_none());

      params.output_format = None;
      assert!(params.to_raw_input().output_compression.is_none());
    }

    #[test]
    fn compression_kept_for_jpeg_and_clamped() {
      let mut params = make_params(One, None, None, None);
      params.output_format = Some(GptImage2p5OutputFormat::Jpeg);
      params.output_compression = Some(50);
      assert_eq!(params.to_raw_input().output_compression, Some(50));

      params.output_compression = Some(200);
      assert_eq!(params.to_raw_input().output_compression, Some(100));
    }

    #[test]
    fn all_qualities_serialize() {
      for quality in [GptImage2p5Quality::Auto, Low, Medium, High, XHigh, Max] {
        let raw = make_params(One, Some(quality), None, None).to_raw_input();
        assert_eq!(raw.quality.as_deref(), Some(quality.to_str()));
      }
    }
  }

  mod cost_tests {
    use super::*;

    // (size, resolution, [low, medium, high, xhigh, max]) — expected cents per image.
    // Pinned from the model in `gpt_image_2p5_pricing`; a change here must be deliberate.
    const GRID: &[(GptImage2p5ImageSize, Option<GptImage2Resolution>, [u64; 5])] = &[
      // 1:1
      (Square,        None,         [1, 2,  6, 10, 22]), // 1024x1024
      (Square,        Some(OneK),   [1, 2,  6, 10, 22]), // 1024x1024
      (Square,        Some(TwoK),   [1, 3,  9, 15, 34]), // 2048x2048
      (Square,        Some(ThreeK), [2, 4, 13, 22, 50]), // 2880x2880
      (Square,        Some(FourK),  [2, 4, 13, 22, 50]), // 2880x2880 (pixel cap)
      (SquareHd,      None,         [1, 3,  9, 15, 34]), // 2048x2048
      (SquareHd,      Some(OneK),   [1, 2,  6, 10, 22]), // 1024x1024
      (SquareHd,      Some(TwoK),   [1, 3,  9, 15, 34]), // 2048x2048
      (SquareHd,      Some(ThreeK), [2, 4, 13, 22, 50]), // 2880x2880
      (SquareHd,      Some(FourK),  [2, 4, 13, 22, 50]), // 2880x2880 (pixel cap)
      // 4:3
      (Landscape4x3,  None,         [1, 1,  4,  7, 15]), // 1024x768
      (Landscape4x3,  Some(OneK),   [1, 1,  4,  7, 15]), // 1024x768
      (Landscape4x3,  Some(TwoK),   [1, 2,  6, 11, 24]), // 2048x1536
      (Landscape4x3,  Some(ThreeK), [2, 3, 10, 18, 39]), // 3072x2304
      (Landscape4x3,  Some(FourK),  [2, 3, 11, 20, 44]), // 3312x2480 (pixel cap)
      (Portrait4x3,   None,         [1, 1,  4,  7, 15]), // 768x1024
      (Portrait4x3,   Some(OneK),   [1, 1,  4,  7, 15]), // 768x1024
      (Portrait4x3,   Some(TwoK),   [1, 2,  6, 11, 24]), // 1536x2048
      (Portrait4x3,   Some(ThreeK), [2, 3, 10, 18, 39]), // 2304x3072
      (Portrait4x3,   Some(FourK),  [2, 3, 11, 20, 44]), // 2480x3312 (pixel cap)
      // 16:9
      (Landscape16x9, None,         [1, 2,  4,  8, 16]), // 1920x1080
      (Landscape16x9, Some(OneK),   [1, 1,  3,  5, 11]), // 1088x608
      (Landscape16x9, Some(TwoK),   [1, 2,  5,  8, 17]), // 2048x1152
      (Landscape16x9, Some(ThreeK), [1, 2,  8, 13, 29]), // 3072x1728
      (Landscape16x9, Some(FourK),  [2, 3, 11, 18, 41]), // 3840x2160
      (Portrait16x9,  None,         [1, 2,  4,  8, 16]), // 1080x1920
      (Portrait16x9,  Some(OneK),   [1, 1,  3,  5, 11]), // 608x1088
      (Portrait16x9,  Some(TwoK),   [1, 2,  5,  8, 17]), // 1152x2048
      (Portrait16x9,  Some(ThreeK), [1, 2,  8, 13, 29]), // 1728x3072
      (Portrait16x9,  Some(FourK),  [2, 3, 11, 18, 41]), // 2160x3840
      // Auto always prices at the conservative 3840x2160
      (Auto,          None,         [2, 3, 11, 18, 41]),
      (Auto,          Some(OneK),   [2, 3, 11, 18, 41]),
      (Auto,          Some(FourK),  [2, 3, 11, 18, 41]),
    ];

    const ALL_QUALITIES: [GptImage2p5Quality; 5] = [Low, Medium, High, XHigh, Max];

    #[test]
    fn exhaustive_grid() {
      for &(size, resolution, expected) in GRID {
        for (quality, expected) in ALL_QUALITIES.iter().zip(expected) {
          let actual = make_params(One, Some(*quality), Some(size), resolution).estimate_cost_in_cents();
          assert_eq!(actual, expected, "{size:?} {resolution:?} {quality:?}");
        }
      }
    }

    #[test]
    fn batch_scales_linearly_across_grid() {
      for &(size, resolution, _) in GRID {
        let per_image = make_params(One, Some(High), Some(size), resolution).estimate_cost_in_cents();
        for (num, n) in [(Two, 2), (Three, 3), (Four, 4)] {
          let actual = make_params(num, Some(High), Some(size), resolution).estimate_cost_in_cents();
          assert_eq!(actual, per_image * n, "{size:?} {resolution:?} x{n}");
        }
      }
    }

    #[test]
    fn higher_resolution_never_costs_less() {
      for size in [Square, SquareHd, Landscape4x3, Portrait4x3, Landscape16x9, Portrait16x9] {
        let tiers = [OneK, TwoK, ThreeK, FourK];
        for pair in tiers.windows(2) {
          let lower = make_params(One, Some(High), Some(size), Some(pair[0])).estimate_cost_in_cents();
          let higher = make_params(One, Some(High), Some(size), Some(pair[1])).estimate_cost_in_cents();
          assert!(lower <= higher, "{size:?} {:?} ({lower}) should be <= {:?} ({higher})", pair[0], pair[1]);
        }
      }
    }

    #[test]
    fn defaults_to_high_quality_landscape_4x3() {
      // 1024x768 high = 363 hundredths => 4 cents
      assert_eq!(make_params(One, None, None, None).estimate_cost_in_cents(), 4);
      assert_eq!(make_params(One, Some(High), Some(Landscape4x3), None).estimate_cost_in_cents(), 4);
    }

    #[test]
    fn resolution_without_size_prices_at_default_aspect() {
      assert_eq!(
        make_params(One, Some(High), None, Some(TwoK)).estimate_cost_in_cents(),
        make_params(One, Some(High), Some(Landscape4x3), Some(TwoK)).estimate_cost_in_cents(),
      );
    }

    #[test]
    fn batch_multiplies_per_image_cents() {
      let per_image = make_params(One, Some(High), Some(Square), None).estimate_cost_in_cents();
      assert_eq!(per_image, 6);
      assert_eq!(make_params(Two, Some(High), Some(Square), None).estimate_cost_in_cents(), 12);
      assert_eq!(make_params(Three, Some(High), Some(Square), None).estimate_cost_in_cents(), 18);
      assert_eq!(make_params(Four, Some(High), Some(Square), None).estimate_cost_in_cents(), 24);
    }
  }

  fn make_params(
    num_images: GptImage2p5NumImages,
    quality: Option<GptImage2p5Quality>,
    image_size: Option<GptImage2p5ImageSize>,
    resolution: Option<GptImage2Resolution>,
  ) -> GptImage2p5TextToImageParams {
    GptImage2p5TextToImageParams {
      prompt: "test".to_string(),
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

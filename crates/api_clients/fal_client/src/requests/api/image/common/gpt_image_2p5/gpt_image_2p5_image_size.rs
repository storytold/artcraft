use crate::requests::api::image::common::gpt_image_2_resolution::{
  compute_custom_image_size, GptImage2AspectRatio, GptImage2Resolution,
};
use crate::requests::api::image::common::gpt_image_2p5::raw::gpt_image_2p5_image_size_param::GptImage2p5ImageSizeParam;

/// Output image size preset. Both text-to-image and edit accept the same set, including
/// `Auto` (text-to-image: model picks; edit: inferred from the input images).
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum GptImage2p5ImageSize {
  SquareHd,
  Square,
  Portrait4x3,
  Portrait16x9,
  Landscape4x3,
  Landscape16x9,
  Auto,
}

/// Conservative dimensions assumed for `Auto` when estimating cost: the largest canonical
/// size Fal publishes pricing for.
pub const AUTO_SIZE_ESTIMATED_DIMENSIONS: (u32, u32) = (3840, 2160);

impl GptImage2p5ImageSize {
  /// Build the wire `image_size` value.
  ///
  /// With a resolution tier, a concrete `{width, height}` is computed from the preset's
  /// aspect ratio. `Auto` has no aspect ratio, so it is always sent as the `"auto"` preset
  /// and any resolution tier is ignored.
  pub fn to_raw_param(self, resolution: Option<GptImage2Resolution>) -> GptImage2p5ImageSizeParam {
    match (self.to_aspect_ratio(), resolution) {
      (Some(aspect), Some(resolution)) => {
        GptImage2p5ImageSizeParam::Custom(compute_custom_image_size(aspect, resolution))
      }
      _ => GptImage2p5ImageSizeParam::Preset(self.to_preset_str().to_string()),
    }
  }

  /// The output dimensions we expect Fal to render, used for cost estimation.
  pub fn estimated_output_dimensions(self, resolution: Option<GptImage2Resolution>) -> (u32, u32) {
    match (self.to_aspect_ratio(), resolution) {
      (Some(aspect), Some(resolution)) => {
        let custom = compute_custom_image_size(aspect, resolution);
        (custom.width, custom.height)
      }
      _ => self.preset_dimensions(),
    }
  }

  pub fn to_preset_str(self) -> &'static str {
    match self {
      GptImage2p5ImageSize::SquareHd => "square_hd",
      GptImage2p5ImageSize::Square => "square",
      GptImage2p5ImageSize::Portrait4x3 => "portrait_4_3",
      GptImage2p5ImageSize::Portrait16x9 => "portrait_16_9",
      GptImage2p5ImageSize::Landscape4x3 => "landscape_4_3",
      GptImage2p5ImageSize::Landscape16x9 => "landscape_16_9",
      GptImage2p5ImageSize::Auto => "auto",
    }
  }

  /// `None` for `Auto`, which carries no aspect ratio.
  pub fn to_aspect_ratio(self) -> Option<GptImage2AspectRatio> {
    match self {
      GptImage2p5ImageSize::SquareHd => Some(GptImage2AspectRatio::SquareHd),
      GptImage2p5ImageSize::Square => Some(GptImage2AspectRatio::Square),
      GptImage2p5ImageSize::Portrait4x3 => Some(GptImage2AspectRatio::Portrait4x3),
      GptImage2p5ImageSize::Portrait16x9 => Some(GptImage2AspectRatio::Portrait16x9),
      GptImage2p5ImageSize::Landscape4x3 => Some(GptImage2AspectRatio::Landscape4x3),
      GptImage2p5ImageSize::Landscape16x9 => Some(GptImage2AspectRatio::Landscape16x9),
      GptImage2p5ImageSize::Auto => None,
    }
  }

  /// Dimensions assumed for a preset sent without a resolution tier. These match the
  /// assumptions used by the GPT Image 2 bindings; `Auto` uses the conservative maximum.
  fn preset_dimensions(self) -> (u32, u32) {
    match self {
      GptImage2p5ImageSize::SquareHd => (2048, 2048),
      GptImage2p5ImageSize::Square => (1024, 1024),
      GptImage2p5ImageSize::Portrait4x3 => (768, 1024),
      GptImage2p5ImageSize::Portrait16x9 => (1080, 1920),
      GptImage2p5ImageSize::Landscape4x3 => (1024, 768),
      GptImage2p5ImageSize::Landscape16x9 => (1920, 1080),
      GptImage2p5ImageSize::Auto => AUTO_SIZE_ESTIMATED_DIMENSIONS,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use GptImage2p5ImageSize::*;

  const ALL_SIZES: &[GptImage2p5ImageSize] = &[
    SquareHd, Square, Portrait4x3, Portrait16x9, Landscape4x3, Landscape16x9, Auto,
  ];

  #[test]
  fn wire_strings_match_fal_schema() {
    assert_eq!(SquareHd.to_preset_str(), "square_hd");
    assert_eq!(Square.to_preset_str(), "square");
    assert_eq!(Portrait4x3.to_preset_str(), "portrait_4_3");
    assert_eq!(Portrait16x9.to_preset_str(), "portrait_16_9");
    assert_eq!(Landscape4x3.to_preset_str(), "landscape_4_3");
    assert_eq!(Landscape16x9.to_preset_str(), "landscape_16_9");
    assert_eq!(Auto.to_preset_str(), "auto");
  }

  #[test]
  fn preset_without_resolution_sends_preset_string() {
    for &size in ALL_SIZES {
      match size.to_raw_param(None) {
        GptImage2p5ImageSizeParam::Preset(s) => assert_eq!(s, size.to_preset_str()),
        GptImage2p5ImageSizeParam::Custom(_) => panic!("{size:?} should be a preset"),
      }
    }
  }

  #[test]
  fn preset_with_resolution_sends_custom_dimensions() {
    match Landscape16x9.to_raw_param(Some(GptImage2Resolution::TwoK)) {
      GptImage2p5ImageSizeParam::Custom(c) => {
        assert_eq!(c.width, 2048);
        assert_eq!(c.height, 1152);
      }
      GptImage2p5ImageSizeParam::Preset(_) => panic!("expected custom"),
    }
  }

  #[test]
  fn auto_with_resolution_falls_back_to_auto_preset() {
    match Auto.to_raw_param(Some(GptImage2Resolution::TwoK)) {
      GptImage2p5ImageSizeParam::Preset(s) => assert_eq!(s, "auto"),
      GptImage2p5ImageSizeParam::Custom(_) => panic!("Auto must never send custom dimensions"),
    }
  }

  #[test]
  fn estimated_dimensions_without_resolution() {
    assert_eq!(Square.estimated_output_dimensions(None), (1024, 1024));
    assert_eq!(SquareHd.estimated_output_dimensions(None), (2048, 2048));
    assert_eq!(Landscape4x3.estimated_output_dimensions(None), (1024, 768));
    assert_eq!(Portrait4x3.estimated_output_dimensions(None), (768, 1024));
    assert_eq!(Landscape16x9.estimated_output_dimensions(None), (1920, 1080));
    assert_eq!(Portrait16x9.estimated_output_dimensions(None), (1080, 1920));
    assert_eq!(Auto.estimated_output_dimensions(None), (3840, 2160));
  }

  #[test]
  fn estimated_dimensions_with_resolution_match_wire_dimensions() {
    for &size in ALL_SIZES {
      if size == Auto {
        continue;
      }
      for res in [GptImage2Resolution::OneK, GptImage2Resolution::TwoK, GptImage2Resolution::ThreeK, GptImage2Resolution::FourK] {
        let (w, h) = size.estimated_output_dimensions(Some(res));
        match size.to_raw_param(Some(res)) {
          GptImage2p5ImageSizeParam::Custom(c) => assert_eq!((c.width, c.height), (w, h), "{size:?} {res:?}"),
          GptImage2p5ImageSizeParam::Preset(_) => panic!("{size:?} {res:?} should be custom"),
        }
      }
    }
  }

  #[test]
  fn auto_ignores_resolution_for_estimation() {
    assert_eq!(Auto.estimated_output_dimensions(Some(GptImage2Resolution::OneK)), (3840, 2160));
  }
}

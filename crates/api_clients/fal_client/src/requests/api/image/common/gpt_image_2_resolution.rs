use serde::{Deserialize, Serialize};

/// Our synthetic resolution tiers for GPT Image 2. When combined with an
/// aspect ratio (image_size), we compute a concrete width x height that
/// satisfies all GPT Image 2 constraints:
///
/// - Maximum edge length <= 3840px
/// - Both edges must be multiples of 16px
/// - Long-to-short ratio must not exceed 3:1
/// - Total pixels: 655,360 <= w*h <= 8,294,400
#[derive(Copy, Clone, Debug)]
pub enum GptImage2Resolution {
  /// ~1K on the long edge (1024px baseline)
  OneK,
  /// ~2K on the long edge (2048px baseline)
  TwoK,
  /// ~3K on the long edge (3072px baseline)
  ThreeK,
  /// ~4K on the long edge (max edge, up to 3840px)
  FourK,
}

/// The aspect ratios supported by GPT Image 2 (the standard image_size enum
/// values that carry aspect-ratio semantics).
#[derive(Copy, Clone, Debug)]
pub enum GptImage2AspectRatio {
  /// 1:1
  Square,
  /// 1:1 (HD variant — same ratio, higher default res)
  SquareHd,
  /// 4:3
  Landscape4x3,
  /// 16:9
  Landscape16x9,
  /// 3:4
  Portrait4x3,
  /// 9:16
  Portrait16x9,
}

/// A custom image size with explicit width and height, serialisable as the
/// JSON object `{"width": N, "height": N}` that Fal accepts.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomImageSize {
  pub width: u32,
  pub height: u32,
}

const MIN_PIXELS: u64 = 655_360;
const MAX_PIXELS: u64 = 8_294_400;
const MAX_EDGE: u32 = 3840;

/// Given an aspect ratio and a resolution tier, compute a concrete
/// `CustomImageSize`. The returned dimensions are guaranteed to satisfy all
/// GPT Image 2 constraints.
pub fn compute_custom_image_size(aspect: GptImage2AspectRatio, resolution: GptImage2Resolution) -> CustomImageSize {
  // Aspect ratio as (w_ratio, h_ratio)
  let (w_ratio, h_ratio): (u32, u32) = match aspect {
    GptImage2AspectRatio::Square | GptImage2AspectRatio::SquareHd => (1, 1),
    GptImage2AspectRatio::Landscape4x3 => (4, 3),
    GptImage2AspectRatio::Landscape16x9 => (16, 9),
    GptImage2AspectRatio::Portrait4x3 => (3, 4),
    GptImage2AspectRatio::Portrait16x9 => (9, 16),
  };

  // Target long-edge pixels for each tier
  let target_long_edge: u32 = match resolution {
    GptImage2Resolution::OneK => 1024,
    GptImage2Resolution::TwoK => 2048,
    GptImage2Resolution::ThreeK => 3072,
    GptImage2Resolution::FourK => 3840,
  };

  // Compute raw dimensions from the target long edge and the aspect ratio.
  // The long edge gets `target_long_edge`; the short edge is derived.
  let (raw_w, raw_h) = if w_ratio >= h_ratio {
    // Landscape or square: width is the long edge
    let w = target_long_edge;
    let h = (w as u64 * h_ratio as u64 / w_ratio as u64) as u32;
    (w, h)
  } else {
    // Portrait: height is the long edge
    let h = target_long_edge;
    let w = (h as u64 * w_ratio as u64 / h_ratio as u64) as u32;
    (w, h)
  };

  // Round both dimensions down to nearest multiple of 16
  let mut w = (raw_w / 16) * 16;
  let mut h = (raw_h / 16) * 16;

  // Clamp each edge to MAX_EDGE
  w = w.min(MAX_EDGE);
  h = h.min(MAX_EDGE);

  // Ensure minimum pixels by scaling up if needed
  let pixels = w as u64 * h as u64;
  if pixels < MIN_PIXELS {
    // Scale up uniformly
    let scale = ((MIN_PIXELS as f64) / (pixels as f64)).sqrt();
    w = (((w as f64 * scale).ceil() as u32 + 15) / 16) * 16;
    h = (((h as f64 * scale).ceil() as u32 + 15) / 16) * 16;
  }

  // Ensure maximum pixels by scaling down if needed
  let pixels = w as u64 * h as u64;
  if pixels > MAX_PIXELS {
    let scale = ((MAX_PIXELS as f64) / (pixels as f64)).sqrt();
    w = ((w as f64 * scale).floor() as u32 / 16) * 16;
    h = ((h as f64 * scale).floor() as u32 / 16) * 16;
  }

  // Final clamp
  w = w.min(MAX_EDGE);
  h = h.min(MAX_EDGE);

  CustomImageSize { width: w, height: h }
}

#[cfg(test)]
mod tests {
  use super::*;

  const ALL_ASPECTS: &[GptImage2AspectRatio] = &[
    GptImage2AspectRatio::Square,
    GptImage2AspectRatio::SquareHd,
    GptImage2AspectRatio::Landscape4x3,
    GptImage2AspectRatio::Landscape16x9,
    GptImage2AspectRatio::Portrait4x3,
    GptImage2AspectRatio::Portrait16x9,
  ];

  const ALL_RESOLUTIONS: &[GptImage2Resolution] = &[
    GptImage2Resolution::OneK,
    GptImage2Resolution::TwoK,
    GptImage2Resolution::ThreeK,
    GptImage2Resolution::FourK,
  ];

  #[test]
  fn all_combinations_satisfy_constraints() {
    for &aspect in ALL_ASPECTS {
      for &resolution in ALL_RESOLUTIONS {
        let size = compute_custom_image_size(aspect, resolution);
        let pixels = size.width as u64 * size.height as u64;
        let max_edge = size.width.max(size.height);
        let min_edge = size.width.min(size.height);

        assert!(size.width % 16 == 0, "width {} not multiple of 16 for {:?} {:?}", size.width, aspect, resolution);
        assert!(size.height % 16 == 0, "height {} not multiple of 16 for {:?} {:?}", size.height, aspect, resolution);
        assert!(max_edge <= MAX_EDGE, "max edge {} exceeds 3840 for {:?} {:?}", max_edge, aspect, resolution);
        assert!(max_edge as f64 / min_edge as f64 <= 3.0, "ratio {:.2} exceeds 3:1 for {:?} {:?} ({}x{})", max_edge as f64 / min_edge as f64, aspect, resolution, size.width, size.height);
        assert!(pixels >= MIN_PIXELS, "pixels {} < 655360 for {:?} {:?} ({}x{})", pixels, aspect, resolution, size.width, size.height);
        assert!(pixels <= MAX_PIXELS, "pixels {} > 8294400 for {:?} {:?} ({}x{})", pixels, aspect, resolution, size.width, size.height);
      }
    }
  }

  #[test]
  fn all_combinations_dimensions_snapshot() {
    // Print all dimensions for manual review / documentation
    for &aspect in ALL_ASPECTS {
      for &resolution in ALL_RESOLUTIONS {
        let size = compute_custom_image_size(aspect, resolution);
        let pixels = size.width as u64 * size.height as u64;
        println!("{:?} + {:?} => {}x{} ({} pixels)", aspect, resolution, size.width, size.height, pixels);
      }
    }
  }

  mod specific_dimensions {
    use super::*;

    #[test]
    fn square_1k() {
      let s = compute_custom_image_size(GptImage2AspectRatio::Square, GptImage2Resolution::OneK);
      assert_eq!(s.width, 1024);
      assert_eq!(s.height, 1024);
    }

    #[test]
    fn square_4k() {
      let s = compute_custom_image_size(GptImage2AspectRatio::Square, GptImage2Resolution::FourK);
      // sqrt(8294400) ~= 2880, but 3840 * 3840 = 14745600 > MAX, so it gets clamped
      assert!(s.width <= MAX_EDGE);
      assert!(s.height <= MAX_EDGE);
      assert!(s.width as u64 * s.height as u64 <= MAX_PIXELS);
    }

    #[test]
    fn landscape_16x9_1k() {
      // 1024x576 = 589,824 < MIN_PIXELS, so gets scaled up to 1088x608
      let s = compute_custom_image_size(GptImage2AspectRatio::Landscape16x9, GptImage2Resolution::OneK);
      assert_eq!(s.width, 1088);
      assert_eq!(s.height, 608);
    }

    #[test]
    fn portrait_16x9_4k() {
      let s = compute_custom_image_size(GptImage2AspectRatio::Portrait16x9, GptImage2Resolution::FourK);
      assert!(s.width <= MAX_EDGE);
      assert!(s.height <= MAX_EDGE);
      assert!(s.width as u64 * s.height as u64 <= MAX_PIXELS);
    }
  }
}

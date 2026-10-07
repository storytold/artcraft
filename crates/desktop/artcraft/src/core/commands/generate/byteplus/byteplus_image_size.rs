use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_resolution::CommonResolution;

/// Seedream's longest supported edge.
const MAX_EDGE: u32 = 4096;

/// Seedream 5.0 Pro renders up to about 2K: at most this many pixels, sides in multiples of 16.
const PRO_MAX_PIXELS: u32 = 4_624_220;

/// Seedream 5.0 Pro's 1K tier tops out at 1024x1024 x 1.1025 pixels.
const PRO_1K_MAX_PIXELS: u32 = 1_156_055;

/// Picks Seedream's `size`: a preset (`2K`/`4K`) when the aspect ratio is automatic, otherwise an
/// explicit `WIDTHxHEIGHT` around 2K, or scaled toward 4K for 4K requests. Explicit sizes are all
/// at least 3,686,400 pixels, the minimum for Seedream 4.5 and 5.0.
pub fn seedream_size(
  maybe_aspect_ratio: Option<CommonAspectRatio>,
  maybe_resolution: Option<CommonResolution>,
) -> String {
  let wants_4k = matches!(maybe_resolution, Some(CommonResolution::FourK));

  let (width, height) = match maybe_aspect_ratio {
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto3k) => {
      return if wants_4k { "4K" } else { "2K" }.to_string();
    }
    Some(CommonAspectRatio::Auto4k) => return "4K".to_string(),
    Some(CommonAspectRatio::SquareHd) => return format!("{}x{}", MAX_EDGE, MAX_EDGE),
    Some(ratio) => base_dimensions(ratio),
  };

  let (width, height) = if wants_4k { scale_toward_max_edge(width, height) } else { (width, height) };
  format!("{}x{}", width, height)
}

/// Seedream 5.0 Pro's `size`: the same shapes as [`seedream_size`], at 1K when asked for 1K or
/// less and otherwise capped at about 2K (the 3K/4K presets are refused by the model).
pub fn seedream_pro_size(
  maybe_aspect_ratio: Option<CommonAspectRatio>,
  maybe_resolution: Option<CommonResolution>,
) -> String {
  let is_1k = matches!(
    maybe_resolution,
    Some(CommonResolution::OneK)
      | Some(CommonResolution::HalfK)
      | Some(CommonResolution::FourEightyP)
      | Some(CommonResolution::SevenTwentyP)
  );
  let (preset, max_pixels) = if is_1k { ("1K", PRO_1K_MAX_PIXELS) } else { ("2K", PRO_MAX_PIXELS) };

  let (width, height) = match maybe_aspect_ratio {
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto3k)
    | Some(CommonAspectRatio::Auto4k) => return preset.to_string(),
    Some(CommonAspectRatio::SquareHd) => (2048, 2048),
    Some(ratio) => base_dimensions(ratio),
  };
  let (width, height) = fit_pixel_budget(width, height, max_pixels);
  format!("{}x{}", width, height)
}

fn base_dimensions(ratio: CommonAspectRatio) -> (u32, u32) {
  match ratio {
    CommonAspectRatio::WideSixteenByNine | CommonAspectRatio::Wide => (2560, 1440),
    CommonAspectRatio::TallNineBySixteen | CommonAspectRatio::Tall => (1440, 2560),
    CommonAspectRatio::WideFourByThree => (2304, 1728),
    CommonAspectRatio::TallThreeByFour => (1728, 2304),
    CommonAspectRatio::WideThreeByTwo => (2496, 1664),
    CommonAspectRatio::TallTwoByThree => (1664, 2496),
    CommonAspectRatio::WideFiveByFour => (2240, 1792),
    CommonAspectRatio::TallFourByFive => (1792, 2240),
    CommonAspectRatio::WideTwentyOneByNine => (3024, 1296),
    CommonAspectRatio::TallNineByTwentyOne => (1296, 3024),
    // Square, and any ratio added later.
    _ => (2048, 2048),
  }
}

/// Scales down (never up) to at most `max_pixels`, keeping sides in multiples of 16.
fn fit_pixel_budget(width: u32, height: u32, max_pixels: u32) -> (u32, u32) {
  let factor = (max_pixels as f64 / (width as f64 * height as f64)).sqrt().min(1.0);
  let round_down_16 = |value: f64| (((value / 16.0).floor() as u32) * 16).max(16);
  (round_down_16(width as f64 * factor), round_down_16(height as f64 * factor))
}

/// Up to 2x larger, with the longest edge capped at Seedream's limit (multiples of 16).
fn scale_toward_max_edge(width: u32, height: u32) -> (u32, u32) {
  let factor = (MAX_EDGE as f64 / width.max(height) as f64).min(2.0);
  let round_down_16 = |value: f64| ((value / 16.0).floor() as u32) * 16;
  (round_down_16(width as f64 * factor), round_down_16(height as f64 * factor))
}

#[cfg(test)]
mod tests {
  use super::*;

  const SEEDREAM_MIN_PIXELS: u32 = 3_686_400;
  /// Seedream 5.0 Pro's 1K tier starts at 1280x720.
  const PRO_1K_MIN_PIXELS: u32 = 921_600;

  const EXPLICIT_RATIOS: [CommonAspectRatio; 11] = [
    CommonAspectRatio::Square,
    CommonAspectRatio::WideSixteenByNine,
    CommonAspectRatio::TallNineBySixteen,
    CommonAspectRatio::WideFourByThree,
    CommonAspectRatio::TallThreeByFour,
    CommonAspectRatio::WideThreeByTwo,
    CommonAspectRatio::TallTwoByThree,
    CommonAspectRatio::WideFiveByFour,
    CommonAspectRatio::TallFourByFive,
    CommonAspectRatio::WideTwentyOneByNine,
    CommonAspectRatio::TallNineByTwentyOne,
  ];

  mod presets {
    use super::*;

    #[test]
    fn automatic_ratios_use_presets() {
      assert_eq!(seedream_size(None, None), "2K");
      assert_eq!(seedream_size(Some(CommonAspectRatio::Auto2k), None), "2K");
      assert_eq!(seedream_size(Some(CommonAspectRatio::Auto), Some(CommonResolution::FourK)), "4K");
      assert_eq!(seedream_size(Some(CommonAspectRatio::Auto4k), None), "4K");
    }

    #[test]
    fn square_hd_is_max_size() {
      assert_eq!(seedream_size(Some(CommonAspectRatio::SquareHd), None), "4096x4096");
    }
  }

  mod explicit {
    use super::*;

    #[test]
    fn common_ratios_at_2k() {
      assert_eq!(seedream_size(Some(CommonAspectRatio::WideSixteenByNine), None), "2560x1440");
      assert_eq!(seedream_size(Some(CommonAspectRatio::TallThreeByFour), None), "1728x2304");
      assert_eq!(seedream_size(Some(CommonAspectRatio::Square), None), "2048x2048");
    }

    #[test]
    fn four_k_scales_up_within_the_edge_limit() {
      assert_eq!(seedream_size(Some(CommonAspectRatio::WideSixteenByNine), Some(CommonResolution::FourK)), "4096x2304");
      assert_eq!(seedream_size(Some(CommonAspectRatio::Square), Some(CommonResolution::FourK)), "4096x4096");
    }

    #[test]
    fn every_explicit_size_meets_seedream_limits() {
      for ratio in EXPLICIT_RATIOS {
        for resolution in [None, Some(CommonResolution::FourK)] {
          let size = seedream_size(Some(ratio), resolution);
          let (w, h) = parse_size(&size);
          assert!(w * h >= SEEDREAM_MIN_PIXELS, "{:?} {:?} -> {}", ratio, resolution, size);
          assert!(w.max(h) <= MAX_EDGE, "{:?} {:?} -> {}", ratio, resolution, size);
        }
      }
    }
  }

  mod pro {
    use super::*;

    #[test]
    fn automatic_ratios_use_presets() {
      assert_eq!(seedream_pro_size(None, None), "2K");
      assert_eq!(seedream_pro_size(Some(CommonAspectRatio::Auto4k), Some(CommonResolution::FourK)), "2K");
      assert_eq!(seedream_pro_size(Some(CommonAspectRatio::Auto), Some(CommonResolution::OneK)), "1K");
    }

    #[test]
    fn common_ratios() {
      assert_eq!(seedream_pro_size(Some(CommonAspectRatio::WideSixteenByNine), None), "2560x1440");
      assert_eq!(seedream_pro_size(Some(CommonAspectRatio::WideSixteenByNine), Some(CommonResolution::OneK)), "1424x800");
    }

    #[test]
    fn two_k_sizes_stay_within_its_limit() {
      for ratio in EXPLICIT_RATIOS.into_iter().chain([CommonAspectRatio::SquareHd]) {
        for resolution in [None, Some(CommonResolution::TwoK), Some(CommonResolution::FourK)] {
          let size = seedream_pro_size(Some(ratio), resolution);
          let (w, h) = parse_size(&size);
          assert!(w * h <= PRO_MAX_PIXELS, "{} is too large", size);
          assert_eq!((w % 16, h % 16), (0, 0), "{} isn't in multiples of 16", size);
        }
      }
    }

    #[test]
    fn one_k_sizes_stay_in_the_1k_tier() {
      for ratio in EXPLICIT_RATIOS.into_iter().chain([CommonAspectRatio::SquareHd]) {
        let size = seedream_pro_size(Some(ratio), Some(CommonResolution::OneK));
        let (w, h) = parse_size(&size);
        assert!((PRO_1K_MIN_PIXELS..=PRO_1K_MAX_PIXELS).contains(&(w * h)), "{:?} -> {}", ratio, size);
        assert_eq!((w % 16, h % 16), (0, 0), "{} isn't in multiples of 16", size);
      }
    }
  }

  fn parse_size(size: &str) -> (u32, u32) {
    let (w, h) = size.split_once('x').unwrap();
    (w.parse().unwrap(), h.parse().unwrap())
  }
}

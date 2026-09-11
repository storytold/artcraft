use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio as CommonAspectRatioEnum;
use enums::common::generation::common_quality::CommonQuality as CommonQualityEnum;
use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;
use fal_client::requests::api::image::common::gpt_image_2_resolution::GptImage2Resolution;
use fal_client::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_image_size::GptImage2p5ImageSize;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;

/// Artcraft price per output image, in hundredths of a US cent, by output dimensions and
/// quality (`[low, medium, high]`). Rows are stored landscape-first; portrait orientations of
/// the same dimensions price identically. Dimensions come from the aspect ratio preset and
/// resolution tier the same way the Fal request builder derives them.
const OUTPUT_IMAGE_PRICE_TABLE: &[(u32, u32, [u64; 3])] = &[
  // 1:1
  (1024, 1024, [ 65, 152,  582]),
  (2048, 2048, [103, 239,  919]),
  (2880, 2880, [151, 352, 1357]),
  // 4:3
  (1024,  768, [ 46, 105,  400]),
  (2048, 1536, [ 73, 170,  652]),
  (3072, 2304, [120, 279, 1073]),
  (3312, 2480, [134, 311, 1194]),
  // 16:9
  (1088,  608, [ 32,  75,  285]),
  (1920, 1080, [ 49, 114,  436]),
  (2048, 1152, [ 53, 121,  467]),
  (3072, 1728, [ 87, 204,  783]),
  (3840, 2160, [124, 286, 1102]),
];

/// Artcraft price per reference image on an edit request, in hundredths of a US cent.
const REFERENCE_IMAGE_PRICE: u64 = 88;

/// The inputs that determine an Artcraft GPT Image 2.5 price. Shared by Flare and Sunburst,
/// which are priced identically.
#[derive(Clone, Debug)]
pub struct ArtcraftGptImage2p5CostInputs {
  pub quality: Option<CommonQualityEnum>,
  pub aspect_ratio: Option<CommonAspectRatioEnum>,
  pub resolution: Option<CommonResolutionEnum>,
  pub num_reference_images: usize,
  pub num_images: u16,
}

impl ArtcraftGptImage2p5CostInputs {
  pub fn from_omni_request(request: &OmniGenImageCostAndGenerateRequest) -> Self {
    Self {
      quality: request.quality,
      aspect_ratio: request.aspect_ratio,
      resolution: request.resolution,
      num_reference_images: request.image_media_tokens.as_ref().map(|tokens| tokens.len()).unwrap_or(0),
      num_images: request.image_batch_count.unwrap_or(1),
    }
  }

  /// Per-image price rounded up to whole cents, times the batch size. Quality defaults to
  /// high. Without an aspect ratio, text-to-image prices as landscape 4:3 and edit as auto,
  /// matching the Fal defaults the request would fall back to.
  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    let quality = self.quality.unwrap_or(CommonQualityEnum::High);
    let (width, height) = self.output_dimensions();
    let hundredths_per_image = output_image_price(quality, width, height)
      + REFERENCE_IMAGE_PRICE * self.num_reference_images as u64;
    let cost_in_usd_cents = hundredths_per_image.div_ceil(100) * self.num_images as u64;

    ImageGenerationCostEstimate {
      cost_in_credits: Some(cost_in_usd_cents),
      cost_in_usd_cents: Some(cost_in_usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
      failures_are_refunded: None,
    }
  }

  fn output_dimensions(&self) -> (u32, u32) {
    let is_edit = self.num_reference_images > 0;
    let default_size = if is_edit { GptImage2p5ImageSize::Auto } else { GptImage2p5ImageSize::Landscape4x3 };
    let size = self.aspect_ratio.map(to_image_size).unwrap_or(default_size);
    size.estimated_output_dimensions(self.resolution.map(to_resolution))
  }
}

/// Look up the per-image price. Dimensions not in the table fall back to the largest row,
/// which is the most expensive.
fn output_image_price(quality: CommonQualityEnum, width: u32, height: u32) -> u64 {
  let prices = lookup_price_row(width, height)
    .unwrap_or_else(|| OUTPUT_IMAGE_PRICE_TABLE[OUTPUT_IMAGE_PRICE_TABLE.len() - 1].2);
  match quality {
    CommonQualityEnum::Low => prices[0],
    CommonQualityEnum::Medium => prices[1],
    CommonQualityEnum::High => prices[2],
  }
}

fn lookup_price_row(width: u32, height: u32) -> Option<[u64; 3]> {
  let long_edge = width.max(height);
  let short_edge = width.min(height);
  OUTPUT_IMAGE_PRICE_TABLE.iter()
    .find(|(w, h, _)| *w == long_edge && *h == short_edge)
    .map(|(_, _, prices)| *prices)
}

/// Mirrors the Fal request builder's aspect ratio mapping.
fn to_image_size(aspect_ratio: CommonAspectRatioEnum) -> GptImage2p5ImageSize {
  use CommonAspectRatioEnum as Ar;
  match aspect_ratio {
    Ar::Auto | Ar::Auto2k | Ar::Auto3k | Ar::Auto4k => GptImage2p5ImageSize::Auto,
    Ar::Square => GptImage2p5ImageSize::Square,
    Ar::SquareHd => GptImage2p5ImageSize::SquareHd,
    Ar::WideFourByThree | Ar::WideFiveByFour => GptImage2p5ImageSize::Landscape4x3,
    Ar::WideThreeByTwo | Ar::WideSixteenByNine | Ar::WideTwentyOneByNine | Ar::Wide => GptImage2p5ImageSize::Landscape16x9,
    Ar::TallThreeByFour | Ar::TallFourByFive => GptImage2p5ImageSize::Portrait4x3,
    Ar::TallTwoByThree | Ar::TallNineBySixteen | Ar::TallNineByTwentyOne | Ar::Tall => GptImage2p5ImageSize::Portrait16x9,
  }
}

/// Mirrors the Fal request builder's resolution mapping.
fn to_resolution(resolution: CommonResolutionEnum) -> GptImage2Resolution {
  use CommonResolutionEnum as R;
  match resolution {
    R::HalfK | R::FourEightyP | R::SevenTwentyP | R::OneK => GptImage2Resolution::OneK,
    R::TenEightyP | R::TwoK => GptImage2Resolution::TwoK,
    R::ThreeK => GptImage2Resolution::ThreeK,
    R::FourK => GptImage2Resolution::FourK,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use CommonAspectRatioEnum as Ar;
  use CommonQualityEnum as Q;
  use CommonResolutionEnum as R;

  const ALL_ASPECT_RATIOS: &[Ar] = &[
    Ar::Auto, Ar::Auto2k, Ar::Auto3k, Ar::Auto4k, Ar::Square, Ar::SquareHd,
    Ar::WideFourByThree, Ar::WideFiveByFour, Ar::WideThreeByTwo, Ar::WideSixteenByNine,
    Ar::WideTwentyOneByNine, Ar::Wide, Ar::TallThreeByFour, Ar::TallFourByFive,
    Ar::TallTwoByThree, Ar::TallNineBySixteen, Ar::TallNineByTwentyOne, Ar::Tall,
  ];

  const ALL_RESOLUTIONS: &[Option<R>] = &[
    None, Some(R::HalfK), Some(R::FourEightyP), Some(R::SevenTwentyP), Some(R::OneK),
    Some(R::TenEightyP), Some(R::TwoK), Some(R::ThreeK), Some(R::FourK),
  ];

  // (aspect_ratio, resolution, [low, medium, high]) — cents per image, text-to-image
  const TEXT_GRID: &[(Option<Ar>, Option<R>, [u64; 3])] = &[
    (None,                        None,           [1, 2,  4]), // landscape 4:3 default
    (Some(Ar::Square),            None,           [1, 2,  6]),
    (Some(Ar::Square),            Some(R::OneK),  [1, 2,  6]),
    (Some(Ar::Square),            Some(R::TwoK),  [2, 3, 10]),
    (Some(Ar::Square),            Some(R::ThreeK), [2, 4, 14]),
    (Some(Ar::Square),            Some(R::FourK), [2, 4, 14]),
    (Some(Ar::SquareHd),          None,           [2, 3, 10]),
    (Some(Ar::SquareHd),          Some(R::OneK),  [1, 2,  6]),
    (Some(Ar::WideFourByThree),   None,           [1, 2,  4]),
    (Some(Ar::WideFourByThree),   Some(R::TwoK),  [1, 2,  7]),
    (Some(Ar::WideFourByThree),   Some(R::ThreeK), [2, 3, 11]),
    (Some(Ar::WideFourByThree),   Some(R::FourK), [2, 4, 12]),
    (Some(Ar::TallThreeByFour),   None,           [1, 2,  4]),
    (Some(Ar::TallFourByFive),    Some(R::FourK), [2, 4, 12]),
    (Some(Ar::WideSixteenByNine), None,           [1, 2,  5]),
    (Some(Ar::WideSixteenByNine), Some(R::OneK),  [1, 1,  3]),
    (Some(Ar::WideSixteenByNine), Some(R::TenEightyP), [1, 2, 5]),
    (Some(Ar::WideSixteenByNine), Some(R::TwoK),  [1, 2,  5]),
    (Some(Ar::WideSixteenByNine), Some(R::ThreeK), [1, 3,  8]),
    (Some(Ar::WideSixteenByNine), Some(R::FourK), [2, 3, 12]),
    (Some(Ar::TallNineBySixteen), None,           [1, 2,  5]),
    (Some(Ar::Wide),              Some(R::HalfK), [1, 1,  3]),
    (Some(Ar::Tall),              Some(R::ThreeK), [1, 3,  8]),
    (Some(Ar::Auto),              None,           [2, 3, 12]),
    (Some(Ar::Auto4k),            Some(R::OneK),  [2, 3, 12]),
  ];

  mod text_to_image_tests {
    use super::*;

    #[test]
    fn grid() {
      for &(aspect_ratio, resolution, expected) in TEXT_GRID {
        for (quality, expected) in [Q::Low, Q::Medium, Q::High].into_iter().zip(expected) {
          let actual = make_inputs(0, Some(quality), aspect_ratio, resolution, 1).estimate_cost().cost_in_usd_cents.unwrap();
          assert_eq!(actual, expected, "{aspect_ratio:?} {resolution:?} {quality:?}");
        }
      }
    }

    #[test]
    fn quality_defaults_to_high() {
      assert_eq!(cents(make_inputs(0, None, Some(Ar::Square), None, 1)), 6);
    }

    #[test]
    fn batch_multiplies_per_image_cents() {
      for &(aspect_ratio, resolution, _) in TEXT_GRID {
        let per_image = cents(make_inputs(0, Some(Q::High), aspect_ratio, resolution, 1));
        for batch in 2..=4u16 {
          assert_eq!(cents(make_inputs(0, Some(Q::High), aspect_ratio, resolution, batch)), per_image * batch as u64);
        }
      }
    }
  }

  mod edit_image_tests {
    use super::*;

    #[test]
    fn no_aspect_ratio_prices_as_auto() {
      // 1102 + 88 = 1190
      assert_eq!(cents(make_inputs(1, Some(Q::High), None, None, 1)), 12);
      assert_eq!(cents(make_inputs(1, Some(Q::High), Some(Ar::Auto), None, 1)), 12);
    }

    #[test]
    fn reference_images_add_to_price() {
      // Square high 582, plus 88 per reference image
      assert_eq!(cents(make_inputs(1, Some(Q::High), Some(Ar::Square), None, 1)), 7);   // 670
      assert_eq!(cents(make_inputs(4, Some(Q::High), Some(Ar::Square), None, 1)), 10);  // 934
      assert_eq!(cents(make_inputs(16, Some(Q::High), Some(Ar::Square), None, 1)), 20); // 1990
      assert_eq!(cents(make_inputs(1, Some(Q::Low), Some(Ar::Square), None, 1)), 2);    // 153
    }

    #[test]
    fn batch_multiplies_per_image_cents() {
      assert_eq!(cents(make_inputs(1, Some(Q::High), Some(Ar::Square), None, 4)), 28);
    }
  }

  mod table_coverage_tests {
    use super::*;

    #[test]
    fn every_reachable_dimension_has_a_table_row() {
      for &aspect_ratio in ALL_ASPECT_RATIOS {
        for &resolution in ALL_RESOLUTIONS {
          for refs in [0, 1] {
            let (w, h) = make_inputs(refs, None, Some(aspect_ratio), resolution, 1).output_dimensions();
            assert!(lookup_price_row(w, h).is_some(), "{aspect_ratio:?} {resolution:?} => {w}x{h} missing from price table");
          }
        }
      }
      for refs in [0, 1] {
        for &resolution in ALL_RESOLUTIONS {
          let (w, h) = make_inputs(refs, None, None, resolution, 1).output_dimensions();
          assert!(lookup_price_row(w, h).is_some(), "no aspect, {resolution:?}, {refs} refs => {w}x{h} missing from price table");
        }
      }
    }

    #[test]
    fn unknown_dimensions_fall_back_to_most_expensive_row() {
      assert_eq!(output_image_price(Q::High, 640, 640), 1102);
    }

    #[test]
    fn orientation_does_not_change_price() {
      assert_eq!(output_image_price(Q::High, 768, 1024), output_image_price(Q::High, 1024, 768));
      assert_eq!(output_image_price(Q::Medium, 1080, 1920), output_image_price(Q::Medium, 1920, 1080));
    }

    #[test]
    fn prices_rise_with_quality_and_size() {
      for &(_, _, prices) in OUTPUT_IMAGE_PRICE_TABLE {
        assert!(prices[0] < prices[1] && prices[1] < prices[2], "{prices:?}");
      }
      assert!(output_image_price(Q::High, 1024, 1024) < output_image_price(Q::High, 2048, 2048));
      assert!(output_image_price(Q::High, 2048, 2048) < output_image_price(Q::High, 2880, 2880));
      assert!(output_image_price(Q::High, 1088, 608) < output_image_price(Q::High, 1920, 1080));
      assert!(output_image_price(Q::High, 3072, 1728) < output_image_price(Q::High, 3840, 2160));
    }
  }

  fn cents(inputs: ArtcraftGptImage2p5CostInputs) -> u64 {
    inputs.estimate_cost().cost_in_usd_cents.unwrap()
  }

  fn make_inputs(
    num_reference_images: usize,
    quality: Option<Q>,
    aspect_ratio: Option<Ar>,
    resolution: Option<R>,
    num_images: u16,
  ) -> ArtcraftGptImage2p5CostInputs {
    ArtcraftGptImage2p5CostInputs { quality, aspect_ratio, resolution, num_reference_images, num_images }
  }
}

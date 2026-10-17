use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::CommonAspectRatio;
use artcraft_api_defs::generate::image::text::generate_flux_pro_11_text_to_image::GenerateFluxPro11TextToImageAspectRatio;

pub fn aspect_ratio_to_artcraft_flux_pro_1p1(aspect_ratio: CommonAspectRatio) -> GenerateFluxPro11TextToImageAspectRatio {
  match aspect_ratio {
    // Exact
    CommonAspectRatio::Square => GenerateFluxPro11TextToImageAspectRatio::Square,
    CommonAspectRatio::WideFourByThree => GenerateFluxPro11TextToImageAspectRatio::LandscapeFourByThree,
    CommonAspectRatio::WideSixteenByNine => GenerateFluxPro11TextToImageAspectRatio::LandscapeSixteenByNine,
    CommonAspectRatio::TallThreeByFour => GenerateFluxPro11TextToImageAspectRatio::PortraitThreeByFour,
    CommonAspectRatio::TallNineBySixteen => GenerateFluxPro11TextToImageAspectRatio::PortraitNineBySixteen,

    // Non-matching aspect ratios, use closest neighbor
    // FIX: 4:5 is a portrait ratio (0.8); it used to map to LandscapeFourByThree, flipping the image's orientation.
    CommonAspectRatio::TallFourByFive => GenerateFluxPro11TextToImageAspectRatio::PortraitThreeByFour,
    CommonAspectRatio::TallNineByTwentyOne => GenerateFluxPro11TextToImageAspectRatio::PortraitNineBySixteen,
    CommonAspectRatio::TallTwoByThree => GenerateFluxPro11TextToImageAspectRatio::PortraitThreeByFour,
    // FIX: 5:4 is a landscape ratio (1.25); it used to map to PortraitThreeByFour, flipping the image's orientation.
    CommonAspectRatio::WideFiveByFour => GenerateFluxPro11TextToImageAspectRatio::LandscapeFourByThree,
    CommonAspectRatio::WideThreeByTwo => GenerateFluxPro11TextToImageAspectRatio::LandscapeFourByThree,
    CommonAspectRatio::WideTwentyOneByNine => GenerateFluxPro11TextToImageAspectRatio::LandscapeSixteenByNine,

    // Best match
    CommonAspectRatio::SquareHd => GenerateFluxPro11TextToImageAspectRatio::Square,

    // Special
    CommonAspectRatio::Auto
    | CommonAspectRatio::Auto2k
    | CommonAspectRatio::Auto4k => GenerateFluxPro11TextToImageAspectRatio::Square,

    // Semantic values
    CommonAspectRatio::Wide => GenerateFluxPro11TextToImageAspectRatio::LandscapeSixteenByNine,
    CommonAspectRatio::Tall => GenerateFluxPro11TextToImageAspectRatio::PortraitNineBySixteen,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::{
    all_common_aspect_ratios, tall_common_aspect_ratios, wide_common_aspect_ratios,
  };

  /// Runs the converter and returns the serialized wire string of the result (the target enum has no PartialEq).
  fn convert(ratio: CommonAspectRatio) -> String {
    serde_json::to_value(aspect_ratio_to_artcraft_flux_pro_1p1(ratio)).unwrap().as_str().unwrap().to_string()
  }

  #[test]
  fn exact_matches_keep_their_ratio() {
    // Ratios the model supports natively must map 1:1.
    assert_eq!(convert(CommonAspectRatio::Square), "square");
    assert_eq!(convert(CommonAspectRatio::WideFourByThree), "landscape_four_by_three");
    assert_eq!(convert(CommonAspectRatio::WideSixteenByNine), "landscape_sixteen_by_nine");
    assert_eq!(convert(CommonAspectRatio::TallThreeByFour), "portrait_three_by_four");
    assert_eq!(convert(CommonAspectRatio::TallNineBySixteen), "portrait_nine_by_sixteen");
  }

  #[test]
  fn wide_inputs_never_map_to_portrait() {
    // A landscape request must never come back as a portrait image.
    for ratio in wide_common_aspect_ratios() {
      assert!(convert(ratio).starts_with("landscape_"), "{:?} -> {}", ratio, convert(ratio));
    }
  }

  #[test]
  fn tall_inputs_never_map_to_landscape() {
    // A portrait request must never come back as a landscape image.
    for ratio in tall_common_aspect_ratios() {
      assert!(convert(ratio).starts_with("portrait_"), "{:?} -> {}", ratio, convert(ratio));
    }
  }

  #[test]
  fn four_by_five_uses_nearest_portrait() {
    // 4:5 = 0.8, nearest supported option is 3:4 portrait (0.75), not a landscape ratio.
    assert_eq!(convert(CommonAspectRatio::TallFourByFive), "portrait_three_by_four");
  }

  #[test]
  fn five_by_four_uses_nearest_landscape() {
    // 5:4 = 1.25, nearest supported option is 4:3 landscape (1.33), not a portrait ratio.
    assert_eq!(convert(CommonAspectRatio::WideFiveByFour), "landscape_four_by_three");
  }

  #[test]
  fn other_unsupported_ratios_use_closest_neighbor() {
    assert_eq!(convert(CommonAspectRatio::TallNineByTwentyOne), "portrait_nine_by_sixteen");
    assert_eq!(convert(CommonAspectRatio::TallTwoByThree), "portrait_three_by_four");
    assert_eq!(convert(CommonAspectRatio::WideThreeByTwo), "landscape_four_by_three");
    assert_eq!(convert(CommonAspectRatio::WideTwentyOneByNine), "landscape_sixteen_by_nine");
  }

  #[test]
  fn square_hd_and_auto_values_fall_back_to_square() {
    // This model has no SquareHd option, so it collapses to plain square along with every Auto flavor.
    assert_eq!(convert(CommonAspectRatio::SquareHd), "square");
    assert_eq!(convert(CommonAspectRatio::Auto), "square");
    assert_eq!(convert(CommonAspectRatio::Auto2k), "square");
    assert_eq!(convert(CommonAspectRatio::Auto4k), "square");
  }

  #[test]
  fn semantic_wide_and_tall_use_sixteen_nine_buckets() {
    assert_eq!(convert(CommonAspectRatio::Wide), "landscape_sixteen_by_nine");
    assert_eq!(convert(CommonAspectRatio::Tall), "portrait_nine_by_sixteen");
  }

  #[test]
  fn every_input_maps_to_a_supported_wire_value() {
    // The full domain must land inside the set of strings the API accepts.
    let supported = [
      "square", "landscape_four_by_three", "landscape_sixteen_by_nine",
      "portrait_three_by_four", "portrait_nine_by_sixteen",
    ];
    for ratio in all_common_aspect_ratios() {
      assert!(supported.contains(&convert(ratio).as_str()), "{:?} -> {}", ratio, convert(ratio));
    }
  }
}

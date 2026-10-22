use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::CommonAspectRatio;
use artcraft_api_defs::generate::image::text::generate_flux_1_dev_text_to_image::GenerateFlux1DevTextToImageAspectRatio;

pub fn aspect_ratio_to_artcraft_flux_1_dev(aspect_ratio: CommonAspectRatio) -> GenerateFlux1DevTextToImageAspectRatio {
  match aspect_ratio {
    // Exact
    CommonAspectRatio::Square => GenerateFlux1DevTextToImageAspectRatio::Square,
    CommonAspectRatio::SquareHd => GenerateFlux1DevTextToImageAspectRatio::SquareHd,
    CommonAspectRatio::WideFourByThree => GenerateFlux1DevTextToImageAspectRatio::LandscapeFourByThree,
    CommonAspectRatio::WideSixteenByNine => GenerateFlux1DevTextToImageAspectRatio::LandscapeSixteenByNine,
    CommonAspectRatio::TallThreeByFour => GenerateFlux1DevTextToImageAspectRatio::PortraitThreeByFour,
    CommonAspectRatio::TallNineBySixteen => GenerateFlux1DevTextToImageAspectRatio::PortraitNineBySixteen,

    // Non-matching aspect ratios, use closest neighbor
    CommonAspectRatio::TallFourByFive => GenerateFlux1DevTextToImageAspectRatio::PortraitThreeByFour,
    CommonAspectRatio::TallNineByTwentyOne => GenerateFlux1DevTextToImageAspectRatio::PortraitNineBySixteen,
    CommonAspectRatio::TallTwoByThree => GenerateFlux1DevTextToImageAspectRatio::PortraitThreeByFour,
    CommonAspectRatio::WideFiveByFour => GenerateFlux1DevTextToImageAspectRatio::LandscapeFourByThree,
    CommonAspectRatio::WideThreeByTwo => GenerateFlux1DevTextToImageAspectRatio::LandscapeFourByThree,
    CommonAspectRatio::WideTwentyOneByNine => GenerateFlux1DevTextToImageAspectRatio::LandscapeSixteenByNine,

    // Special
    CommonAspectRatio::Auto
    | CommonAspectRatio::Auto2k
    | CommonAspectRatio::Auto4k => GenerateFlux1DevTextToImageAspectRatio::Square,

    // Semantic values
    CommonAspectRatio::Wide => GenerateFlux1DevTextToImageAspectRatio::LandscapeSixteenByNine,
    CommonAspectRatio::Tall => GenerateFlux1DevTextToImageAspectRatio::PortraitNineBySixteen,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn convert(ratio: CommonAspectRatio) -> String {
    serde_json::to_value(aspect_ratio_to_artcraft_flux_1_dev(ratio)).unwrap().as_str().unwrap().to_string()
  }

  #[test]
  fn tall_four_by_five_stays_portrait() {
    assert_eq!(convert(CommonAspectRatio::TallFourByFive), "portrait_three_by_four");
  }

  #[test]
  fn wide_five_by_four_stays_landscape() {
    assert_eq!(convert(CommonAspectRatio::WideFiveByFour), "landscape_four_by_three");
  }
}

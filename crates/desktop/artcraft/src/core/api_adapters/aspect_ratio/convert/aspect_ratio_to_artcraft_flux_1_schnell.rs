use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::CommonAspectRatio;
use artcraft_api_defs::generate::image::text::generate_flux_1_schnell_text_to_image::GenerateFlux1SchnellTextToImageAspectRatio;

pub fn aspect_ratio_to_artcraft_flux_1_schnell(aspect_ratio: CommonAspectRatio) -> GenerateFlux1SchnellTextToImageAspectRatio {
  match aspect_ratio {
    // Exact
    CommonAspectRatio::Square => GenerateFlux1SchnellTextToImageAspectRatio::Square,
    CommonAspectRatio::SquareHd => GenerateFlux1SchnellTextToImageAspectRatio::SquareHd,
    CommonAspectRatio::WideFourByThree => GenerateFlux1SchnellTextToImageAspectRatio::LandscapeFourByThree,
    CommonAspectRatio::WideSixteenByNine => GenerateFlux1SchnellTextToImageAspectRatio::LandscapeSixteenByNine,
    CommonAspectRatio::TallThreeByFour => GenerateFlux1SchnellTextToImageAspectRatio::PortraitThreeByFour,
    CommonAspectRatio::TallNineBySixteen => GenerateFlux1SchnellTextToImageAspectRatio::PortraitNineBySixteen,

    // Non-matching aspect ratios, use closest neighbor
    CommonAspectRatio::TallFourByFive => GenerateFlux1SchnellTextToImageAspectRatio::PortraitThreeByFour,
    CommonAspectRatio::TallNineByTwentyOne => GenerateFlux1SchnellTextToImageAspectRatio::PortraitNineBySixteen,
    CommonAspectRatio::TallTwoByThree => GenerateFlux1SchnellTextToImageAspectRatio::PortraitThreeByFour,
    CommonAspectRatio::WideFiveByFour => GenerateFlux1SchnellTextToImageAspectRatio::LandscapeFourByThree,
    CommonAspectRatio::WideThreeByTwo => GenerateFlux1SchnellTextToImageAspectRatio::LandscapeFourByThree,
    CommonAspectRatio::WideTwentyOneByNine => GenerateFlux1SchnellTextToImageAspectRatio::LandscapeSixteenByNine,

    // Special
    CommonAspectRatio::Auto
    | CommonAspectRatio::Auto2k
    | CommonAspectRatio::Auto4k => GenerateFlux1SchnellTextToImageAspectRatio::Square,

    // Semantic values
    CommonAspectRatio::Wide => GenerateFlux1SchnellTextToImageAspectRatio::LandscapeSixteenByNine,
    CommonAspectRatio::Tall => GenerateFlux1SchnellTextToImageAspectRatio::PortraitNineBySixteen,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn convert(ratio: CommonAspectRatio) -> String {
    serde_json::to_value(aspect_ratio_to_artcraft_flux_1_schnell(ratio)).unwrap().as_str().unwrap().to_string()
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

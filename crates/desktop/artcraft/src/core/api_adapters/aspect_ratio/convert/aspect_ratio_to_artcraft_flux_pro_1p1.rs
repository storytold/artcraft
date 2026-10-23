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
    CommonAspectRatio::TallFourByFive => GenerateFluxPro11TextToImageAspectRatio::PortraitThreeByFour,
    CommonAspectRatio::TallNineByTwentyOne => GenerateFluxPro11TextToImageAspectRatio::PortraitNineBySixteen,
    CommonAspectRatio::TallTwoByThree => GenerateFluxPro11TextToImageAspectRatio::PortraitThreeByFour,
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

  fn convert(ratio: CommonAspectRatio) -> String {
    serde_json::to_value(aspect_ratio_to_artcraft_flux_pro_1p1(ratio)).unwrap().as_str().unwrap().to_string()
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

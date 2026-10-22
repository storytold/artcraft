use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::CommonAspectRatio;
use artcraft_api_defs::generate::image::text::generate_flux_pro_11_ultra_text_to_image::GenerateFluxPro11UltraTextToImageAspectRatio;

pub fn aspect_ratio_to_artcraft_flux_pro_1p1_ultra(aspect_ratio: CommonAspectRatio) -> GenerateFluxPro11UltraTextToImageAspectRatio {
  match aspect_ratio {
    // Exact
    CommonAspectRatio::Square => GenerateFluxPro11UltraTextToImageAspectRatio::Square,
    CommonAspectRatio::WideFourByThree => GenerateFluxPro11UltraTextToImageAspectRatio::LandscapeFourByThree,
    CommonAspectRatio::WideThreeByTwo => GenerateFluxPro11UltraTextToImageAspectRatio::LandscapeThreeByTwo,
    CommonAspectRatio::WideSixteenByNine => GenerateFluxPro11UltraTextToImageAspectRatio::LandscapeSixteenByNine,
    CommonAspectRatio::WideTwentyOneByNine => GenerateFluxPro11UltraTextToImageAspectRatio::LandscapeTwentyOneByNine,
    CommonAspectRatio::TallThreeByFour => GenerateFluxPro11UltraTextToImageAspectRatio::PortraitThreeByFour,
    CommonAspectRatio::TallTwoByThree => GenerateFluxPro11UltraTextToImageAspectRatio::PortraitTwoByThree,
    CommonAspectRatio::TallNineBySixteen => GenerateFluxPro11UltraTextToImageAspectRatio::PortraitNineBySixteen,
    CommonAspectRatio::TallNineByTwentyOne => GenerateFluxPro11UltraTextToImageAspectRatio::PortraitNineByTwentyOne,

    // Non-matching aspect ratios, use closest neighbor
    CommonAspectRatio::WideFiveByFour => GenerateFluxPro11UltraTextToImageAspectRatio::LandscapeFourByThree,
    CommonAspectRatio::TallFourByFive => GenerateFluxPro11UltraTextToImageAspectRatio::PortraitThreeByFour,

    // Best match
    CommonAspectRatio::SquareHd => GenerateFluxPro11UltraTextToImageAspectRatio::Square,
    
    // Special
    CommonAspectRatio::Auto
    | CommonAspectRatio::Auto2k
    | CommonAspectRatio::Auto4k => GenerateFluxPro11UltraTextToImageAspectRatio::Square,
    
    // Semantic values
    CommonAspectRatio::Wide => GenerateFluxPro11UltraTextToImageAspectRatio::LandscapeSixteenByNine,
    CommonAspectRatio::Tall => GenerateFluxPro11UltraTextToImageAspectRatio::PortraitNineBySixteen,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn convert(ratio: CommonAspectRatio) -> String {
    serde_json::to_value(aspect_ratio_to_artcraft_flux_pro_1p1_ultra(ratio)).unwrap().as_str().unwrap().to_string()
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

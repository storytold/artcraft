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
    CommonAspectRatio::TallFourByFive => GenerateFluxPro11TextToImageAspectRatio::LandscapeFourByThree,
    CommonAspectRatio::TallNineByTwentyOne => GenerateFluxPro11TextToImageAspectRatio::PortraitNineBySixteen,
    CommonAspectRatio::TallTwoByThree => GenerateFluxPro11TextToImageAspectRatio::PortraitThreeByFour,
    CommonAspectRatio::WideFiveByFour => GenerateFluxPro11TextToImageAspectRatio::PortraitThreeByFour,
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

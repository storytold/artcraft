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
    CommonAspectRatio::TallFourByFive => GenerateFlux1DevTextToImageAspectRatio::LandscapeFourByThree,
    CommonAspectRatio::TallNineByTwentyOne => GenerateFlux1DevTextToImageAspectRatio::PortraitNineBySixteen,
    CommonAspectRatio::TallTwoByThree => GenerateFlux1DevTextToImageAspectRatio::PortraitThreeByFour,
    CommonAspectRatio::WideFiveByFour => GenerateFlux1DevTextToImageAspectRatio::PortraitThreeByFour,
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

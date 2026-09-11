use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::CommonAspectRatio;
use artcraft_api_defs::generate::image::multi_function::gpt_image_1p5_multi_function_image_gen::GptImage1p5MultiFunctionImageGenSize;

pub fn aspect_ratio_to_artcraft_gpt_image_1p5(aspect_ratio: CommonAspectRatio) -> GptImage1p5MultiFunctionImageGenSize {
  match aspect_ratio {
    // Exact
    CommonAspectRatio::Square => GptImage1p5MultiFunctionImageGenSize::Square,
    CommonAspectRatio::Wide => GptImage1p5MultiFunctionImageGenSize::Wide,
    CommonAspectRatio::Tall => GptImage1p5MultiFunctionImageGenSize::Tall,

    // Non-matching
    CommonAspectRatio::Auto
    | CommonAspectRatio::Auto2k
    | CommonAspectRatio::Auto4k => GptImage1p5MultiFunctionImageGenSize::Square,

    // Mismatch - square
    CommonAspectRatio::SquareHd => GptImage1p5MultiFunctionImageGenSize::Square,

    // Mismatch - wide
    CommonAspectRatio::WideThreeByTwo
    | CommonAspectRatio::WideFiveByFour
    | CommonAspectRatio::WideFourByThree
    | CommonAspectRatio::WideSixteenByNine
    | CommonAspectRatio::WideTwentyOneByNine => GptImage1p5MultiFunctionImageGenSize::Wide,

    // Mismatch - tall
    CommonAspectRatio::TallTwoByThree
    | CommonAspectRatio::TallFourByFive
    | CommonAspectRatio::TallThreeByFour
    | CommonAspectRatio::TallNineBySixteen
    | CommonAspectRatio::TallNineByTwentyOne => GptImage1p5MultiFunctionImageGenSize::Tall,
  }
}

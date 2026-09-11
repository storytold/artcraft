use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::CommonAspectRatio;
use openai_sora_client::requests::image_gen::common::ImageSize;

pub fn aspect_ratio_to_sora_native_gpt_image_1(aspect_ratio: CommonAspectRatio) -> ImageSize {
  match aspect_ratio {
    // Exact
    CommonAspectRatio::Square => ImageSize::Square,
    CommonAspectRatio::Wide => ImageSize::Wide,
    CommonAspectRatio::Tall => ImageSize::Tall,

    // Non-matching
    CommonAspectRatio::Auto
    | CommonAspectRatio::Auto2k
    | CommonAspectRatio::Auto4k => ImageSize::Square,

    // Mismatch - square
    CommonAspectRatio::SquareHd => ImageSize::Square,

    // Mismatch - wide
    CommonAspectRatio::WideThreeByTwo
    | CommonAspectRatio::WideFiveByFour
    | CommonAspectRatio::WideFourByThree
    | CommonAspectRatio::WideSixteenByNine
    | CommonAspectRatio::WideTwentyOneByNine => ImageSize::Wide,

    // Mismatch - tall
    CommonAspectRatio::TallTwoByThree
    | CommonAspectRatio::TallFourByFive
    | CommonAspectRatio::TallThreeByFour
    | CommonAspectRatio::TallNineBySixteen
    | CommonAspectRatio::TallNineByTwentyOne => ImageSize::Tall,
  }
}

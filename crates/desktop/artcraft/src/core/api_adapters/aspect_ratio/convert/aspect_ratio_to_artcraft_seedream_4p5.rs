use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::CommonAspectRatio;
use artcraft_api_defs::generate::image::multi_function::bytedance_seedream_v4p5_multi_function_image_gen::BytedanceSeedreamV4p5MultiFunctionImageGenImageSize;

pub fn aspect_ratio_to_artcraft_seedream_4p5(aspect_ratio: CommonAspectRatio) -> BytedanceSeedreamV4p5MultiFunctionImageGenImageSize {
  match aspect_ratio {
    // Exact
    CommonAspectRatio::Auto2k => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::Auto2k,
    CommonAspectRatio::Auto4k => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::Auto4k,
    CommonAspectRatio::Square => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::Square,
    CommonAspectRatio::SquareHd  => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::SquareHd,
    CommonAspectRatio::WideFourByThree => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::LandscapeFourThree,
    CommonAspectRatio::WideSixteenByNine => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::LandscapeSixteenNine,
    CommonAspectRatio::TallThreeByFour => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::PortraitFourThree,
    CommonAspectRatio::TallNineBySixteen => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::PortraitSixteenNine,

    // Non-matching aspect ratios, use closest neighbor
    CommonAspectRatio::Auto => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::Auto4k,
    CommonAspectRatio::WideFiveByFour => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::LandscapeFourThree,
    CommonAspectRatio::WideThreeByTwo => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::LandscapeFourThree,
    CommonAspectRatio::WideTwentyOneByNine => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::LandscapeSixteenNine,
    CommonAspectRatio::TallFourByFive => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::PortraitFourThree,
    CommonAspectRatio::TallTwoByThree => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::PortraitFourThree,
    CommonAspectRatio::TallNineByTwentyOne => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::PortraitSixteenNine,

    // Semantic values
    CommonAspectRatio::Wide => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::LandscapeSixteenNine,
    CommonAspectRatio::Tall => BytedanceSeedreamV4p5MultiFunctionImageGenImageSize::PortraitSixteenNine,
  }
}

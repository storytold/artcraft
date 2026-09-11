use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::CommonAspectRatio;
use artcraft_api_defs::generate::image::multi_function::bytedance_seedream_v4_multi_function_image_gen::BytedanceSeedreamV4MultiFunctionImageGenImageSize;

pub fn aspect_ratio_to_artcraft_seedream_4(aspect_ratio: CommonAspectRatio) -> BytedanceSeedreamV4MultiFunctionImageGenImageSize {
  match aspect_ratio {
    // Exact
    CommonAspectRatio::Auto => BytedanceSeedreamV4MultiFunctionImageGenImageSize::Auto,
    CommonAspectRatio::Auto2k => BytedanceSeedreamV4MultiFunctionImageGenImageSize::Auto2k,
    CommonAspectRatio::Auto4k => BytedanceSeedreamV4MultiFunctionImageGenImageSize::Auto4k,
    CommonAspectRatio::Square => BytedanceSeedreamV4MultiFunctionImageGenImageSize::Square,
    CommonAspectRatio::SquareHd  => BytedanceSeedreamV4MultiFunctionImageGenImageSize::SquareHd,
    CommonAspectRatio::WideFourByThree => BytedanceSeedreamV4MultiFunctionImageGenImageSize::LandscapeFourThree,
    CommonAspectRatio::WideSixteenByNine => BytedanceSeedreamV4MultiFunctionImageGenImageSize::LandscapeSixteenNine,
    CommonAspectRatio::TallThreeByFour => BytedanceSeedreamV4MultiFunctionImageGenImageSize::PortraitFourThree,
    CommonAspectRatio::TallNineBySixteen => BytedanceSeedreamV4MultiFunctionImageGenImageSize::PortraitSixteenNine,

    // Non-matching aspect ratios, use closest neighbor
    CommonAspectRatio::WideFiveByFour => BytedanceSeedreamV4MultiFunctionImageGenImageSize::LandscapeFourThree,
    CommonAspectRatio::WideThreeByTwo => BytedanceSeedreamV4MultiFunctionImageGenImageSize::LandscapeFourThree,
    CommonAspectRatio::WideTwentyOneByNine => BytedanceSeedreamV4MultiFunctionImageGenImageSize::LandscapeSixteenNine,
    CommonAspectRatio::TallFourByFive => BytedanceSeedreamV4MultiFunctionImageGenImageSize::PortraitFourThree,
    CommonAspectRatio::TallTwoByThree => BytedanceSeedreamV4MultiFunctionImageGenImageSize::PortraitFourThree,
    CommonAspectRatio::TallNineByTwentyOne => BytedanceSeedreamV4MultiFunctionImageGenImageSize::PortraitSixteenNine,
    
    // Semantic values
    CommonAspectRatio::Wide => BytedanceSeedreamV4MultiFunctionImageGenImageSize::LandscapeSixteenNine,
    CommonAspectRatio::Tall => BytedanceSeedreamV4MultiFunctionImageGenImageSize::PortraitSixteenNine,
  }
}

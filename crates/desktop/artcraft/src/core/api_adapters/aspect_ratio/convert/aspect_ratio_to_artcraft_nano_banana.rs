use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::CommonAspectRatio;
use artcraft_api_defs::generate::image::multi_function::nano_banana_multi_function_image_gen::NanoBananaMultiFunctionImageGenAspectRatio;

pub fn aspect_ratio_to_artcraft_nano_banana(aspect_ratio: CommonAspectRatio) -> NanoBananaMultiFunctionImageGenAspectRatio {
  match aspect_ratio {
    // Exact
    CommonAspectRatio::Square => NanoBananaMultiFunctionImageGenAspectRatio::OneByOne,
    CommonAspectRatio::WideFiveByFour => NanoBananaMultiFunctionImageGenAspectRatio::FiveByFour,
    CommonAspectRatio::WideFourByThree => NanoBananaMultiFunctionImageGenAspectRatio::FourByThree,
    CommonAspectRatio::WideThreeByTwo => NanoBananaMultiFunctionImageGenAspectRatio::ThreeByTwo,
    CommonAspectRatio::WideSixteenByNine => NanoBananaMultiFunctionImageGenAspectRatio::SixteenByNine,
    CommonAspectRatio::WideTwentyOneByNine => NanoBananaMultiFunctionImageGenAspectRatio::TwentyOneByNine,
    CommonAspectRatio::TallFourByFive => NanoBananaMultiFunctionImageGenAspectRatio::FourByFive,
    CommonAspectRatio::TallThreeByFour => NanoBananaMultiFunctionImageGenAspectRatio::ThreeByFour,
    CommonAspectRatio::TallTwoByThree => NanoBananaMultiFunctionImageGenAspectRatio::TwoByThree,
    CommonAspectRatio::TallNineBySixteen => NanoBananaMultiFunctionImageGenAspectRatio::NineBySixteen,
    // Special
    // NB: this is only for image-to-image editing, not text-to-image. 
    CommonAspectRatio::Auto
    | CommonAspectRatio::Auto2k
    | CommonAspectRatio::Auto4k => NanoBananaMultiFunctionImageGenAspectRatio::Auto,
    // NB: "9:21" value does not exist. Interpolated.
    CommonAspectRatio::TallNineByTwentyOne => NanoBananaMultiFunctionImageGenAspectRatio::NineBySixteen,
    // Semantic values
    CommonAspectRatio::Wide => NanoBananaMultiFunctionImageGenAspectRatio::SixteenByNine,
    CommonAspectRatio::Tall => NanoBananaMultiFunctionImageGenAspectRatio::NineBySixteen,
    CommonAspectRatio::SquareHd => NanoBananaMultiFunctionImageGenAspectRatio::OneByOne,
  }
}

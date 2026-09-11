use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::CommonAspectRatio;
use artcraft_api_defs::generate::image::multi_function::nano_banana_pro_multi_function_image_gen::NanoBananaProMultiFunctionImageGenAspectRatio;

pub fn aspect_ratio_to_artcraft_nano_banana_pro(aspect_ratio: CommonAspectRatio) -> NanoBananaProMultiFunctionImageGenAspectRatio {
  match aspect_ratio {
    // Exact
    CommonAspectRatio::Square => NanoBananaProMultiFunctionImageGenAspectRatio::OneByOne,
    CommonAspectRatio::WideFiveByFour => NanoBananaProMultiFunctionImageGenAspectRatio::FiveByFour,
    CommonAspectRatio::WideFourByThree => NanoBananaProMultiFunctionImageGenAspectRatio::FourByThree,
    CommonAspectRatio::WideThreeByTwo => NanoBananaProMultiFunctionImageGenAspectRatio::ThreeByTwo,
    CommonAspectRatio::WideSixteenByNine => NanoBananaProMultiFunctionImageGenAspectRatio::SixteenByNine,
    CommonAspectRatio::WideTwentyOneByNine => NanoBananaProMultiFunctionImageGenAspectRatio::TwentyOneByNine,
    CommonAspectRatio::TallFourByFive => NanoBananaProMultiFunctionImageGenAspectRatio::FourByFive,
    CommonAspectRatio::TallThreeByFour => NanoBananaProMultiFunctionImageGenAspectRatio::ThreeByFour,
    CommonAspectRatio::TallTwoByThree => NanoBananaProMultiFunctionImageGenAspectRatio::TwoByThree,
    CommonAspectRatio::TallNineBySixteen => NanoBananaProMultiFunctionImageGenAspectRatio::NineBySixteen,
    // Special
    // NB: this is only for image-to-image editing, not text-to-image. 
    CommonAspectRatio::Auto
    | CommonAspectRatio::Auto2k
    | CommonAspectRatio::Auto4k => NanoBananaProMultiFunctionImageGenAspectRatio::Auto,
    // NB: "9:21" value does not exist. Interpolated.
    CommonAspectRatio::TallNineByTwentyOne => NanoBananaProMultiFunctionImageGenAspectRatio::NineBySixteen,
    // Semantic values
    CommonAspectRatio::Wide => NanoBananaProMultiFunctionImageGenAspectRatio::SixteenByNine,
    CommonAspectRatio::Tall => NanoBananaProMultiFunctionImageGenAspectRatio::NineBySixteen,
    CommonAspectRatio::SquareHd => NanoBananaProMultiFunctionImageGenAspectRatio::OneByOne,
  }
}

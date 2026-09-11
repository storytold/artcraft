use crate::core::api_adapters::resolution::common_resolution::CommonResolution;
use artcraft_api_defs::generate::image::multi_function::nano_banana_pro_multi_function_image_gen::NanoBananaProMultiFunctionImageGenImageResolution;

pub fn resolution_to_artcraft_nano_banana_pro(resolution: CommonResolution) -> NanoBananaProMultiFunctionImageGenImageResolution {
  match resolution {
    CommonResolution::OneK => NanoBananaProMultiFunctionImageGenImageResolution::OneK,
    CommonResolution::TwoK => NanoBananaProMultiFunctionImageGenImageResolution::TwoK,
    // NB: ThreeK doesn't exist in Nano Banana Pro, use FourK as nearest higher resolution
    CommonResolution::ThreeK => NanoBananaProMultiFunctionImageGenImageResolution::FourK,
    CommonResolution::FourK => NanoBananaProMultiFunctionImageGenImageResolution::FourK,
    // Fall back to nearest supported resolution
    CommonResolution::HalfK => NanoBananaProMultiFunctionImageGenImageResolution::OneK,
    CommonResolution::FourEightyP => NanoBananaProMultiFunctionImageGenImageResolution::OneK,
    CommonResolution::SevenTwentyP => NanoBananaProMultiFunctionImageGenImageResolution::OneK,
    CommonResolution::TenEightyP => NanoBananaProMultiFunctionImageGenImageResolution::OneK,
  }
}

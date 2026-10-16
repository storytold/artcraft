//! The router's image models that OpenRouter runs, with each one's slug and the options it
//! accepts (from `GET https://openrouter.ai/api/v1/images/models`).

use openrouter_client::api::generate_image::{OpenRouterAspectRatio, OpenRouterQuality, OpenRouterResolution};

use crate::api::router_image_model::RouterImageModel;

use OpenRouterAspectRatio::{Auto, FiveByFour, FourByFive, FourByThree, NineBySixteen, NineByTwentyOne, OneByOne, SixteenByNine, ThreeByFour, ThreeByTwo, TwentyOneByNine, TwoByThree};
use OpenRouterQuality::{High, Low, Max, Medium, XHigh};
use OpenRouterResolution::{FourK, HalfK, OneK, TwoK};

const GEMINI_ASPECT_RATIOS: &[OpenRouterAspectRatio] = &[OneByOne, TwoByThree, ThreeByTwo, ThreeByFour, FourByThree, FourByFive, FiveByFour, NineBySixteen, SixteenByNine, TwentyOneByNine];
const GPT_IMAGE_ASPECT_RATIOS: &[OpenRouterAspectRatio] = &[OneByOne, ThreeByTwo, TwoByThree, FourByThree, ThreeByFour, SixteenByNine, NineBySixteen, TwentyOneByNine, Auto];
const SEEDREAM_ASPECT_RATIOS: &[OpenRouterAspectRatio] = &[OneByOne, TwoByThree, ThreeByTwo, ThreeByFour, FourByThree, FourByFive, FiveByFour, NineBySixteen, SixteenByNine, NineByTwentyOne, TwentyOneByNine, Auto];
const GPT_IMAGE_QUALITIES: &[OpenRouterQuality] = &[OpenRouterQuality::Auto, Low, Medium, High];
const GPT_IMAGE_2P5_QUALITIES: &[OpenRouterQuality] = &[OpenRouterQuality::Auto, Low, Medium, High, XHigh, Max];

/// What a model accepts on OpenRouter. Empty lists mean the option isn't supported.
#[derive(Debug, PartialEq)]
pub struct OpenRouterImageModel {
  pub slug: &'static str,
  /// The most images one request can make (`n`).
  pub max_images_per_request: u8,
  pub max_reference_images: u8,
  pub resolutions: &'static [OpenRouterResolution],
  pub aspect_ratios: &'static [OpenRouterAspectRatio],
  pub qualities: &'static [OpenRouterQuality],
}

/// The OpenRouter model for `model`, or `None` when OpenRouter doesn't run it.
pub fn openrouter_image_model(model: RouterImageModel) -> Option<&'static OpenRouterImageModel> {
  let spec = match model {
    RouterImageModel::NanoBanana => &NANO_BANANA,
    RouterImageModel::NanoBanana2 => &NANO_BANANA_2,
    RouterImageModel::NanoBananaPro => &NANO_BANANA_PRO,
    RouterImageModel::GptImage1 => &GPT_IMAGE_1,
    RouterImageModel::GptImage2 => &GPT_IMAGE_2,
    RouterImageModel::GptImage2p5Flare => &GPT_IMAGE_2P5_FLARE,
    RouterImageModel::GptImage2p5Sunburst => &GPT_IMAGE_2P5_SUNBURST,
    RouterImageModel::Seedream4p5 => &SEEDREAM_4P5,
    RouterImageModel::Seedream5Lite => &SEEDREAM_5_LITE,
    RouterImageModel::Seedream5p0Pro => &SEEDREAM_5P0_PRO,
    _ => return None,
  };
  Some(spec)
}

const NANO_BANANA: OpenRouterImageModel = OpenRouterImageModel { slug: "google/gemini-2.5-flash-image", max_images_per_request: 1, max_reference_images: 3, resolutions: &[], aspect_ratios: GEMINI_ASPECT_RATIOS, qualities: &[] };
const NANO_BANANA_2: OpenRouterImageModel = OpenRouterImageModel { slug: "google/gemini-3.1-flash-image", max_images_per_request: 1, max_reference_images: 14, resolutions: &[HalfK, OneK, TwoK, FourK], aspect_ratios: GEMINI_ASPECT_RATIOS, qualities: &[] };
const NANO_BANANA_PRO: OpenRouterImageModel = OpenRouterImageModel { slug: "google/gemini-3-pro-image", max_images_per_request: 1, max_reference_images: 14, resolutions: &[OneK, TwoK, FourK], aspect_ratios: GEMINI_ASPECT_RATIOS, qualities: &[] };
const GPT_IMAGE_1: OpenRouterImageModel = OpenRouterImageModel { slug: "openai/gpt-image-1", max_images_per_request: 10, max_reference_images: 16, resolutions: &[], aspect_ratios: &[OneByOne, ThreeByTwo, TwoByThree, Auto], qualities: GPT_IMAGE_QUALITIES };
const GPT_IMAGE_2: OpenRouterImageModel = OpenRouterImageModel { slug: "openai/gpt-image-2", max_images_per_request: 10, max_reference_images: 16, resolutions: &[], aspect_ratios: GPT_IMAGE_ASPECT_RATIOS, qualities: GPT_IMAGE_QUALITIES };
const GPT_IMAGE_2P5_FLARE: OpenRouterImageModel = OpenRouterImageModel { slug: "openai/gpt-image-2.5-flare", max_images_per_request: 10, max_reference_images: 16, resolutions: &[], aspect_ratios: GPT_IMAGE_ASPECT_RATIOS, qualities: GPT_IMAGE_2P5_QUALITIES };
const GPT_IMAGE_2P5_SUNBURST: OpenRouterImageModel = OpenRouterImageModel { slug: "openai/gpt-image-2.5-sunburst", max_images_per_request: 10, max_reference_images: 16, resolutions: &[], aspect_ratios: GPT_IMAGE_ASPECT_RATIOS, qualities: GPT_IMAGE_2P5_QUALITIES };
const SEEDREAM_4P5: OpenRouterImageModel = OpenRouterImageModel { slug: "bytedance-seed/seedream-4.5", max_images_per_request: 10, max_reference_images: 14, resolutions: &[OneK, TwoK, FourK], aspect_ratios: SEEDREAM_ASPECT_RATIOS, qualities: &[] };
const SEEDREAM_5_LITE: OpenRouterImageModel = OpenRouterImageModel { slug: "bytedance-seed/seedream-5-0-lite", max_images_per_request: 4, max_reference_images: 14, resolutions: &[TwoK, FourK], aspect_ratios: SEEDREAM_ASPECT_RATIOS, qualities: &[] };
const SEEDREAM_5P0_PRO: OpenRouterImageModel = OpenRouterImageModel { slug: "bytedance-seed/seedream-5-0-pro", max_images_per_request: 1, max_reference_images: 14, resolutions: &[OneK, TwoK], aspect_ratios: SEEDREAM_ASPECT_RATIOS, qualities: &[] };

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn supported_models_have_slugs() {
    assert_eq!(openrouter_image_model(RouterImageModel::NanoBananaPro).map(|m| m.slug), Some("google/gemini-3-pro-image"));
    assert_eq!(openrouter_image_model(RouterImageModel::Seedream4p5).map(|m| m.slug), Some("bytedance-seed/seedream-4.5"));
    assert_eq!(openrouter_image_model(RouterImageModel::Flux1Dev), None);
    assert_eq!(openrouter_image_model(RouterImageModel::Midjourney8), None);
  }
}

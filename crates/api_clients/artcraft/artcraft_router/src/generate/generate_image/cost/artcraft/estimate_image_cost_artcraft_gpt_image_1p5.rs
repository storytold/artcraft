use artcraft_api_defs::generate::image::multi_function::gpt_image_1p5_multi_function_image_gen::{
  GptImage1p5MultiFunctionImageGenNumImages, GptImage1p5MultiFunctionImageGenQuality,
  GptImage1p5MultiFunctionImageGenSize,
};

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_gpt_image_1p5::PlanArtcraftGptImage1p5;

pub(crate) fn estimate_image_cost_artcraft_gpt_image_1p5(
  plan: &PlanArtcraftGptImage1p5<'_>,
) -> ImageGenerationCostEstimate {
  // Pricing varies by quality and image size. 1 credit = 1 USD cent.
  // Low:    $0.01/image (any size)
  // Medium: $0.03/image (square/unset), $0.05/image (wide or tall)
  // High:   $0.13/image (square/unset), $0.20/image (wide or tall)
  //
  // From Fal (text to image) -
  //
  // Your request will cost different amounts based on the number of images, quality, and size.
  //
  //     You will be charged $0.005 per 1,000 input text tokens. One word is roughly 4 tokens.
  //     You will be charged $0.010 per 1,000 output text tokens. The model will consume tokens reasoning about your prompt based on it's complexity.
  //     For low quality, you will be charged $0.009 for 1024x1024 or $0.013 for any other size per image.
  //     For medium quality, you will be charged $0.034 for 1024x1024, $0.051 for 1024x1536 and $0.050 for 1536x1024 per image.
  //     For high quality, you will be charged $0.133 for 1024x1024, $0.200 for 1024x1536 or $0.199 for 1536x1024 per image.
  //
  // From Fal (image to image) -
  //
  // Your request will cost different amounts based on the number of images, quality, and size.
  //
  //     You will be charged $0.005 per 1,000 input text tokens. One word is roughly 4 tokens.
  //     You will be charged $0.008 per 1,000 input image tokens. One 1024x1024 image is roughly 135 tokens in low fidelity mode, or 3,050 tokens in high fidelity mode.
  //     You will be charged $0.010 per 1,000 output text tokens. The model will consume tokens reasoning about your prompt based on it's complexity.
  //     For low quality, you will be charged $0.009 for 1024x1024 or $0.013 for any other size per image.
  //     For medium quality, you will be charged $0.034 for 1024x1024, $0.051 for 1024x1536 and $0.050 for 1536x1024 per image.
  //     For high quality, you will be charged $0.133 for 1024x1024, $0.200 for 1024x1536 or $0.199 for 1536x1024 per image.
  //
  let cost_per_image: u64 = match plan.quality {
    GptImage1p5MultiFunctionImageGenQuality::Low => 1,
    GptImage1p5MultiFunctionImageGenQuality::Medium => match plan.image_size {
      Some(GptImage1p5MultiFunctionImageGenSize::Square) | None => 3,
      Some(GptImage1p5MultiFunctionImageGenSize::Wide) | Some(GptImage1p5MultiFunctionImageGenSize::Tall) => 5,
    },
    GptImage1p5MultiFunctionImageGenQuality::High => match plan.image_size {
      Some(GptImage1p5MultiFunctionImageGenSize::Square) | None => 13,
      Some(GptImage1p5MultiFunctionImageGenSize::Wide) | Some(GptImage1p5MultiFunctionImageGenSize::Tall) => 20,
    },
  };

  let num_images: u64 = match plan.num_images {
    GptImage1p5MultiFunctionImageGenNumImages::One => 1,
    GptImage1p5MultiFunctionImageGenNumImages::Two => 2,
    GptImage1p5MultiFunctionImageGenNumImages::Three => 3,
    GptImage1p5MultiFunctionImageGenNumImages::Four => 4,
  };

  let cost_in_usd_cents = cost_per_image * num_images;

  ImageGenerationCostEstimate {
    cost_in_credits: Some(cost_in_usd_cents),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_image_model::CommonImageModel;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request::GenerateImageRequest;

  fn estimate_usd_cents(image_batch_count: u16, aspect_ratio: Option<CommonAspectRatio>) -> u64 {
    let request = GenerateImageRequest {
      model: CommonImageModel::GptImage1p5,
      provider: Provider::Artcraft,
      prompt: None,
      image_inputs: None,
      resolution: None,
      aspect_ratio,
      image_batch_count: Some(image_batch_count),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
    };
    request.build()
      .expect("build should succeed")
      .estimate_costs()
      .cost_in_usd_cents
      .expect("cost_in_usd_cents should be present")
  }

  #[test]
  fn test_estimate_cost_medium_square() {
    // Default quality (Medium) + square/unset size = 3 cents each
    assert_eq!(estimate_usd_cents(1, None), 3);
    assert_eq!(estimate_usd_cents(1, Some(CommonAspectRatio::Square)), 3);
    assert_eq!(estimate_usd_cents(2, Some(CommonAspectRatio::Square)), 6);
    assert_eq!(estimate_usd_cents(3, Some(CommonAspectRatio::Square)), 9);
    assert_eq!(estimate_usd_cents(4, Some(CommonAspectRatio::Square)), 12);
  }

  #[test]
  fn test_estimate_cost_medium_wide() {
    // Medium + wide = 5 cents each
    assert_eq!(estimate_usd_cents(1, Some(CommonAspectRatio::WideSixteenByNine)), 5);
    assert_eq!(estimate_usd_cents(4, Some(CommonAspectRatio::WideSixteenByNine)), 20);
  }

  #[test]
  fn test_estimate_cost_medium_tall() {
    // Medium + tall = 5 cents each
    assert_eq!(estimate_usd_cents(1, Some(CommonAspectRatio::TallNineBySixteen)), 5);
    assert_eq!(estimate_usd_cents(4, Some(CommonAspectRatio::TallNineBySixteen)), 20);
  }
}

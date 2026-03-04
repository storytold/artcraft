use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use artcraft_api_defs::generate::image::multi_function::gpt_image_1p5_multi_function_image_gen::{
  GptImage1p5MultiFunctionImageGenNumImages, GptImage1p5MultiFunctionImageGenQuality,
  GptImage1p5MultiFunctionImageGenSize,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftGptImage1p5<'a> {
  pub prompt: Option<&'a str>,
  /// Input images for image editing. None means text-to-image mode.
  pub image_inputs: Option<&'a Vec<MediaFileToken>>,
  pub image_size: Option<GptImage1p5MultiFunctionImageGenSize>,
  /// Quality defaults to Medium when not specified in the request.
  pub quality: GptImage1p5MultiFunctionImageGenQuality,
  pub num_images: GptImage1p5MultiFunctionImageGenNumImages,
  pub idempotency_token: String,
}

pub fn plan_generate_image_artcraft_gpt_image_1p5<'a>(
  request: &'a GenerateImageRequest<'a>,
) -> Result<PlanArtcraftGptImage1p5<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let image_inputs = resolve_image_list_ref(request.image_inputs)?;
  let image_size = plan_image_size(request.aspect_ratio, strategy)?;
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(PlanArtcraftGptImage1p5 {
    prompt: request.prompt,
    image_inputs,
    image_size,
    quality: GptImage1p5MultiFunctionImageGenQuality::Medium,
    num_images,
    idempotency_token: request.get_or_generate_idempotency_token(),
  })
}

fn resolve_image_list_ref<'a>(
  image_list_ref: Option<ImageListRef<'a>>,
) -> Result<Option<&'a Vec<MediaFileToken>>, ArtcraftRouterError> {
  match image_list_ref {
    None => Ok(None),
    Some(ImageListRef::MediaFileTokens(tokens)) => Ok(Some(tokens)),
    Some(ImageListRef::Urls(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
}

// GPT Image 1.5 image sizes: Square (1024x1024), Wide (1536x1024), Tall (1024x1536).
// All 17 CommonAspectRatio variants map to one of these three sizes or None.
// Auto aspect ratios yield None (let the API choose its default).
fn plan_image_size(
  aspect_ratio: Option<CommonAspectRatio>,
  _strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<GptImage1p5MultiFunctionImageGenSize>, ArtcraftRouterError> {
  use GptImage1p5MultiFunctionImageGenSize as GS;
  match aspect_ratio {
    // No preference or auto — let the model use its default
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(None),

    // Square
    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Some(GS::Square)),

    // Wide
    Some(CommonAspectRatio::WideThreeByTwo)
    | Some(CommonAspectRatio::WideFourByThree)
    | Some(CommonAspectRatio::WideFiveByFour)
    | Some(CommonAspectRatio::WideSixteenByNine)
    | Some(CommonAspectRatio::WideTwentyOneByNine)
    | Some(CommonAspectRatio::Wide) => Ok(Some(GS::Wide)),

    // Tall
    Some(CommonAspectRatio::TallTwoByThree)
    | Some(CommonAspectRatio::TallThreeByFour)
    | Some(CommonAspectRatio::TallFourByFive)
    | Some(CommonAspectRatio::TallNineBySixteen)
    | Some(CommonAspectRatio::TallNineByTwentyOne)
    | Some(CommonAspectRatio::Tall) => Ok(Some(GS::Tall)),
  }
}

// GPT Image 1.5 supports 1, 2, 3, and 4 images.

fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<GptImage1p5MultiFunctionImageGenNumImages, ArtcraftRouterError> {
  use GptImage1p5MultiFunctionImageGenNumImages as GN;
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(GN::One),
    2 => Ok(GN::Two),
    3 => Ok(GN::Three),
    4 => Ok(GN::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(GN::Four),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(GN::Four),
    },
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::image_list_ref::ImageListRef;
  use crate::errors::artcraft_router_error::ArtcraftRouterError;
  use crate::errors::client_error::ClientError;
  use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
  use crate::test_helpers::base_gpt_image_1p5_image_request;
  use artcraft_api_defs::generate::image::multi_function::gpt_image_1p5_multi_function_image_gen::{
    GptImage1p5MultiFunctionImageGenNumImages as GN,
    GptImage1p5MultiFunctionImageGenQuality,
    GptImage1p5MultiFunctionImageGenSize as GS,
  };

  // ── Image size (aspect ratio mapping) ────────────────────────────────────

  #[test]
  fn image_size_none_is_none() {
    let request = GenerateImageRequest { aspect_ratio: None, ..base_gpt_image_1p5_image_request() };
    let ImageGenerationPlan::ArtcraftGptImage1p5(plan) = request.build().unwrap() else { panic!("expected ArtcraftGptImage1p5") };
    assert!(plan.image_size.is_none());
  }

  #[test]
  fn image_size_auto_variants_yield_none() {
    for auto_ar in [CommonAspectRatio::Auto, CommonAspectRatio::Auto2k, CommonAspectRatio::Auto4k] {
      let request = GenerateImageRequest { aspect_ratio: Some(auto_ar), ..base_gpt_image_1p5_image_request() };
      let ImageGenerationPlan::ArtcraftGptImage1p5(plan) = request.build().unwrap() else { panic!("expected ArtcraftGptImage1p5") };
      assert!(plan.image_size.is_none(), "expected None for {:?}", auto_ar);
    }
  }

  #[test]
  fn image_size_square_variants() {
    for ar in [CommonAspectRatio::Square, CommonAspectRatio::SquareHd] {
      let request = GenerateImageRequest { aspect_ratio: Some(ar), ..base_gpt_image_1p5_image_request() };
      let ImageGenerationPlan::ArtcraftGptImage1p5(plan) = request.build().unwrap() else { panic!("expected ArtcraftGptImage1p5") };
      assert!(matches!(plan.image_size, Some(GS::Square)), "expected Square for {:?}", ar);
    }
  }

  #[test]
  fn image_size_wide_variants() {
    let wide_ars = [
      CommonAspectRatio::WideThreeByTwo,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::WideFiveByFour,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::WideTwentyOneByNine,
      CommonAspectRatio::Wide,
    ];
    for ar in wide_ars {
      let request = GenerateImageRequest { aspect_ratio: Some(ar), ..base_gpt_image_1p5_image_request() };
      let ImageGenerationPlan::ArtcraftGptImage1p5(plan) = request.build().unwrap() else { panic!("expected ArtcraftGptImage1p5") };
      assert!(matches!(plan.image_size, Some(GS::Wide)), "expected Wide for {:?}", ar);
    }
  }

  #[test]
  fn image_size_tall_variants() {
    let tall_ars = [
      CommonAspectRatio::TallTwoByThree,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallFourByFive,
      CommonAspectRatio::TallNineBySixteen,
      CommonAspectRatio::TallNineByTwentyOne,
      CommonAspectRatio::Tall,
    ];
    for ar in tall_ars {
      let request = GenerateImageRequest { aspect_ratio: Some(ar), ..base_gpt_image_1p5_image_request() };
      let ImageGenerationPlan::ArtcraftGptImage1p5(plan) = request.build().unwrap() else { panic!("expected ArtcraftGptImage1p5") };
      assert!(matches!(plan.image_size, Some(GS::Tall)), "expected Tall for {:?}", ar);
    }
  }

  // ── Quality ──────────────────────────────────────────────────────────────

  #[test]
  fn quality_defaults_to_medium() {
    let request = base_gpt_image_1p5_image_request();
    let ImageGenerationPlan::ArtcraftGptImage1p5(plan) = request.build().unwrap() else { panic!("expected ArtcraftGptImage1p5") };
    assert!(matches!(plan.quality, GptImage1p5MultiFunctionImageGenQuality::Medium));
  }

  // ── Num images ──────────────────────────────────────────────────────────────

  #[test]
  fn num_images_zero_is_always_error() {
    for strategy in [
      RequestMismatchMitigationStrategy::ErrorOut,
      RequestMismatchMitigationStrategy::PayMoreUpgrade,
      RequestMismatchMitigationStrategy::PayLessDowngrade,
    ] {
      let request = GenerateImageRequest {
        image_batch_count: Some(0),
        request_mismatch_mitigation_strategy: strategy,
        ..base_gpt_image_1p5_image_request()
      };
      let result = request.build();
      assert!(
        matches!(result, Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations))),
        "expected UserRequestedZeroGenerations with {:?}", strategy,
      );
    }
  }

  #[test]
  fn num_images_direct_mapping() {
    let cases = [
      (1, GN::One),
      (2, GN::Two),
      (3, GN::Three),
      (4, GN::Four),
    ];
    for (count, expected) in cases {
      let request = GenerateImageRequest { image_batch_count: Some(count), ..base_gpt_image_1p5_image_request() };
      let ImageGenerationPlan::ArtcraftGptImage1p5(plan) = request.build().unwrap() else { panic!("expected ArtcraftGptImage1p5") };
      assert!(
        std::mem::discriminant(&plan.num_images) == std::mem::discriminant(&expected),
        "expected {:?} for count {}", expected, count,
      );
    }
  }

  #[test]
  fn num_images_out_of_range_error_out() {
    let request = GenerateImageRequest {
      image_batch_count: Some(5),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      ..base_gpt_image_1p5_image_request()
    };
    let result = request.build();
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))
    ));
  }

  #[test]
  fn num_images_out_of_range_clamps_to_four() {
    for strategy in [
      RequestMismatchMitigationStrategy::PayMoreUpgrade,
      RequestMismatchMitigationStrategy::PayLessDowngrade,
    ] {
      let request = GenerateImageRequest {
        image_batch_count: Some(5),
        request_mismatch_mitigation_strategy: strategy,
        ..base_gpt_image_1p5_image_request()
      };
      let ImageGenerationPlan::ArtcraftGptImage1p5(plan) = request.build().unwrap() else { panic!("expected ArtcraftGptImage1p5") };
      assert!(
        matches!(plan.num_images, GN::Four),
        "expected Four for count 5 with {:?}", strategy,
      );
    }
  }

  // ── Image inputs ─────────────────────────────────────────────────────────

  #[test]
  fn url_image_inputs_returns_error() {
    let urls = vec!["https://example.com/image.jpg".to_string()];
    let request = GenerateImageRequest {
      image_inputs: Some(ImageListRef::Urls(&urls)),
      ..base_gpt_image_1p5_image_request()
    };
    let result = request.build();
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    ));
  }

  #[test]
  fn no_image_inputs_is_text_to_image_mode() {
    let request = GenerateImageRequest { image_inputs: None, ..base_gpt_image_1p5_image_request() };
    let ImageGenerationPlan::ArtcraftGptImage1p5(plan) = request.build().unwrap() else { panic!("expected ArtcraftGptImage1p5") };
    assert!(plan.image_inputs.is_none());
  }

  #[test]
  fn media_token_image_inputs_is_edit_mode() {
    let tokens = vec![];
    let request = GenerateImageRequest {
      image_inputs: Some(ImageListRef::MediaFileTokens(&tokens)),
      ..base_gpt_image_1p5_image_request()
    };
    let ImageGenerationPlan::ArtcraftGptImage1p5(plan) = request.build().unwrap() else { panic!("expected ArtcraftGptImage1p5") };
    assert!(plan.image_inputs.is_some());
  }
}

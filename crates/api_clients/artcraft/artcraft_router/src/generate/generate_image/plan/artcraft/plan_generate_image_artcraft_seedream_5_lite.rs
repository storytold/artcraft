use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use artcraft_api_defs::generate::image::multi_function::bytedance_seedream_5_lite_multi_function_image_gen::{
  BytedanceSeedream5LiteMultiFunctionImageGenImageSize,
  BytedanceSeedream5LiteMultiFunctionImageGenNumImages,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftSeedream5Lite<'a> {
  pub prompt: Option<&'a str>,
  /// Input images for image editing. None means text-to-image mode.
  pub image_inputs: Option<&'a Vec<MediaFileToken>>,
  pub image_size: Option<BytedanceSeedream5LiteMultiFunctionImageGenImageSize>,
  pub num_images: BytedanceSeedream5LiteMultiFunctionImageGenNumImages,
  pub idempotency_token: String,
}

pub fn plan_generate_image_artcraft_seedream_5_lite<'a>(
  request: &'a GenerateImageRequest<'a>,
) -> Result<PlanArtcraftSeedream5Lite<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let is_edit_mode = request.image_inputs.is_some();
  let image_inputs = resolve_image_list_ref(request.image_inputs)?;
  let image_size = plan_image_size(request.aspect_ratio, is_edit_mode, strategy)?;
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(PlanArtcraftSeedream5Lite {
    prompt: request.prompt,
    image_inputs,
    image_size,
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

// Seedream 5 Lite supported image sizes:
//   Square, SquareHd
//   PortraitFourThree, PortraitSixteenNine
//   LandscapeFourThree, LandscapeSixteenNine
//   Auto2k, Auto3k (NB: 5 Lite max is auto_3K, unlike V4.5's auto_4K)
fn plan_image_size(
  aspect_ratio: Option<CommonAspectRatio>,
  is_edit_mode: bool,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<BytedanceSeedream5LiteMultiFunctionImageGenImageSize>, ArtcraftRouterError> {
  use BytedanceSeedream5LiteMultiFunctionImageGenImageSize as S;
  match aspect_ratio {
    None => Ok(None),

    // Auto: V5 has no bare Auto; fall back to Auto2k in edit mode, Square for text-to-image
    Some(CommonAspectRatio::Auto) => {
      if is_edit_mode { Ok(Some(S::Auto2k)) } else { Ok(Some(S::Square)) }
    }

    Some(CommonAspectRatio::Auto2k) => Ok(Some(S::Auto2k)),
    // 5 Lite max is auto_3K; map Auto4k down to Auto3k
    Some(CommonAspectRatio::Auto4k) => Ok(Some(S::Auto3k)),

    // Square
    Some(CommonAspectRatio::Square) => Ok(Some(S::Square)),
    Some(CommonAspectRatio::SquareHd) => Ok(Some(S::SquareHd)),

    // Wide — direct mappings
    Some(CommonAspectRatio::Wide) | Some(CommonAspectRatio::WideSixteenByNine) => Ok(Some(S::LandscapeSixteenNine)),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(S::LandscapeFourThree)),

    // Wide — no direct equivalent, nearest is LandscapeSixteenNine
    Some(unsupported @ CommonAspectRatio::WideFiveByFour)
    | Some(unsupported @ CommonAspectRatio::WideThreeByTwo)
    | Some(unsupported @ CommonAspectRatio::WideTwentyOneByNine) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(S::LandscapeSixteenNine)),
    },

    // Tall — direct mappings
    Some(CommonAspectRatio::Tall) | Some(CommonAspectRatio::TallNineBySixteen) => Ok(Some(S::PortraitSixteenNine)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(S::PortraitFourThree)),

    // Tall — no direct equivalent, nearest is PortraitSixteenNine
    Some(unsupported @ CommonAspectRatio::TallFourByFive)
    | Some(unsupported @ CommonAspectRatio::TallTwoByThree)
    | Some(unsupported @ CommonAspectRatio::TallNineByTwentyOne) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(S::PortraitSixteenNine)),
    },
  }
}

fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<BytedanceSeedream5LiteMultiFunctionImageGenNumImages, ArtcraftRouterError> {
  use BytedanceSeedream5LiteMultiFunctionImageGenNumImages as N;
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(N::One),
    2 => Ok(N::Two),
    3 => Ok(N::Three),
    4 => Ok(N::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(N::Four),
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
  use crate::test_helpers::base_seedream_5_lite_image_request;
  use artcraft_api_defs::generate::image::multi_function::bytedance_seedream_5_lite_multi_function_image_gen::{
    BytedanceSeedream5LiteMultiFunctionImageGenImageSize as S,
    BytedanceSeedream5LiteMultiFunctionImageGenNumImages as N,
  };

  #[test]
  fn image_size_none_is_none() {
    let request = GenerateImageRequest { aspect_ratio: None, ..base_seedream_5_lite_image_request() };
    let ImageGenerationPlan::ArtcraftSeedream5Lite(plan) = request.build().unwrap() else { panic!("expected ArtcraftSeedream5Lite") };
    assert!(plan.image_size.is_none());
  }

  #[test]
  fn image_size_auto_in_edit_mode_yields_auto2k() {
    let tokens = vec![];
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::Auto),
      image_inputs: Some(ImageListRef::MediaFileTokens(&tokens)),
      ..base_seedream_5_lite_image_request()
    };
    let ImageGenerationPlan::ArtcraftSeedream5Lite(plan) = request.build().unwrap() else { panic!("expected ArtcraftSeedream5Lite") };
    assert!(matches!(plan.image_size, Some(S::Auto2k)));
  }

  #[test]
  fn image_size_auto_in_text_to_image_yields_square() {
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::Auto),
      image_inputs: None,
      ..base_seedream_5_lite_image_request()
    };
    let ImageGenerationPlan::ArtcraftSeedream5Lite(plan) = request.build().unwrap() else { panic!("expected ArtcraftSeedream5Lite") };
    assert!(matches!(plan.image_size, Some(S::Square)));
  }

  #[test]
  fn auto4k_is_mapped_to_auto3k() {
    // 5 Lite only supports up to auto_3K; auto_4K is downgraded
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::Auto4k),
      ..base_seedream_5_lite_image_request()
    };
    let ImageGenerationPlan::ArtcraftSeedream5Lite(plan) = request.build().unwrap() else { panic!("expected ArtcraftSeedream5Lite") };
    assert!(matches!(plan.image_size, Some(S::Auto3k)));
  }

  #[test]
  fn num_images_direct_mapping() {
    let cases = [(1, N::One), (2, N::Two), (3, N::Three), (4, N::Four)];
    for (count, expected) in cases {
      let request = GenerateImageRequest { image_batch_count: Some(count), ..base_seedream_5_lite_image_request() };
      let ImageGenerationPlan::ArtcraftSeedream5Lite(plan) = request.build().unwrap() else { panic!("expected ArtcraftSeedream5Lite") };
      assert!(
        std::mem::discriminant(&plan.num_images) == std::mem::discriminant(&expected),
        "expected {:?} for count {}", expected, count,
      );
    }
  }
}

use seedance2pro_client::generate::image::generate_midjourney_v8::{
  GenerateMidjourneyV8AspectRatio, GenerateMidjourneyV8Quality,
  GenerateMidjourneyV8Request, KinoviMidjourneyBatchCount,
};

use crate::api::image_list_ref::ImageListRef;
use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_quality::RouterQuality;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use crate::generate::generate_image::image_generation_draft::ImageGenerationDraftRequest;
use crate::generate::generate_image::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use crate::generate::generate_image::image_generation_request::ImageGenerationRequest;
use crate::generate::generate_image::providers::kinovi::midjourney_8::draft::{
  KinoviMidjourney8DraftState, KinoviMidjourney8RemainingItems,
};
use crate::generate::generate_image::providers::kinovi::midjourney_8::request::KinoviMidjourney8RequestState;

pub fn build_kinovi_midjourney_8(
  mut builder: GenerateImageRequestBuilder,
) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio.take(), strategy)?;
  let quality = plan_quality(builder.quality.take());
  let batch_count = plan_batch_count(builder.image_batch_count.take(), strategy)?;
  let prompt = builder.prompt.take().unwrap_or_default();
  let image_inputs = builder.image_inputs.take();

  if !has_image_inputs(image_inputs.as_ref()) {
    let request = GenerateMidjourneyV8Request {
      prompt,
      aspect_ratio,
      negative_prompt: None,
      stylize: None,
      weird: None,
      chaos: None,
      quality,
      raw_mode: false,
      batch_count,
      reference_image_urls: None,
    };
    return Ok(ImageGenerationDraftOrRequest::Request(
      ImageGenerationRequest::KinoviMidjourney8(KinoviMidjourney8RequestState { request }),
    ));
  }

  let draft = KinoviMidjourney8DraftState {
    prompt,
    aspect_ratio,
    quality,
    batch_count,
    unhandled_request_state: Some(KinoviMidjourney8RemainingItems {
      reference_images: image_inputs,
    }),
  };
  Ok(ImageGenerationDraftOrRequest::Draft(
    ImageGenerationDraftRequest::KinoviMidjourney8(draft),
  ))
}

fn has_image_inputs(image_inputs: Option<&ImageListRef>) -> bool {
  match image_inputs {
    None => false,
    Some(ImageListRef::Urls(urls)) => !urls.is_empty(),
    Some(ImageListRef::MediaFileTokens(tokens)) => !tokens.is_empty(),
  }
}

// ── Plan helpers ──

pub(crate) fn plan_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<GenerateMidjourneyV8AspectRatio, ArtcraftRouterError> {
  use GenerateMidjourneyV8AspectRatio as Ar;
  match aspect_ratio {
    None
    | Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto3k)
    | Some(RouterAspectRatio::Auto4k) => Ok(Ar::Square1x1),

    Some(RouterAspectRatio::Square) | Some(RouterAspectRatio::SquareHd) => Ok(Ar::Square1x1),
    Some(RouterAspectRatio::WideSixteenByNine) | Some(RouterAspectRatio::Wide) => Ok(Ar::Landscape16x9),
    Some(RouterAspectRatio::WideTwentyOneByNine) => Ok(Ar::UltraWide21x9),
    Some(RouterAspectRatio::WideFourByThree) => Ok(Ar::Standard4x3),
    Some(RouterAspectRatio::WideFiveByFour) => Ok(Ar::Wide5x4),
    Some(RouterAspectRatio::WideThreeByTwo) => Ok(Ar::Wide3x2),
    Some(RouterAspectRatio::TallNineBySixteen) | Some(RouterAspectRatio::Tall) => Ok(Ar::Portrait9x16),
    Some(RouterAspectRatio::TallNineByTwentyOne) => Ok(Ar::UltraTall9x21),
    Some(RouterAspectRatio::TallThreeByFour) => Ok(Ar::Portrait3x4),
    Some(RouterAspectRatio::TallFourByFive) => Ok(Ar::Tall4x5),
    Some(RouterAspectRatio::TallTwoByThree) => Ok(Ar::Tall2x3),

    #[allow(unreachable_patterns)]
    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      _ => Ok(Ar::Square1x1),
    },
  }
}

pub(crate) fn plan_quality(quality: Option<RouterQuality>) -> Option<GenerateMidjourneyV8Quality> {
  match quality {
    None => None,
    Some(RouterQuality::Low) => Some(GenerateMidjourneyV8Quality::Quarter),
    Some(RouterQuality::Medium) => Some(GenerateMidjourneyV8Quality::Half),
    Some(RouterQuality::High) => Some(GenerateMidjourneyV8Quality::Full),
  }
}

pub(crate) fn plan_batch_count(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<KinoviMidjourneyBatchCount, ArtcraftRouterError> {
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(KinoviMidjourneyBatchCount::One),
    2 => Ok(KinoviMidjourneyBatchCount::Two),
    4 => Ok(KinoviMidjourneyBatchCount::Four),
    other => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => {
        Ok(if other < 3 { KinoviMidjourneyBatchCount::Two } else { KinoviMidjourneyBatchCount::Four })
      }
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(if other < 4 { KinoviMidjourneyBatchCount::Two } else { KinoviMidjourneyBatchCount::Four })
      }
    },
  }
}

#[cfg(test)]
mod tests {
  use seedance2pro_client::generate::image::generate_midjourney_v8::KinoviMidjourneyBatchCount;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_image_model::RouterImageModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
  use crate::generate::generate_image::image_generation_draft::ImageGenerationDraftRequest;
  use crate::generate::generate_image::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
  use crate::generate::generate_image::image_generation_request::ImageGenerationRequest;

  use super::*;

  fn base_builder() -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      model: RouterImageModel::Midjourney8,
      provider: RouterProvider::Seedance2Pro,
      prompt: Some("a spooky horror scene".to_string()),
      image_inputs: None,
      resolution: None,
      aspect_ratio: None,
      quality: None,
      image_batch_count: None,
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
    }
  }

  #[test]
  fn no_image_inputs_returns_request_directly() {
    let result = build_kinovi_midjourney_8(base_builder()).expect("build");
    assert!(matches!(
      result,
      ImageGenerationDraftOrRequest::Request(ImageGenerationRequest::KinoviMidjourney8(_)),
    ));
  }

  #[test]
  fn image_inputs_returns_draft() {
    let builder = GenerateImageRequestBuilder {
      image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/ref.png".to_string()])),
      ..base_builder()
    };
    let result = build_kinovi_midjourney_8(builder).expect("build");
    assert!(matches!(
      result,
      ImageGenerationDraftOrRequest::Draft(ImageGenerationDraftRequest::KinoviMidjourney8(_)),
    ));
  }

  #[test]
  fn batch_count_four_is_accepted() {
    let builder = GenerateImageRequestBuilder { image_batch_count: Some(4), ..base_builder() };
    let req = match build_kinovi_midjourney_8(builder).expect("build") {
      ImageGenerationDraftOrRequest::Request(ImageGenerationRequest::KinoviMidjourney8(r)) => r,
      _ => panic!("expected Request"),
    };
    assert_eq!(req.request.batch_count, KinoviMidjourneyBatchCount::Four);
  }

  #[test]
  fn media_file_token_route_through_draft() {
    let builder = GenerateImageRequestBuilder {
      image_inputs: Some(ImageListRef::MediaFileTokens(vec![
        MediaFileToken::new("mf_x".to_string()),
      ])),
      ..base_builder()
    };
    let draft = match build_kinovi_midjourney_8(builder).expect("build") {
      ImageGenerationDraftOrRequest::Draft(ImageGenerationDraftRequest::KinoviMidjourney8(d)) => d,
      _ => panic!("expected Draft"),
    };
    assert!(draft.unhandled_request_state.is_some());
  }
}

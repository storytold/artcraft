use seedance2pro_client::generate::image::generate_midjourney_v7::{
  GenerateMidjourneyV7AspectRatio, GenerateMidjourneyV7Quality,
  GenerateMidjourneyV7Request, KinoviMidjourneyBatchCount,
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
use crate::generate::generate_image::providers::kinovi::midjourney_7::draft::{
  KinoviMidjourney7DraftState, KinoviMidjourney7RemainingItems,
};
use crate::generate::generate_image::providers::kinovi::midjourney_7::request::KinoviMidjourney7RequestState;

pub fn build_kinovi_midjourney_7(
  mut builder: GenerateImageRequestBuilder,
) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio.take(), strategy)?;
  let quality = plan_quality(builder.quality.take());
  let batch_count = plan_batch_count(builder.image_batch_count.take(), strategy)?;
  let prompt = builder.prompt.take().unwrap_or_default();
  let image_inputs = builder.image_inputs.take();

  // No image inputs → we can build the final request immediately. No
  // draft/upload phase needed.
  if !has_image_inputs(image_inputs.as_ref()) {
    let request = GenerateMidjourneyV7Request {
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
      ImageGenerationRequest::KinoviMidjourney7(KinoviMidjourney7RequestState { request }),
    ));
  }

  // Image inputs present → must go through the draft phase so we can
  // upload each image to the Seedance2Pro CDN before sending.
  let draft = KinoviMidjourney7DraftState {
    prompt,
    aspect_ratio,
    quality,
    batch_count,
    unhandled_request_state: Some(KinoviMidjourney7RemainingItems {
      reference_images: image_inputs,
    }),
  };
  Ok(ImageGenerationDraftOrRequest::Draft(
    ImageGenerationDraftRequest::KinoviMidjourney7(draft),
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
) -> Result<GenerateMidjourneyV7AspectRatio, ArtcraftRouterError> {
  use GenerateMidjourneyV7AspectRatio as Ar;
  match aspect_ratio {
    // No preference or auto → square, matching Midjourney's own default for new
    // jobs in their UI.
    None
    | Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto3k)
    | Some(RouterAspectRatio::Auto4k) => Ok(Ar::Square1x1),

    // Direct mappings — Midjourney supports every common ratio.
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

    // Every aspect ratio listed in `RouterAspectRatio` has a direct mapping;
    // the catch-all is reserved for future variants.
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

pub(crate) fn plan_quality(quality: Option<RouterQuality>) -> Option<GenerateMidjourneyV7Quality> {
  // Midjourney's quality knob is a compute-budget dial that doesn't change
  // Kinovi pricing — pass through whatever the caller asked for, and let
  // `None` ride Midjourney's server-side default.
  match quality {
    None => None,
    Some(RouterQuality::Low) => Some(GenerateMidjourneyV7Quality::Quarter),
    Some(RouterQuality::Medium) => Some(GenerateMidjourneyV7Quality::Half),
    Some(RouterQuality::High) => Some(GenerateMidjourneyV7Quality::Full),
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
        // 3 → 4, anything > 4 → 4
        Ok(if other < 3 { KinoviMidjourneyBatchCount::Two } else { KinoviMidjourneyBatchCount::Four })
      }
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        // 3 → 2, anything > 4 → 4
        Ok(if other < 4 { KinoviMidjourneyBatchCount::Two } else { KinoviMidjourneyBatchCount::Four })
      }
    },
  }
}

#[cfg(test)]
mod tests {
  use seedance2pro_client::generate::image::generate_midjourney_v7::KinoviMidjourneyBatchCount;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_aspect_ratio::RouterAspectRatio;
  use crate::api::router_image_model::RouterImageModel;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_quality::RouterQuality;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
  use crate::generate::generate_image::image_generation_draft::ImageGenerationDraftRequest;
  use crate::generate::generate_image::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
  use crate::generate::generate_image::image_generation_request::ImageGenerationRequest;

  use super::*;

  fn base_builder() -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      model: RouterImageModel::Midjourney7,
      provider: RouterProvider::Seedance2Pro,
      prompt: Some("a corgi astronaut".to_string()),
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

  // ── Mode dispatch: no image inputs → Request; with → Draft ──

  mod mode_dispatch {
    use super::*;

    #[test]
    fn no_image_inputs_returns_request_directly() {
      let result = build_kinovi_midjourney_7(base_builder()).expect("build");
      assert!(matches!(
        result,
        ImageGenerationDraftOrRequest::Request(ImageGenerationRequest::KinoviMidjourney7(_)),
      ));
    }

    #[test]
    fn empty_image_inputs_returns_request_directly() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec![])),
        ..base_builder()
      };
      let result = build_kinovi_midjourney_7(builder).expect("build");
      assert!(matches!(
        result,
        ImageGenerationDraftOrRequest::Request(ImageGenerationRequest::KinoviMidjourney7(_)),
      ));
    }

    #[test]
    fn image_url_inputs_returns_draft() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/ref.png".to_string()])),
        ..base_builder()
      };
      let result = build_kinovi_midjourney_7(builder).expect("build");
      assert!(matches!(
        result,
        ImageGenerationDraftOrRequest::Draft(ImageGenerationDraftRequest::KinoviMidjourney7(_)),
      ));
    }

    #[test]
    fn image_token_inputs_returns_draft() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::MediaFileTokens(vec![
          MediaFileToken::new("mf_test".to_string()),
        ])),
        ..base_builder()
      };
      let result = build_kinovi_midjourney_7(builder).expect("build");
      assert!(matches!(
        result,
        ImageGenerationDraftOrRequest::Draft(ImageGenerationDraftRequest::KinoviMidjourney7(_)),
      ));
    }

    #[test]
    fn draft_remembers_image_inputs() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec![
          "https://example.com/a.png".to_string(),
          "https://example.com/b.png".to_string(),
        ])),
        ..base_builder()
      };
      let draft = unwrap_draft(build_kinovi_midjourney_7(builder));
      let remaining = draft.unhandled_request_state.as_ref().unwrap();
      let urls = match remaining.reference_images.as_ref().unwrap() {
        ImageListRef::Urls(urls) => urls,
        _ => panic!("expected Urls"),
      };
      assert_eq!(urls.len(), 2);
    }
  }

  // ── Field passthrough ──

  mod field_passthrough {
    use super::*;

    #[test]
    fn prompt_is_passed_through() {
      let req = unwrap_direct_request(build_kinovi_midjourney_7(base_builder()));
      assert_eq!(req.request.prompt, "a corgi astronaut");
    }

    #[test]
    fn prompt_defaults_to_empty() {
      let builder = GenerateImageRequestBuilder { prompt: None, ..base_builder() };
      let req = unwrap_direct_request(build_kinovi_midjourney_7(builder));
      assert_eq!(req.request.prompt, "");
    }
  }

  // ── Aspect ratio ──

  mod aspect_ratio_tests {
    use super::*;
    use seedance2pro_client::generate::image::generate_midjourney_v7::GenerateMidjourneyV7AspectRatio as Ar;

    fn aspect_ratio_for(input: Option<RouterAspectRatio>) -> Ar {
      let builder = GenerateImageRequestBuilder { aspect_ratio: input, ..base_builder() };
      unwrap_direct_request(build_kinovi_midjourney_7(builder)).request.aspect_ratio
    }

    #[test]
    fn none_defaults_to_square() {
      assert_eq!(aspect_ratio_for(None), Ar::Square1x1);
    }

    #[test]
    fn auto_defaults_to_square() {
      assert_eq!(aspect_ratio_for(Some(RouterAspectRatio::Auto)), Ar::Square1x1);
      assert_eq!(aspect_ratio_for(Some(RouterAspectRatio::Auto2k)), Ar::Square1x1);
      assert_eq!(aspect_ratio_for(Some(RouterAspectRatio::Auto3k)), Ar::Square1x1);
      assert_eq!(aspect_ratio_for(Some(RouterAspectRatio::Auto4k)), Ar::Square1x1);
    }

    #[test]
    fn every_ratio_maps_directly() {
      assert_eq!(aspect_ratio_for(Some(RouterAspectRatio::Square)), Ar::Square1x1);
      assert_eq!(aspect_ratio_for(Some(RouterAspectRatio::SquareHd)), Ar::Square1x1);
      assert_eq!(aspect_ratio_for(Some(RouterAspectRatio::WideSixteenByNine)), Ar::Landscape16x9);
      assert_eq!(aspect_ratio_for(Some(RouterAspectRatio::WideTwentyOneByNine)), Ar::UltraWide21x9);
      assert_eq!(aspect_ratio_for(Some(RouterAspectRatio::WideFourByThree)), Ar::Standard4x3);
      assert_eq!(aspect_ratio_for(Some(RouterAspectRatio::WideFiveByFour)), Ar::Wide5x4);
      assert_eq!(aspect_ratio_for(Some(RouterAspectRatio::WideThreeByTwo)), Ar::Wide3x2);
      assert_eq!(aspect_ratio_for(Some(RouterAspectRatio::Wide)), Ar::Landscape16x9);
      assert_eq!(aspect_ratio_for(Some(RouterAspectRatio::TallNineBySixteen)), Ar::Portrait9x16);
      assert_eq!(aspect_ratio_for(Some(RouterAspectRatio::TallNineByTwentyOne)), Ar::UltraTall9x21);
      assert_eq!(aspect_ratio_for(Some(RouterAspectRatio::TallThreeByFour)), Ar::Portrait3x4);
      assert_eq!(aspect_ratio_for(Some(RouterAspectRatio::TallFourByFive)), Ar::Tall4x5);
      assert_eq!(aspect_ratio_for(Some(RouterAspectRatio::TallTwoByThree)), Ar::Tall2x3);
      assert_eq!(aspect_ratio_for(Some(RouterAspectRatio::Tall)), Ar::Portrait9x16);
    }
  }

  // ── Quality ──

  mod quality_tests {
    use super::*;
    use seedance2pro_client::generate::image::generate_midjourney_v7::GenerateMidjourneyV7Quality as Q;

    fn quality_for(input: Option<RouterQuality>) -> Option<Q> {
      let builder = GenerateImageRequestBuilder { quality: input, ..base_builder() };
      unwrap_direct_request(build_kinovi_midjourney_7(builder)).request.quality
    }

    #[test]
    fn none_passes_through_as_none() {
      assert_eq!(quality_for(None), None);
    }

    #[test]
    fn low_maps_to_quarter() {
      assert_eq!(quality_for(Some(RouterQuality::Low)), Some(Q::Quarter));
    }

    #[test]
    fn medium_maps_to_half() {
      assert_eq!(quality_for(Some(RouterQuality::Medium)), Some(Q::Half));
    }

    #[test]
    fn high_maps_to_full() {
      assert_eq!(quality_for(Some(RouterQuality::High)), Some(Q::Full));
    }
  }

  // ── Batch count ──

  mod batch_count_tests {
    use super::*;

    fn batch_for(count: Option<u16>) -> KinoviMidjourneyBatchCount {
      let builder = GenerateImageRequestBuilder { image_batch_count: count, ..base_builder() };
      unwrap_direct_request(build_kinovi_midjourney_7(builder)).request.batch_count
    }

    #[test]
    fn none_defaults_to_one() {
      assert_eq!(batch_for(None), KinoviMidjourneyBatchCount::One);
    }

    #[test]
    fn one_two_four_map_directly() {
      assert_eq!(batch_for(Some(1)), KinoviMidjourneyBatchCount::One);
      assert_eq!(batch_for(Some(2)), KinoviMidjourneyBatchCount::Two);
      assert_eq!(batch_for(Some(4)), KinoviMidjourneyBatchCount::Four);
    }

    #[test]
    fn zero_is_rejected() {
      let builder = GenerateImageRequestBuilder { image_batch_count: Some(0), ..base_builder() };
      assert!(matches!(
        build_kinovi_midjourney_7(builder),
        Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
      ));
    }

    #[test]
    fn three_errors_under_strict() {
      let builder = GenerateImageRequestBuilder {
        image_batch_count: Some(3),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..base_builder()
      };
      assert!(matches!(
        build_kinovi_midjourney_7(builder),
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. })),
      ));
    }

    #[test]
    fn three_upgrades_to_four_with_pay_more() {
      let builder = GenerateImageRequestBuilder {
        image_batch_count: Some(3),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
        ..base_builder()
      };
      assert_eq!(
        unwrap_direct_request(build_kinovi_midjourney_7(builder)).request.batch_count,
        KinoviMidjourneyBatchCount::Four,
      );
    }

    #[test]
    fn three_downgrades_to_two_with_pay_less() {
      let builder = GenerateImageRequestBuilder {
        image_batch_count: Some(3),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayLessDowngrade,
        ..base_builder()
      };
      assert_eq!(
        unwrap_direct_request(build_kinovi_midjourney_7(builder)).request.batch_count,
        KinoviMidjourneyBatchCount::Two,
      );
    }
  }

  // ── Helpers ──

  fn unwrap_direct_request(
    result: Result<ImageGenerationDraftOrRequest, ArtcraftRouterError>,
  ) -> KinoviMidjourney7RequestState {
    match result.expect("build should succeed") {
      ImageGenerationDraftOrRequest::Request(
        ImageGenerationRequest::KinoviMidjourney7(req),
      ) => req,
      other => panic!("expected KinoviMidjourney7 Request, got {:?}", other),
    }
  }

  fn unwrap_draft(
    result: Result<ImageGenerationDraftOrRequest, ArtcraftRouterError>,
  ) -> KinoviMidjourney7DraftState {
    match result.expect("build should succeed") {
      ImageGenerationDraftOrRequest::Draft(
        ImageGenerationDraftRequest::KinoviMidjourney7(draft),
      ) => draft,
      other => panic!("expected KinoviMidjourney7 Draft, got {:?}", other),
    }
  }
}

use seedance2pro_client::generate::image::generate_seedream_5p0_pro::{
  GenerateSeedream5p0ProRequest, KinoviSeedream5p0ProAspectRatio, KinoviSeedream5p0ProBatchCount,
  KinoviSeedream5p0ProResolution, MAX_REFERENCE_IMAGES,
};

use crate::api::image_list_ref::ImageListRef;
use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_resolution::RouterResolution;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use crate::generate::generate_image::image_generation_draft::ImageGenerationDraftRequest;
use crate::generate::generate_image::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use crate::generate::generate_image::image_generation_request::ImageGenerationRequest;
use crate::generate::generate_image::providers::kinovi::seedream_5p0_pro::draft::{
  KinoviSeedream5p0ProDraftState, KinoviSeedream5p0ProRemainingItems,
};
use crate::generate::generate_image::providers::kinovi::seedream_5p0_pro::request::KinoviSeedream5p0ProRequestState;

pub fn build_kinovi_seedream_5p0_pro(
  mut builder: GenerateImageRequestBuilder,
) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio.take(), strategy)?;
  let resolution = plan_resolution(builder.resolution.take(), strategy)?;
  let batch_count = plan_batch_count(builder.image_batch_count.take(), strategy)?;
  let prompt = builder.prompt.take().unwrap_or_default();
  let image_inputs = builder.image_inputs.take();

  validate_reference_image_count(image_inputs.as_ref())?;

  if !has_image_inputs(image_inputs.as_ref()) {
    let request = GenerateSeedream5p0ProRequest {
      prompt,
      aspect_ratio,
      resolution,
      batch_count,
      reference_image_urls: None,
    };
    return Ok(ImageGenerationDraftOrRequest::Request(
      ImageGenerationRequest::KinoviSeedream5p0Pro(KinoviSeedream5p0ProRequestState { request }),
    ));
  }

  let draft = KinoviSeedream5p0ProDraftState {
    prompt,
    aspect_ratio,
    resolution,
    batch_count,
    unhandled_request_state: Some(KinoviSeedream5p0ProRemainingItems {
      reference_images: image_inputs,
    }),
  };
  Ok(ImageGenerationDraftOrRequest::Draft(
    ImageGenerationDraftRequest::KinoviSeedream5p0Pro(draft),
  ))
}

fn has_image_inputs(image_inputs: Option<&ImageListRef>) -> bool {
  match image_inputs {
    None => false,
    Some(ImageListRef::Urls(urls)) => !urls.is_empty(),
    Some(ImageListRef::MediaFileTokens(tokens)) => !tokens.is_empty(),
  }
}

/// Reject over-limit reference lists before any uploads happen — the
/// Seedance2Pro client would reject them anyway, but only after the draft
/// stage has already uploaded every image to the Kinovi CDN.
fn validate_reference_image_count(
  image_inputs: Option<&ImageListRef>,
) -> Result<(), ArtcraftRouterError> {
  let count = match image_inputs {
    None => 0,
    Some(ImageListRef::Urls(urls)) => urls.len(),
    Some(ImageListRef::MediaFileTokens(tokens)) => tokens.len(),
  };
  if count > MAX_REFERENCE_IMAGES {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "image_inputs",
      value: format!("{} reference images (max {})", count, MAX_REFERENCE_IMAGES),
    }));
  }
  Ok(())
}

// ── Plan helpers ──

pub(crate) fn plan_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<KinoviSeedream5p0ProAspectRatio, ArtcraftRouterError> {
  use KinoviSeedream5p0ProAspectRatio as Ar;
  match aspect_ratio {
    None
    | Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto3k)
    | Some(RouterAspectRatio::Auto4k) => Ok(Ar::Auto),

    Some(RouterAspectRatio::Square) | Some(RouterAspectRatio::SquareHd) => Ok(Ar::Square1x1),
    Some(RouterAspectRatio::WideFourByThree) => Ok(Ar::Standard4x3),
    Some(RouterAspectRatio::TallThreeByFour) => Ok(Ar::Portrait3x4),
    Some(RouterAspectRatio::WideSixteenByNine) | Some(RouterAspectRatio::Wide) => Ok(Ar::Landscape16x9),
    Some(RouterAspectRatio::TallNineBySixteen) | Some(RouterAspectRatio::Tall) => Ok(Ar::Portrait9x16),
    Some(RouterAspectRatio::WideThreeByTwo) => Ok(Ar::Wide3x2),
    Some(RouterAspectRatio::TallTwoByThree) => Ok(Ar::Tall2x3),
    Some(RouterAspectRatio::WideTwentyOneByNine) => Ok(Ar::UltraWide21x9),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      _ => Ok(Ar::Auto),
    },
  }
}

pub(crate) fn plan_resolution(
  resolution: Option<RouterResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<KinoviSeedream5p0ProResolution, ArtcraftRouterError> {
  use KinoviSeedream5p0ProResolution as Res;
  match resolution {
    None | Some(RouterResolution::OneK) => Ok(Res::OneK),
    Some(RouterResolution::TwoK) => Ok(Res::TwoK),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", unsupported),
        }))
      }
      // Snap to the nearest supported tier: sub-1k inputs (0.5K, legacy
      // video resolutions) land on 1k; 3K/4K land on 2k.
      _ => match unsupported {
        RouterResolution::ThreeK | RouterResolution::FourK => Ok(Res::TwoK),
        _ => Ok(Res::OneK),
      },
    },
  }
}

pub(crate) fn plan_batch_count(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<KinoviSeedream5p0ProBatchCount, ArtcraftRouterError> {
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(KinoviSeedream5p0ProBatchCount::One),
    2 => Ok(KinoviSeedream5p0ProBatchCount::Two),
    3 => Ok(KinoviSeedream5p0ProBatchCount::Three),
    4 => Ok(KinoviSeedream5p0ProBatchCount::Four),
    5 => Ok(KinoviSeedream5p0ProBatchCount::Five),
    6 => Ok(KinoviSeedream5p0ProBatchCount::Six),
    7 => Ok(KinoviSeedream5p0ProBatchCount::Seven),
    8 => Ok(KinoviSeedream5p0ProBatchCount::Eight),
    other => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", other),
        }))
      }
      // Kinovi supports batches of 1–8; only counts of 9+ reach here, so both
      // mitigation strategies clamp to the maximum supported batch.
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(KinoviSeedream5p0ProBatchCount::Eight)
      }
    },
  }
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::router_image_model::RouterImageModel;
  use crate::api::router_provider::RouterProvider;

  use super::*;

  fn base_builder() -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      model: RouterImageModel::Seedream5p0Pro,
      provider: RouterProvider::Seedance2Pro,
      prompt: Some("an anime girl riding a dinosaur".to_string()),
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

  fn build_request(builder: GenerateImageRequestBuilder) -> KinoviSeedream5p0ProRequestState {
    match build_kinovi_seedream_5p0_pro(builder).expect("build") {
      ImageGenerationDraftOrRequest::Request(ImageGenerationRequest::KinoviSeedream5p0Pro(r)) => r,
      _ => panic!("expected Request"),
    }
  }

  mod routing_tests {
    use super::*;

    #[test]
    fn no_image_inputs_returns_request_directly() {
      let result = build_kinovi_seedream_5p0_pro(base_builder()).expect("build");
      assert!(matches!(
        result,
        ImageGenerationDraftOrRequest::Request(ImageGenerationRequest::KinoviSeedream5p0Pro(_)),
      ));
    }

    #[test]
    fn image_inputs_returns_draft() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/ref.png".to_string()])),
        ..base_builder()
      };
      let result = build_kinovi_seedream_5p0_pro(builder).expect("build");
      assert!(matches!(
        result,
        ImageGenerationDraftOrRequest::Draft(ImageGenerationDraftRequest::KinoviSeedream5p0Pro(_)),
      ));
    }

    #[test]
    fn media_file_tokens_route_through_draft() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::MediaFileTokens(vec![
          MediaFileToken::new("mf_x".to_string()),
        ])),
        ..base_builder()
      };
      let draft = match build_kinovi_seedream_5p0_pro(builder).expect("build") {
        ImageGenerationDraftOrRequest::Draft(ImageGenerationDraftRequest::KinoviSeedream5p0Pro(d)) => d,
        _ => panic!("expected Draft"),
      };
      assert!(draft.unhandled_request_state.is_some());
    }

    #[test]
    fn fourteen_reference_images_is_accepted() {
      let urls: Vec<String> = (0..MAX_REFERENCE_IMAGES)
        .map(|i| format!("https://example.com/ref{i}.png"))
        .collect();
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(urls)),
        ..base_builder()
      };
      assert!(build_kinovi_seedream_5p0_pro(builder).is_ok());
    }

    #[test]
    fn fifteen_reference_images_is_rejected() {
      let urls: Vec<String> = (0..MAX_REFERENCE_IMAGES + 1)
        .map(|i| format!("https://example.com/ref{i}.png"))
        .collect();
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(urls)),
        ..base_builder()
      };
      assert!(build_kinovi_seedream_5p0_pro(builder).is_err());
    }
  }

  mod plan_tests {
    use super::*;

    #[test]
    fn default_aspect_ratio_is_auto() {
      let req = build_request(base_builder());
      assert_eq!(req.request.aspect_ratio, KinoviSeedream5p0ProAspectRatio::Auto);
    }

    #[test]
    fn every_supported_aspect_ratio_maps() {
      let cases = [
        (RouterAspectRatio::Auto, KinoviSeedream5p0ProAspectRatio::Auto),
        (RouterAspectRatio::Square, KinoviSeedream5p0ProAspectRatio::Square1x1),
        (RouterAspectRatio::WideFourByThree, KinoviSeedream5p0ProAspectRatio::Standard4x3),
        (RouterAspectRatio::TallThreeByFour, KinoviSeedream5p0ProAspectRatio::Portrait3x4),
        (RouterAspectRatio::WideSixteenByNine, KinoviSeedream5p0ProAspectRatio::Landscape16x9),
        (RouterAspectRatio::TallNineBySixteen, KinoviSeedream5p0ProAspectRatio::Portrait9x16),
        (RouterAspectRatio::WideThreeByTwo, KinoviSeedream5p0ProAspectRatio::Wide3x2),
        (RouterAspectRatio::TallTwoByThree, KinoviSeedream5p0ProAspectRatio::Tall2x3),
        (RouterAspectRatio::WideTwentyOneByNine, KinoviSeedream5p0ProAspectRatio::UltraWide21x9),
      ];
      for (input, expected) in cases {
        let planned = plan_aspect_ratio(Some(input), RequestMismatchMitigationStrategy::ErrorOut)
          .expect("plan");
        assert_eq!(planned, expected, "input={:?}", input);
      }
    }

    #[test]
    fn unsupported_aspect_ratio_errors_out() {
      let result = plan_aspect_ratio(
        Some(RouterAspectRatio::TallNineByTwentyOne),
        RequestMismatchMitigationStrategy::ErrorOut,
      );
      assert!(result.is_err());
    }

    #[test]
    fn unsupported_aspect_ratio_falls_back_to_auto() {
      let planned = plan_aspect_ratio(
        Some(RouterAspectRatio::TallNineByTwentyOne),
        RequestMismatchMitigationStrategy::PayLessDowngrade,
      ).expect("plan");
      assert_eq!(planned, KinoviSeedream5p0ProAspectRatio::Auto);
    }

    #[test]
    fn default_resolution_is_1k() {
      let req = build_request(base_builder());
      assert_eq!(req.request.resolution, KinoviSeedream5p0ProResolution::OneK);
    }

    #[test]
    fn two_k_resolution_maps() {
      let builder = GenerateImageRequestBuilder {
        resolution: Some(RouterResolution::TwoK),
        ..base_builder()
      };
      let req = build_request(builder);
      assert_eq!(req.request.resolution, KinoviSeedream5p0ProResolution::TwoK);
    }

    #[test]
    fn four_k_resolution_errors_out() {
      let result = plan_resolution(
        Some(RouterResolution::FourK),
        RequestMismatchMitigationStrategy::ErrorOut,
      );
      assert!(result.is_err());
    }

    #[test]
    fn four_k_resolution_downgrades_to_2k() {
      let planned = plan_resolution(
        Some(RouterResolution::FourK),
        RequestMismatchMitigationStrategy::PayLessDowngrade,
      ).expect("plan");
      assert_eq!(planned, KinoviSeedream5p0ProResolution::TwoK);
    }

    #[test]
    fn half_k_resolution_snaps_to_1k() {
      let planned = plan_resolution(
        Some(RouterResolution::HalfK),
        RequestMismatchMitigationStrategy::PayMoreUpgrade,
      ).expect("plan");
      assert_eq!(planned, KinoviSeedream5p0ProResolution::OneK);
    }

    #[test]
    fn batch_counts_one_through_eight_are_accepted() {
      let cases = [
        (1, KinoviSeedream5p0ProBatchCount::One),
        (2, KinoviSeedream5p0ProBatchCount::Two),
        (3, KinoviSeedream5p0ProBatchCount::Three),
        (4, KinoviSeedream5p0ProBatchCount::Four),
        (5, KinoviSeedream5p0ProBatchCount::Five),
        (6, KinoviSeedream5p0ProBatchCount::Six),
        (7, KinoviSeedream5p0ProBatchCount::Seven),
        (8, KinoviSeedream5p0ProBatchCount::Eight),
      ];
      for (input, expected) in cases {
        let planned = plan_batch_count(Some(input), RequestMismatchMitigationStrategy::ErrorOut)
          .expect("plan");
        assert_eq!(planned, expected, "input={}", input);
      }
    }

    #[test]
    fn batch_count_zero_is_rejected() {
      assert!(plan_batch_count(Some(0), RequestMismatchMitigationStrategy::ErrorOut).is_err());
    }

    #[test]
    fn batch_count_nine_errors_out() {
      assert!(plan_batch_count(Some(9), RequestMismatchMitigationStrategy::ErrorOut).is_err());
    }

    #[test]
    fn batch_count_nine_clamps_to_eight() {
      let planned = plan_batch_count(Some(9), RequestMismatchMitigationStrategy::PayLessDowngrade)
        .expect("plan");
      assert_eq!(planned, KinoviSeedream5p0ProBatchCount::Eight);
    }
  }
}

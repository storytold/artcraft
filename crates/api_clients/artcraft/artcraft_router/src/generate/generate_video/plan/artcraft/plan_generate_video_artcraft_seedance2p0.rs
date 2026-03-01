use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::{
  Seedance2p0AspectRatio, Seedance2p0BatchCount,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftSeedance2p0<'a> {
  pub prompt: Option<&'a str>,
  pub start_frame: Option<&'a MediaFileToken>,
  pub end_frame: Option<&'a MediaFileToken>,
  pub reference_images: Option<&'a Vec<MediaFileToken>>,
  pub aspect_ratio: Option<Seedance2p0AspectRatio>,
  pub duration_seconds: Option<u8>,
  pub batch_count: Seedance2p0BatchCount,
  pub idempotency_token: String,
}

pub fn plan_generate_video_artcraft_seedance2p0<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<PlanArtcraftSeedance2p0<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let start_frame = resolve_image_ref(request.start_frame)?;
  let end_frame = resolve_image_ref(request.end_frame)?;
  let reference_images = resolve_image_list_ref(request.reference_images)?;

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let batch_count = plan_batch_count(request.video_batch_count, strategy)?;
  let duration_seconds = plan_duration(request.duration_seconds, strategy)?;

  Ok(PlanArtcraftSeedance2p0 {
    prompt: request.prompt,
    start_frame,
    end_frame,
    reference_images,
    aspect_ratio,
    duration_seconds,
    batch_count,
    idempotency_token: request.get_or_generate_idempotency_token(),
  })
}

fn resolve_image_ref<'a>(
  image_ref: Option<ImageRef<'a>>,
) -> Result<Option<&'a MediaFileToken>, ArtcraftRouterError> {
  match image_ref {
    None => Ok(None),
    Some(ImageRef::MediaFileToken(t)) => Ok(Some(t)),
    Some(ImageRef::Url(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
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

// Supported aspect ratios and their AR values (width / height):
//   Portrait9x16 = 0.5625, Portrait3x4 = 0.75, Square1x1 = 1.0, Standard4x3 = 1.33, Landscape16x9 = 1.78
//
// All supported ratios cost the same, so PayMoreUpgrade and PayLessDowngrade both
// select the nearest match rather than rounding in a specific direction.
fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Seedance2p0AspectRatio>, ArtcraftRouterError> {
  match aspect_ratio {
    // No preference or auto — let the model decide
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(None),

    // Direct mappings
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => {
      Ok(Some(Seedance2p0AspectRatio::Landscape16x9))
    }
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => {
      Ok(Some(Seedance2p0AspectRatio::Portrait9x16))
    }
    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => {
      Ok(Some(Seedance2p0AspectRatio::Square1x1))
    }
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(Seedance2p0AspectRatio::Standard4x3)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(Seedance2p0AspectRatio::Portrait3x4)),

    // Mismatches — apply strategy
    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(nearest_aspect_ratio(unsupported)))
      }
    },
  }
}

/// Pick the nearest supported aspect ratio by AR value (width / height).
/// All Seedance2p0 aspect ratios cost the same, so this is used for both upgrade and downgrade.
fn nearest_aspect_ratio(aspect_ratio: CommonAspectRatio) -> Seedance2p0AspectRatio {
  match aspect_ratio {
    CommonAspectRatio::WideFiveByFour => Seedance2p0AspectRatio::Standard4x3,    // 1.25, nearest 1.33
    CommonAspectRatio::WideThreeByTwo => Seedance2p0AspectRatio::Standard4x3,    // 1.50, nearest 1.33
    CommonAspectRatio::WideTwentyOneByNine => Seedance2p0AspectRatio::Landscape16x9, // 2.33, nearest 1.78
    CommonAspectRatio::TallFourByFive => Seedance2p0AspectRatio::Portrait3x4,    // 0.80, nearest 0.75
    CommonAspectRatio::TallTwoByThree => Seedance2p0AspectRatio::Portrait3x4,    // 0.67, nearest 0.75
    CommonAspectRatio::TallNineByTwentyOne => Seedance2p0AspectRatio::Portrait9x16, // 0.43, nearest 0.56
    _ => Seedance2p0AspectRatio::Square1x1,
  }
}

// Seedance2p0 supports batch counts of 1, 2, and 4 only.
fn plan_batch_count(
  video_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Seedance2p0BatchCount, ArtcraftRouterError> {
  let count = video_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(Seedance2p0BatchCount::One),
    2 => Ok(Seedance2p0BatchCount::Two),
    4 => Ok(Seedance2p0BatchCount::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "video_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => {
        // Round up: 3 → Four; anything > 4 clamps to Four
        Ok(if count < 4 { Seedance2p0BatchCount::Four } else { Seedance2p0BatchCount::Four })
      }
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        // Round down: 3 → Two; anything > 4 clamps to Four (max available)
        Ok(if count < 4 { Seedance2p0BatchCount::Two } else { Seedance2p0BatchCount::Four })
      }
    },
  }
}

// Seedance2p0 supports duration of 4–15 seconds.

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<u8>, ArtcraftRouterError> {
  const MIN: u16 = 4;
  const MAX: u16 = 15;
  match duration_seconds {
    None => Ok(None),
    Some(d) if d >= MIN && d <= MAX => Ok(Some(d as u8)),
    Some(d) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", d),
        }))
      }
      _ => Ok(Some(d.clamp(MIN, MAX) as u8)),
    },
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::image_ref::ImageRef;
  use crate::errors::artcraft_router_error::ArtcraftRouterError;
  use crate::errors::client_error::ClientError;
  use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
  use crate::test_helpers::base_video_request;
  use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::{
    Seedance2p0AspectRatio, Seedance2p0BatchCount,
  };

  #[test]
  fn aspect_ratio_direct_16x9() {
    let request = GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      ..base_video_request()
    };
    let VideoGenerationPlan::ArtcraftSeedance2p0(plan) = request.build().unwrap();
    assert!(matches!(plan.aspect_ratio, Some(Seedance2p0AspectRatio::Landscape16x9)));
  }

  #[test]
  fn aspect_ratio_direct_9x16() {
    let request = GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::TallNineBySixteen),
      ..base_video_request()
    };
    let VideoGenerationPlan::ArtcraftSeedance2p0(plan) = request.build().unwrap();
    assert!(matches!(plan.aspect_ratio, Some(Seedance2p0AspectRatio::Portrait9x16)));
  }

  #[test]
  fn aspect_ratio_direct_square() {
    let request = GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::Square),
      ..base_video_request()
    };
    let VideoGenerationPlan::ArtcraftSeedance2p0(plan) = request.build().unwrap();
    assert!(matches!(plan.aspect_ratio, Some(Seedance2p0AspectRatio::Square1x1)));
  }

  #[test]
  fn aspect_ratio_nearest_match_both_strategies() {
    // WideThreeByTwo (AR 1.5) is nearest to Standard4x3 (1.33), not Landscape16x9 (1.78)
    for strategy in [
      RequestMismatchMitigationStrategy::PayMoreUpgrade,
      RequestMismatchMitigationStrategy::PayLessDowngrade,
    ] {
      let request = GenerateVideoRequest {
        aspect_ratio: Some(CommonAspectRatio::WideThreeByTwo),
        request_mismatch_mitigation_strategy: strategy,
        ..base_video_request()
      };
      let VideoGenerationPlan::ArtcraftSeedance2p0(plan) = request.build().unwrap();
      assert!(
        matches!(plan.aspect_ratio, Some(Seedance2p0AspectRatio::Standard4x3)),
        "Expected Standard4x3 for WideThreeByTwo with {:?}", strategy,
      );
    }
  }

  #[test]
  fn aspect_ratio_error_out_on_unsupported() {
    let request = GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::WideThreeByTwo),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      ..base_video_request()
    };
    let result = request.build();
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))
    ));
  }

  #[test]
  fn batch_count_zero_is_always_error() {
    for strategy in [
      RequestMismatchMitigationStrategy::ErrorOut,
      RequestMismatchMitigationStrategy::PayMoreUpgrade,
      RequestMismatchMitigationStrategy::PayLessDowngrade,
    ] {
      let request = GenerateVideoRequest {
        video_batch_count: Some(0),
        request_mismatch_mitigation_strategy: strategy,
        ..base_video_request()
      };
      let result = request.build();
      assert!(
        matches!(result, Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations))),
        "Expected UserRequestedZeroGenerations with {:?}", strategy,
      );
    }
  }

  #[test]
  fn batch_count_direct_mapping() {
    let req = GenerateVideoRequest { video_batch_count: Some(1), ..base_video_request() };
    let VideoGenerationPlan::ArtcraftSeedance2p0(plan) = req.build().unwrap();
    assert!(matches!(plan.batch_count, Seedance2p0BatchCount::One));

    let req = GenerateVideoRequest { video_batch_count: Some(2), ..base_video_request() };
    let VideoGenerationPlan::ArtcraftSeedance2p0(plan) = req.build().unwrap();
    assert!(matches!(plan.batch_count, Seedance2p0BatchCount::Two));

    let req = GenerateVideoRequest { video_batch_count: Some(4), ..base_video_request() };
    let VideoGenerationPlan::ArtcraftSeedance2p0(plan) = req.build().unwrap();
    assert!(matches!(plan.batch_count, Seedance2p0BatchCount::Four));
  }

  #[test]
  fn batch_count_three_upgrade_rounds_to_four() {
    let request = GenerateVideoRequest {
      video_batch_count: Some(3),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
      ..base_video_request()
    };
    let VideoGenerationPlan::ArtcraftSeedance2p0(plan) = request.build().unwrap();
    assert!(matches!(plan.batch_count, Seedance2p0BatchCount::Four));
  }

  #[test]
  fn batch_count_three_downgrade_rounds_to_two() {
    let request = GenerateVideoRequest {
      video_batch_count: Some(3),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayLessDowngrade,
      ..base_video_request()
    };
    let VideoGenerationPlan::ArtcraftSeedance2p0(plan) = request.build().unwrap();
    assert!(matches!(plan.batch_count, Seedance2p0BatchCount::Two));
  }

  #[test]
  fn url_image_ref_returns_error() {
    let request = GenerateVideoRequest {
      start_frame: Some(ImageRef::Url("https://example.com/image.jpg")),
      ..base_video_request()
    };
    let result = request.build();
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    ));
  }
}

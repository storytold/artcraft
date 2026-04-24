use seedance2pro_client::generate::video::generate_happy_horse_1p0::{
  KinoviHappyHorse1p0AspectRatio, KinoviHappyHorse1p0BatchCount,
  KinoviHappyHorse1p0OutputResolution,
};

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::kinovi::happy_horse_1p0::draft::{
  KinoviHappyHorse1p0DraftState, KinoviHappyHorse1p0RemainingItems,
};
use crate::generate::generate_video_v2::video_generation_draft::VideoGenerationDraftRequest;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;

pub fn build_kinovi_happy_horse_1p0(builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let draft = do_build(builder)?;
  Ok(VideoGenerationDraftOrRequest::Draft(VideoGenerationDraftRequest::KinoviHappyHorse1p0(draft)))
}

fn do_build(mut builder: GenerateVideoRequestBuilder) -> Result<KinoviHappyHorse1p0DraftState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio.take(), strategy)?;
  let resolution = plan_output_resolution(builder.resolution.take(), strategy)?;
  let batch_count = plan_batch_count(builder.video_batch_count.take(), strategy)?;
  let duration_seconds = plan_duration(builder.duration_seconds.take(), strategy)?;
  let prompt = builder.prompt.take().unwrap_or_default();

  let unhandled_request_state = KinoviHappyHorse1p0RemainingItems {
    start_frame: builder.start_frame.take(),
  };

  Ok(KinoviHappyHorse1p0DraftState {
    prompt,
    aspect_ratio,
    resolution,
    duration_seconds,
    batch_count,
    unhandled_request_state: Some(unhandled_request_state),
  })
}

// ── Plan helpers ──

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<KinoviHappyHorse1p0AspectRatio>, ArtcraftRouterError> {
  match aspect_ratio {
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(None),

    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => {
      Ok(Some(KinoviHappyHorse1p0AspectRatio::Landscape16x9))
    }
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => {
      Ok(Some(KinoviHappyHorse1p0AspectRatio::Portrait9x16))
    }
    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => {
      Ok(Some(KinoviHappyHorse1p0AspectRatio::Square1x1))
    }
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(KinoviHappyHorse1p0AspectRatio::Landscape4x3)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(KinoviHappyHorse1p0AspectRatio::Portrait3x4)),

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

fn nearest_aspect_ratio(aspect_ratio: CommonAspectRatio) -> KinoviHappyHorse1p0AspectRatio {
  match aspect_ratio {
    CommonAspectRatio::WideFiveByFour => KinoviHappyHorse1p0AspectRatio::Landscape4x3,
    CommonAspectRatio::WideThreeByTwo => KinoviHappyHorse1p0AspectRatio::Landscape4x3,
    CommonAspectRatio::WideTwentyOneByNine => KinoviHappyHorse1p0AspectRatio::Landscape16x9,
    CommonAspectRatio::TallFourByFive => KinoviHappyHorse1p0AspectRatio::Portrait3x4,
    CommonAspectRatio::TallTwoByThree => KinoviHappyHorse1p0AspectRatio::Portrait3x4,
    CommonAspectRatio::TallNineByTwentyOne => KinoviHappyHorse1p0AspectRatio::Portrait9x16,
    _ => KinoviHappyHorse1p0AspectRatio::Square1x1,
  }
}

// Happy Horse supports 720p and 1080p only (no 480p).
fn plan_output_resolution(
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<KinoviHappyHorse1p0OutputResolution>, ArtcraftRouterError> {
  match resolution {
    None => Ok(None),

    Some(CommonResolution::SevenTwentyP) => Ok(Some(KinoviHappyHorse1p0OutputResolution::SevenTwentyP)),
    Some(CommonResolution::TenEightyP) => Ok(Some(KinoviHappyHorse1p0OutputResolution::TenEightyP)),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => {
        Ok(Some(KinoviHappyHorse1p0OutputResolution::TenEightyP))
      }
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(KinoviHappyHorse1p0OutputResolution::SevenTwentyP))
      }
    },
  }
}

fn plan_batch_count(
  video_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<KinoviHappyHorse1p0BatchCount>, ArtcraftRouterError> {
  let count = video_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(None),
    2 => Ok(Some(KinoviHappyHorse1p0BatchCount::Two)),
    4 => Ok(Some(KinoviHappyHorse1p0BatchCount::Four)),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "video_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => {
        Ok(Some(if count >= 4 { KinoviHappyHorse1p0BatchCount::Four } else { KinoviHappyHorse1p0BatchCount::Two }))
      }
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(if count <= 2 { KinoviHappyHorse1p0BatchCount::Two } else { KinoviHappyHorse1p0BatchCount::Four }))
      }
    },
  }
}

// Happy Horse supports 4–15 seconds, defaults to 5.
fn plan_duration(
  duration_seconds: Option<u16>,
  _strategy: RequestMismatchMitigationStrategy,
) -> Result<u8, ArtcraftRouterError> {
  let seconds = duration_seconds.unwrap_or(5);
  Ok(seconds.clamp(4, 15) as u8)
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn default_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::HappyHorse1p0,
      provider: Provider::Seedance2Pro,
      ..Default::default()
    }
  }

  mod aspect_ratio_tests {
    use super::*;

    #[test]
    fn none_yields_none() {
      let r = plan_aspect_ratio(None, RequestMismatchMitigationStrategy::PayMoreUpgrade);
      assert!(r.unwrap().is_none());
    }

    #[test]
    fn auto_yields_none() {
      let r = plan_aspect_ratio(Some(CommonAspectRatio::Auto), RequestMismatchMitigationStrategy::PayMoreUpgrade);
      assert!(r.unwrap().is_none());
    }

    #[test]
    fn wide_16x9() {
      let r = plan_aspect_ratio(Some(CommonAspectRatio::WideSixteenByNine), RequestMismatchMitigationStrategy::PayMoreUpgrade);
      assert!(matches!(r.unwrap(), Some(KinoviHappyHorse1p0AspectRatio::Landscape16x9)));
    }

    #[test]
    fn tall_9x16() {
      let r = plan_aspect_ratio(Some(CommonAspectRatio::TallNineBySixteen), RequestMismatchMitigationStrategy::PayMoreUpgrade);
      assert!(matches!(r.unwrap(), Some(KinoviHappyHorse1p0AspectRatio::Portrait9x16)));
    }

    #[test]
    fn square() {
      let r = plan_aspect_ratio(Some(CommonAspectRatio::Square), RequestMismatchMitigationStrategy::PayMoreUpgrade);
      assert!(matches!(r.unwrap(), Some(KinoviHappyHorse1p0AspectRatio::Square1x1)));
    }

    #[test]
    fn unsupported_falls_back() {
      let r = plan_aspect_ratio(Some(CommonAspectRatio::WideFiveByFour), RequestMismatchMitigationStrategy::PayMoreUpgrade);
      assert!(matches!(r.unwrap(), Some(KinoviHappyHorse1p0AspectRatio::Landscape4x3)));
    }

    #[test]
    fn unsupported_errors_out() {
      let r = plan_aspect_ratio(Some(CommonAspectRatio::WideFiveByFour), RequestMismatchMitigationStrategy::ErrorOut);
      assert!(r.is_err());
    }
  }

  mod resolution_tests {
    use super::*;

    #[test]
    fn none_yields_none() {
      let r = plan_output_resolution(None, RequestMismatchMitigationStrategy::PayMoreUpgrade);
      assert!(r.unwrap().is_none());
    }

    #[test]
    fn seven_twenty_p() {
      let r = plan_output_resolution(Some(CommonResolution::SevenTwentyP), RequestMismatchMitigationStrategy::PayMoreUpgrade);
      assert!(matches!(r.unwrap(), Some(KinoviHappyHorse1p0OutputResolution::SevenTwentyP)));
    }

    #[test]
    fn ten_eighty_p() {
      let r = plan_output_resolution(Some(CommonResolution::TenEightyP), RequestMismatchMitigationStrategy::PayMoreUpgrade);
      assert!(matches!(r.unwrap(), Some(KinoviHappyHorse1p0OutputResolution::TenEightyP)));
    }

    #[test]
    fn unsupported_upgrades_to_1080p() {
      let r = plan_output_resolution(Some(CommonResolution::FourK), RequestMismatchMitigationStrategy::PayMoreUpgrade);
      assert!(matches!(r.unwrap(), Some(KinoviHappyHorse1p0OutputResolution::TenEightyP)));
    }

    #[test]
    fn unsupported_downgrades_to_720p() {
      let r = plan_output_resolution(Some(CommonResolution::FourK), RequestMismatchMitigationStrategy::PayLessDowngrade);
      assert!(matches!(r.unwrap(), Some(KinoviHappyHorse1p0OutputResolution::SevenTwentyP)));
    }

    #[test]
    fn unsupported_errors_out() {
      let r = plan_output_resolution(Some(CommonResolution::FourEightyP), RequestMismatchMitigationStrategy::ErrorOut);
      assert!(r.is_err());
    }
  }

  mod duration_tests {
    use super::*;

    #[test]
    fn default_is_5() {
      assert_eq!(plan_duration(None, RequestMismatchMitigationStrategy::PayMoreUpgrade).unwrap(), 5);
    }

    #[test]
    fn clamps_below_4() {
      assert_eq!(plan_duration(Some(1), RequestMismatchMitigationStrategy::PayMoreUpgrade).unwrap(), 4);
    }

    #[test]
    fn clamps_above_15() {
      assert_eq!(plan_duration(Some(30), RequestMismatchMitigationStrategy::PayMoreUpgrade).unwrap(), 15);
    }

    #[test]
    fn passes_through_valid() {
      assert_eq!(plan_duration(Some(8), RequestMismatchMitigationStrategy::PayMoreUpgrade).unwrap(), 8);
    }
  }

  #[test]
  fn build_succeeds_with_defaults() {
    let builder = default_builder();
    let result = build_kinovi_happy_horse_1p0(builder);
    assert!(result.is_ok());
  }
}

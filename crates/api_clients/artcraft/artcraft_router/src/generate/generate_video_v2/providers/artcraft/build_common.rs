use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio as CommonAspectRatioEnum;
use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;
use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_resolution::RouterResolution;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::artcraft::resolve::{
  resolve_audio_list_ref, resolve_character_list_ref, resolve_image_list_ref,
  resolve_image_ref, resolve_video_list_ref,
};

/// Which output resolutions a model supports.
#[derive(Copy, Clone)]
pub enum SupportedResolutions {
  /// 480p, 720p, 1080p
  Full,
  /// 480p, 720p only (1080p downgrades to 720p)
  Fast,
  /// 720p, 1080p only (480p upgrades)
  NoFourEightyP,
}

/// Which aspect ratios a model supports for the 21:9 ultra-wide slot.
#[derive(Copy, Clone)]
pub enum UltraWideSupport {
  /// 21:9 maps directly to WideTwentyOneByNine
  Supported,
  /// 21:9 is not a direct option; falls through to nearest_aspect_ratio
  Unsupported,
}

/// Build an `OmniGenVideoCostAndGenerateRequest` from the builder, using
/// model-specific configuration for the model enum variant, resolution
/// strategy, and ultra-wide aspect ratio support.
pub fn build_artcraft_omni_video_request(
  mut builder: GenerateVideoRequestBuilder,
  model: CommonVideoModelEnum,
  resolutions: SupportedResolutions,
  ultra_wide: UltraWideSupport,
) -> Result<OmniGenVideoCostAndGenerateRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio.take(), strategy, ultra_wide)?;
  let resolution = plan_output_resolution(builder.resolution.take(), strategy, resolutions)?;
  let batch_count = plan_batch_count(builder.video_batch_count.take(), strategy)?;
  let duration_seconds = plan_duration(builder.duration_seconds.take(), strategy)?;
  let prompt = builder.prompt.take();

  let start_frame = resolve_image_ref(builder.start_frame.take())?;
  let end_frame = resolve_image_ref(builder.end_frame.take())?;
  let reference_images = resolve_image_list_ref(builder.reference_images.take())?;
  let reference_videos = resolve_video_list_ref(builder.reference_videos.take())?;
  let reference_audio = resolve_audio_list_ref(builder.reference_audio.take())?;
  let reference_characters = resolve_character_list_ref(builder.reference_character_tokens.take());
  let idempotency_token = builder.get_or_generate_idempotency_token();

  Ok(OmniGenVideoCostAndGenerateRequest {
    model: Some(model),
    idempotency_token: Some(idempotency_token),
    prompt,
    start_frame_image_media_token: start_frame,
    end_frame_image_media_token: end_frame,
    reference_image_media_tokens: reference_images,
    reference_video_media_tokens: reference_videos,
    reference_audio_media_tokens: reference_audio,
    reference_character_tokens: reference_characters,
    resolution,
    aspect_ratio,
    duration_seconds: duration_seconds.map(|d| d as u16),
    video_batch_count: Some(batch_count),
    negative_prompt: None,
    generate_audio: None,
    quality: None,
  })
}

// ── Plan helpers ──

fn plan_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
  ultra_wide: UltraWideSupport,
) -> Result<Option<CommonAspectRatioEnum>, ArtcraftRouterError> {
  match aspect_ratio {
    None
    | Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto4k) => Ok(None),

    Some(RouterAspectRatio::WideSixteenByNine) | Some(RouterAspectRatio::Wide) => {
      Ok(Some(CommonAspectRatioEnum::WideSixteenByNine))
    }
    Some(RouterAspectRatio::TallNineBySixteen) | Some(RouterAspectRatio::Tall) => {
      Ok(Some(CommonAspectRatioEnum::TallNineBySixteen))
    }
    Some(RouterAspectRatio::Square) | Some(RouterAspectRatio::SquareHd) => {
      Ok(Some(CommonAspectRatioEnum::Square))
    }
    Some(RouterAspectRatio::WideFourByThree) => Ok(Some(CommonAspectRatioEnum::WideFourByThree)),
    Some(RouterAspectRatio::TallThreeByFour) => Ok(Some(CommonAspectRatioEnum::TallThreeByFour)),

    Some(RouterAspectRatio::WideTwentyOneByNine) => match ultra_wide {
      UltraWideSupport::Supported => Ok(Some(CommonAspectRatioEnum::WideTwentyOneByNine)),
      UltraWideSupport::Unsupported => match strategy {
        RequestMismatchMitigationStrategy::ErrorOut => {
          Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
            field: "aspect_ratio",
            value: format!("{:?}", RouterAspectRatio::WideTwentyOneByNine),
          }))
        }
        _ => Ok(Some(nearest_aspect_ratio(RouterAspectRatio::WideTwentyOneByNine))),
      },
    },

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

fn nearest_aspect_ratio(aspect_ratio: RouterAspectRatio) -> CommonAspectRatioEnum {
  match aspect_ratio {
    RouterAspectRatio::WideFiveByFour => CommonAspectRatioEnum::WideFourByThree,
    RouterAspectRatio::WideThreeByTwo => CommonAspectRatioEnum::WideFourByThree,
    RouterAspectRatio::WideTwentyOneByNine => CommonAspectRatioEnum::WideSixteenByNine,
    RouterAspectRatio::TallFourByFive => CommonAspectRatioEnum::TallThreeByFour,
    RouterAspectRatio::TallTwoByThree => CommonAspectRatioEnum::TallThreeByFour,
    RouterAspectRatio::TallNineByTwentyOne => CommonAspectRatioEnum::TallNineBySixteen,
    _ => CommonAspectRatioEnum::Square,
  }
}

fn plan_output_resolution(
  resolution: Option<RouterResolution>,
  strategy: RequestMismatchMitigationStrategy,
  supported: SupportedResolutions,
) -> Result<Option<CommonResolutionEnum>, ArtcraftRouterError> {
  match resolution {
    None => Ok(None),

    Some(RouterResolution::FourEightyP) => match supported {
      SupportedResolutions::Full | SupportedResolutions::Fast => {
        Ok(Some(CommonResolutionEnum::FourEightyP))
      }
      SupportedResolutions::NoFourEightyP => match strategy {
        RequestMismatchMitigationStrategy::ErrorOut => {
          Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
            field: "resolution",
            value: format!("{:?}", RouterResolution::FourEightyP),
          }))
        }
        RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(CommonResolutionEnum::TenEightyP)),
        RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(CommonResolutionEnum::SevenTwentyP)),
      },
    },

    Some(RouterResolution::SevenTwentyP) => Ok(Some(CommonResolutionEnum::SevenTwentyP)),

    Some(RouterResolution::TenEightyP) => match supported {
      SupportedResolutions::Full | SupportedResolutions::NoFourEightyP => {
        Ok(Some(CommonResolutionEnum::TenEightyP))
      }
      SupportedResolutions::Fast => match strategy {
        RequestMismatchMitigationStrategy::ErrorOut => {
          Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
            field: "resolution",
            value: format!("{:?}", RouterResolution::TenEightyP),
          }))
        }
        _ => Ok(Some(CommonResolutionEnum::SevenTwentyP)),
      },
    },

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => {
        Ok(Some(match (unsupported, supported) {
          (RouterResolution::HalfK, _) => CommonResolutionEnum::FourEightyP,
          (_, SupportedResolutions::Fast) => CommonResolutionEnum::SevenTwentyP,
          _ => CommonResolutionEnum::TenEightyP,
        }))
      }
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(match (unsupported, supported) {
          (RouterResolution::HalfK, _) => CommonResolutionEnum::FourEightyP,
          (_, SupportedResolutions::Fast) => CommonResolutionEnum::SevenTwentyP,
          _ => CommonResolutionEnum::TenEightyP,
        }))
      }
    },
  }
}

/// Batch counts: 1, 2, 4.
pub fn plan_batch_count(
  video_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<u16, ArtcraftRouterError> {
  let count = video_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 | 2 | 4 => Ok(count),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "video_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(4),
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(if count < 4 { 2 } else { 4 })
      }
    },
  }
}

/// Duration: 4-15 seconds.
pub fn plan_duration(
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

use crate::api::audio_list_ref::AudioListRef;
use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::api::video_list_ref::VideoListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use seedance2pro_client::requests::generate_video::generate_video::{KinoviBatchCount, KinoviOutputResolution, KinoviAspectRatio};

use crate::api::common_resolution::CommonResolution;

#[derive(Debug, Clone)]
pub struct PlanSeedance2proSeedance2p0Fast {
  pub prompt: Option<String>,
  pub start_frame_url: Option<String>,
  pub end_frame_url: Option<String>,
  pub reference_image_urls: Option<Vec<String>>,
  pub reference_video_urls: Option<Vec<String>>,
  pub reference_audio_urls: Option<Vec<String>>,
  pub aspect_ratio: KinoviAspectRatio,
  pub output_resolution: Option<KinoviOutputResolution>,
  pub duration_seconds: u8,
  pub batch_count: KinoviBatchCount,
}

pub fn plan_generate_video_seedance2pro_seedance2p0_fast(
  request: &GenerateVideoRequest,
) -> Result<VideoGenerationPlan, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let start_frame_url = resolve_image_ref_url(request.start_frame.clone())?;
  let end_frame_url = resolve_image_ref_url(request.end_frame.clone())?;
  let reference_image_urls = resolve_image_list_ref_urls(request.reference_images.clone())?;
  let reference_video_urls = resolve_video_list_ref_urls(request.reference_videos.clone())?;
  let reference_audio_urls = resolve_audio_list_ref_urls(request.reference_audio.clone())?;

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let batch_count = plan_batch_count(request.video_batch_count, strategy)?;
  let duration_seconds = plan_duration(request.duration_seconds, strategy)?;

  let output_resolution = request.resolution.map(map_common_resolution_to_kinovi);

  Ok(VideoGenerationPlan::Seedance2proSeedance2p0Fast(PlanSeedance2proSeedance2p0Fast {
    prompt: request.prompt.clone(),
    start_frame_url,
    end_frame_url,
    reference_image_urls,
    reference_video_urls,
    reference_audio_urls,
    aspect_ratio,
    output_resolution,
    duration_seconds,
    batch_count,
  }))
}

fn map_common_resolution_to_kinovi(resolution: CommonResolution) -> KinoviOutputResolution {
  match resolution {
    CommonResolution::FourEightyP => KinoviOutputResolution::FourEightyP,
    CommonResolution::SevenTwentyP => KinoviOutputResolution::SevenTwentyP,
    CommonResolution::TenEightyP => KinoviOutputResolution::SevenTwentyP, // NB: Kinovi doesn't have 1080p fast currently
    _ => KinoviOutputResolution::SevenTwentyP,
  }
}

fn resolve_image_ref_url(
  image_ref: Option<ImageRef>,
) -> Result<Option<String>, ArtcraftRouterError> {
  match image_ref {
    None => Ok(None),
    Some(ImageRef::Url(url)) => Ok(Some(url.to_string())),
    Some(ImageRef::MediaFileToken(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::Seedance2ProOnlySupportsUrls))
    }
  }
}

fn resolve_image_list_ref_urls(
  image_list_ref: Option<ImageListRef>,
) -> Result<Option<Vec<String>>, ArtcraftRouterError> {
  match image_list_ref {
    None => Ok(None),
    Some(ImageListRef::Urls(urls)) => Ok(Some(urls.clone())),
    Some(ImageListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::Seedance2ProOnlySupportsUrls))
    }
  }
}

fn resolve_video_list_ref_urls(
  video_list_ref: Option<VideoListRef>,
) -> Result<Option<Vec<String>>, ArtcraftRouterError> {
  match video_list_ref {
    None => Ok(None),
    Some(VideoListRef::Urls(urls)) => Ok(Some(urls.clone())),
    Some(VideoListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::Seedance2ProOnlySupportsUrls))
    }
  }
}

fn resolve_audio_list_ref_urls(
  audio_list_ref: Option<AudioListRef>,
) -> Result<Option<Vec<String>>, ArtcraftRouterError> {
  match audio_list_ref {
    None => Ok(None),
    Some(AudioListRef::Urls(urls)) => Ok(Some(urls.clone())),
    Some(AudioListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::Seedance2ProOnlySupportsUrls))
    }
  }
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<KinoviAspectRatio, ArtcraftRouterError> {
  match aspect_ratio {
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(KinoviAspectRatio::Landscape16x9),

    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => {
      Ok(KinoviAspectRatio::Landscape16x9)
    }
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => {
      Ok(KinoviAspectRatio::Portrait9x16)
    }
    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => {
      Ok(KinoviAspectRatio::Square1x1)
    }
    Some(CommonAspectRatio::WideFourByThree) => Ok(KinoviAspectRatio::Standard4x3),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(KinoviAspectRatio::Portrait3x4),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(nearest_resolution(unsupported))
      }
    },
  }
}

fn nearest_resolution(aspect_ratio: CommonAspectRatio) -> KinoviAspectRatio {
  match aspect_ratio {
    CommonAspectRatio::WideFiveByFour => KinoviAspectRatio::Standard4x3,
    CommonAspectRatio::WideThreeByTwo => KinoviAspectRatio::Standard4x3,
    CommonAspectRatio::WideTwentyOneByNine => KinoviAspectRatio::Landscape16x9,
    CommonAspectRatio::TallFourByFive => KinoviAspectRatio::Portrait3x4,
    CommonAspectRatio::TallTwoByThree => KinoviAspectRatio::Portrait3x4,
    CommonAspectRatio::TallNineByTwentyOne => KinoviAspectRatio::Portrait9x16,
    _ => KinoviAspectRatio::Square1x1,
  }
}

fn plan_batch_count(
  video_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<KinoviBatchCount, ArtcraftRouterError> {
  let count = video_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(KinoviBatchCount::One),
    2 => Ok(KinoviBatchCount::Two),
    4 => Ok(KinoviBatchCount::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "video_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => {
        Ok(if count < 4 { KinoviBatchCount::Four } else { KinoviBatchCount::Four })
      }
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(if count < 4 { KinoviBatchCount::Two } else { KinoviBatchCount::Four })
      }
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<u8, ArtcraftRouterError> {
  const MIN: u16 = 4;
  const MAX: u16 = 15;
  const DEFAULT: u8 = 5;
  match duration_seconds {
    None => Ok(DEFAULT),
    Some(d) if d >= MIN && d <= MAX => Ok(d as u8),
    Some(d) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", d),
        }))
      }
      _ => Ok(d.clamp(MIN, MAX) as u8),
    },
  }
}

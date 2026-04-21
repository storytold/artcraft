use seedance2pro_client::requests::generate_video::generate_video::{KinoviAspectRatio, KinoviBatchCount, KinoviOutputResolution};
use crate::api::audio_list_ref::AudioListRef;
use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::api::video_list_ref::VideoListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;

// Seedance 2.0 Pro supports output resolutions: 480p, 720p, 1080p.
pub (super) fn plan_output_resolution(
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<KinoviOutputResolution>, ArtcraftRouterError> {
  match resolution {
    None => Ok(None),

    // Direct mappings
    Some(CommonResolution::FourEightyP) => Ok(Some(KinoviOutputResolution::FourEightyP)),
    Some(CommonResolution::SevenTwentyP) => Ok(Some(KinoviOutputResolution::SevenTwentyP)),
    Some(CommonResolution::TenEightyP) => Ok(Some(KinoviOutputResolution::TenEightyP)),

    // Mismatches
    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => {
        Ok(Some(match unsupported {
          CommonResolution::HalfK => KinoviOutputResolution::FourEightyP,
          _ => KinoviOutputResolution::TenEightyP,
        }))
      }
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(match unsupported {
          CommonResolution::HalfK => KinoviOutputResolution::FourEightyP,
          _ => KinoviOutputResolution::TenEightyP,
        }))
      }
    },
  }
}

pub (super) fn resolve_image_ref_url(
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

pub (super) fn resolve_image_list_ref_urls(
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

pub (super) fn resolve_video_list_ref_urls(
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

pub (super) fn resolve_audio_list_ref_urls(
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

// Supported aspect ratios and their AR values (width / height):
//   Portrait9x16 = 0.5625, Portrait3x4 = 0.75, Square1x1 = 1.0, Standard4x3 = 1.33, Landscape16x9 = 1.78
//
// All supported ratios cost the same, so PayMoreUpgrade and PayLessDowngrade both
// select the nearest match rather than rounding in a specific direction.
pub (super) fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<KinoviAspectRatio, ArtcraftRouterError> {
  match aspect_ratio {
    // No preference or auto — default to landscape
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(KinoviAspectRatio::Landscape16x9),

    // Direct mappings
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
        Ok(nearest_resolution(unsupported))
      }
    },
  }
}

/// Pick the nearest supported resolution by AR value (width / height).
pub (super) fn nearest_resolution(aspect_ratio: CommonAspectRatio) -> KinoviAspectRatio {
  match aspect_ratio {
    CommonAspectRatio::WideFiveByFour => KinoviAspectRatio::Standard4x3,         // 1.25, nearest 1.33
    CommonAspectRatio::WideThreeByTwo => KinoviAspectRatio::Standard4x3,         // 1.50, nearest 1.33
    CommonAspectRatio::WideTwentyOneByNine => KinoviAspectRatio::Landscape16x9,  // 2.33, nearest 1.78
    CommonAspectRatio::TallFourByFive => KinoviAspectRatio::Portrait3x4,         // 0.80, nearest 0.75
    CommonAspectRatio::TallTwoByThree => KinoviAspectRatio::Portrait3x4,         // 0.67, nearest 0.75
    CommonAspectRatio::TallNineByTwentyOne => KinoviAspectRatio::Portrait9x16,   // 0.43, nearest 0.56
    _ => KinoviAspectRatio::Square1x1,
  }
}

// Seedance2p0 supports batch counts of 1, 2, and 4 only.
pub (super) fn plan_batch_count(
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

// Seedance2p0 supports duration of 4–15 seconds.
pub (super) fn plan_duration(
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

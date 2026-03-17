use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use muapi_client::requests::seedance_2p0_image_to_video::seedance_2p0_image_to_video::{
  AspectRatio as I2vAspectRatio,
  Duration as I2vDuration,
  Quality as I2vQuality,
};
use muapi_client::requests::seedance_2p0_text_to_video::seedance_2p0_text_to_video::{
  AspectRatio as T2vAspectRatio,
  Duration as T2vDuration,
  Quality as T2vQuality,
};

/// The generation mode determined at plan time.
/// Muapi has separate text-to-video and image-to-video endpoints.
/// If reference images are present, we use image-to-video; otherwise text-to-video.
#[derive(Debug, Clone)]
pub enum MuapiSeedance2p0Mode {
  TextToVideo {
    aspect_ratio: T2vAspectRatio,
    duration: T2vDuration,
    quality: T2vQuality,
  },
  ImageToVideo {
    image_urls: Vec<String>,
    aspect_ratio: I2vAspectRatio,
    duration: I2vDuration,
    quality: I2vQuality,
  },
}

#[derive(Debug, Clone)]
pub struct PlanMuapiSeedance2p0 {
  pub prompt: String,
  pub mode: MuapiSeedance2p0Mode,
}

pub fn plan_generate_video_muapi_seedance2p0<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  // Muapi does not support start/end frames, video references, or audio references.
  if request.start_frame.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "start_frame",
      value: "Muapi does not support start frame keyframes".to_string(),
    }));
  }
  if request.end_frame.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "end_frame",
      value: "Muapi does not support end frame keyframes".to_string(),
    }));
  }
  if request.reference_videos.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "reference_videos",
      value: "Muapi does not support video references".to_string(),
    }));
  }
  if request.reference_audio.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "reference_audio",
      value: "Muapi does not support audio references".to_string(),
    }));
  }

  let image_urls = resolve_image_urls(request.reference_images)?;

  let prompt = request.prompt.unwrap_or("").to_string();

  let mode = match image_urls {
    Some(urls) => {
      MuapiSeedance2p0Mode::ImageToVideo {
        image_urls: urls,
        aspect_ratio: plan_i2v_aspect_ratio(request.aspect_ratio, strategy)?,
        duration: plan_i2v_duration(request.duration_seconds, strategy)?,
        quality: I2vQuality::High, // NB: "Low" is a "fast" mode, I think
      }
    }
    None => {
      MuapiSeedance2p0Mode::TextToVideo {
        aspect_ratio: plan_t2v_aspect_ratio(request.aspect_ratio, strategy)?,
        duration: plan_t2v_duration(request.duration_seconds, strategy)?,
        quality: T2vQuality::High, // NB: "Low" is a "fast" mode, I think
      }
    }
  };

  Ok(VideoGenerationPlan::MuapiSeedance2p0(PlanMuapiSeedance2p0 {
    prompt,
    mode,
  }))
}

fn resolve_image_urls(
  reference_images: Option<ImageListRef<'_>>,
) -> Result<Option<Vec<String>>, ArtcraftRouterError> {
  match reference_images {
    None => Ok(None),
    Some(ImageListRef::Urls(urls)) => {
      if urls.is_empty() {
        Ok(None)
      } else {
        Ok(Some(urls.clone()))
      }
    }
    Some(ImageListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::MuapiOnlySupportsUrls))
    }
  }
}

// Muapi supports: 16:9, 9:16, 4:3, 3:4 (no square, no 1:1)
fn plan_t2v_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<T2vAspectRatio, ArtcraftRouterError> {
  match aspect_ratio {
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(T2vAspectRatio::Landscape16x9),

    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => {
      Ok(T2vAspectRatio::Landscape16x9)
    }
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => {
      Ok(T2vAspectRatio::Portrait9x16)
    }
    Some(CommonAspectRatio::WideFourByThree) => Ok(T2vAspectRatio::Standard4x3),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(T2vAspectRatio::Portrait3x4),

    // Square and others are not supported by Muapi
    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(nearest_t2v_aspect_ratio(unsupported))
      }
    },
  }
}

fn nearest_t2v_aspect_ratio(aspect_ratio: CommonAspectRatio) -> T2vAspectRatio {
  match aspect_ratio {
    // Wide ratios → nearest wide
    CommonAspectRatio::Square | CommonAspectRatio::SquareHd
    | CommonAspectRatio::WideFiveByFour => T2vAspectRatio::Standard4x3,
    CommonAspectRatio::WideThreeByTwo => T2vAspectRatio::Landscape16x9,
    CommonAspectRatio::WideTwentyOneByNine => T2vAspectRatio::Landscape16x9,
    // Tall ratios → nearest tall
    CommonAspectRatio::TallFourByFive => T2vAspectRatio::Portrait3x4,
    CommonAspectRatio::TallTwoByThree => T2vAspectRatio::Portrait9x16,
    CommonAspectRatio::TallNineByTwentyOne => T2vAspectRatio::Portrait9x16,
    _ => T2vAspectRatio::Landscape16x9,
  }
}

fn plan_i2v_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<I2vAspectRatio, ArtcraftRouterError> {
  match aspect_ratio {
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(I2vAspectRatio::Landscape16x9),

    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => {
      Ok(I2vAspectRatio::Landscape16x9)
    }
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => {
      Ok(I2vAspectRatio::Portrait9x16)
    }
    Some(CommonAspectRatio::WideFourByThree) => Ok(I2vAspectRatio::Standard4x3),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(I2vAspectRatio::Portrait3x4),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(nearest_i2v_aspect_ratio(unsupported))
      }
    },
  }
}

fn nearest_i2v_aspect_ratio(aspect_ratio: CommonAspectRatio) -> I2vAspectRatio {
  match aspect_ratio {
    CommonAspectRatio::Square | CommonAspectRatio::SquareHd
    | CommonAspectRatio::WideFiveByFour => I2vAspectRatio::Standard4x3,
    CommonAspectRatio::WideThreeByTwo => I2vAspectRatio::Landscape16x9,
    CommonAspectRatio::WideTwentyOneByNine => I2vAspectRatio::Landscape16x9,
    CommonAspectRatio::TallFourByFive => I2vAspectRatio::Portrait3x4,
    CommonAspectRatio::TallTwoByThree => I2vAspectRatio::Portrait9x16,
    CommonAspectRatio::TallNineByTwentyOne => I2vAspectRatio::Portrait9x16,
    _ => I2vAspectRatio::Landscape16x9,
  }
}

// Muapi supports durations of 5, 10, and 15 seconds.
fn plan_t2v_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<T2vDuration, ArtcraftRouterError> {
  let d = duration_seconds.unwrap_or(5);
  match d {
    0..=5 => Ok(T2vDuration::FiveSeconds),
    6..=10 => Ok(T2vDuration::TenSeconds),
    11..=15 => Ok(T2vDuration::FifteenSeconds),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", d),
        }))
      }
      _ => Ok(T2vDuration::FifteenSeconds), // clamp to max
    },
  }
}

fn plan_i2v_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<I2vDuration, ArtcraftRouterError> {
  let d = duration_seconds.unwrap_or(5);
  match d {
    0..=5 => Ok(I2vDuration::FiveSeconds),
    6..=10 => Ok(I2vDuration::TenSeconds),
    11..=15 => Ok(I2vDuration::FifteenSeconds),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", d),
        }))
      }
      _ => Ok(I2vDuration::FifteenSeconds),
    },
  }
}

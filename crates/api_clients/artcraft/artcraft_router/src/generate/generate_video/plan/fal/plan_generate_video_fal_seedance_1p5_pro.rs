use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_1_6_pro::optional_url;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;

#[derive(Debug, Clone, Copy)]
pub enum FalSeedance1p5ProAspectRatio {
  Auto,
  TwentyOneByNine,
  SixteenByNine,
  FourByThree,
  Square,
  ThreeByFour,
  NineBySixteen,
}

#[derive(Debug, Clone, Copy)]
pub enum FalSeedance1p5ProResolution {
  FourEightyP,
  SevenTwentyP,
  TenEightyP,
}

#[derive(Debug, Clone, Copy)]
pub enum FalSeedance1p5ProDuration {
  Four,
  Five,
  Six,
  Seven,
  Eight,
  Nine,
  Ten,
  Eleven,
  Twelve,
}

#[derive(Debug, Clone)]
pub enum FalSeedance1p5ProMode {
  TextToVideo,
  ImageToVideo {
    image_url: String,
    end_image_url: Option<String>,
  },
}

#[derive(Debug, Clone)]
pub struct PlanFalSeedance1p5Pro {
  pub prompt: String,
  pub mode: FalSeedance1p5ProMode,
  pub aspect_ratio: Option<FalSeedance1p5ProAspectRatio>,
  pub resolution: Option<FalSeedance1p5ProResolution>,
  pub duration: Option<FalSeedance1p5ProDuration>,
  pub generate_audio: Option<bool>,
}

pub fn plan_generate_video_fal_seedance_1p5_pro<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let mode = match optional_url(request.start_frame)? {
    None => {
      if request.end_frame.is_some() {
        return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "end_frame",
          value: "Seedance 1.5 Pro requires a start_frame when end_frame is provided".to_string(),
        }));
      }
      FalSeedance1p5ProMode::TextToVideo
    }
    Some(image_url) => FalSeedance1p5ProMode::ImageToVideo {
      image_url,
      end_image_url: optional_url(request.end_frame)?,
    },
  };

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let resolution = plan_resolution(request.resolution, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::FalSeedance1p5Pro(PlanFalSeedance1p5Pro {
    prompt: request.prompt.unwrap_or("").to_string(),
    mode,
    aspect_ratio,
    resolution,
    duration,
    generate_audio: request.generate_audio,
  }))
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<FalSeedance1p5ProAspectRatio>, ArtcraftRouterError> {
  use FalSeedance1p5ProAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(None),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Some(Ar::Auto)),

    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Some(Ar::Square)),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(Ar::FourByThree)),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(Ar::SixteenByNine)),
    Some(CommonAspectRatio::WideTwentyOneByNine) => Ok(Some(Ar::TwentyOneByNine)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(Ar::ThreeByFour)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Some(Ar::NineBySixteen)),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      _ => Ok(Some(nearest_aspect_ratio(unsupported))),
    },
  }
}

/// Pick the nearest supported aspect ratio for unsupported inputs.
fn nearest_aspect_ratio(aspect_ratio: CommonAspectRatio) -> FalSeedance1p5ProAspectRatio {
  use FalSeedance1p5ProAspectRatio as Ar;
  match aspect_ratio {
    // Wide unsupported → nearest wide
    CommonAspectRatio::WideFiveByFour => Ar::FourByThree,     // 1.25 → 1.33
    CommonAspectRatio::WideThreeByTwo => Ar::FourByThree,      // 1.50 → 1.33
    // Tall unsupported → nearest tall
    CommonAspectRatio::TallFourByFive => Ar::ThreeByFour,     // 0.80 → 0.75
    CommonAspectRatio::TallTwoByThree => Ar::ThreeByFour,     // 0.67 → 0.75
    CommonAspectRatio::TallNineByTwentyOne => Ar::NineBySixteen, // 0.43 → 0.56
    // Anything else → Square
    _ => Ar::Square,
  }
}

fn plan_resolution(
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<FalSeedance1p5ProResolution>, ArtcraftRouterError> {
  use FalSeedance1p5ProResolution as R;
  match resolution {
    None => Ok(None),
    Some(CommonResolution::FourEightyP) => Ok(Some(R::FourEightyP)),
    Some(CommonResolution::SevenTwentyP) => Ok(Some(R::SevenTwentyP)),
    Some(CommonResolution::TenEightyP) => Ok(Some(R::TenEightyP)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(R::TenEightyP)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(R::FourEightyP)),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<FalSeedance1p5ProDuration>, ArtcraftRouterError> {
  use FalSeedance1p5ProDuration as D;
  match duration_seconds {
    None => Ok(None),
    Some(4) => Ok(Some(D::Four)),
    Some(5) => Ok(Some(D::Five)),
    Some(6) => Ok(Some(D::Six)),
    Some(7) => Ok(Some(D::Seven)),
    Some(8) => Ok(Some(D::Eight)),
    Some(9) => Ok(Some(D::Nine)),
    Some(10) => Ok(Some(D::Ten)),
    Some(11) => Ok(Some(D::Eleven)),
    Some(12) => Ok(Some(D::Twelve)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(D::Twelve)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(D::Four)),
    },
  }
}

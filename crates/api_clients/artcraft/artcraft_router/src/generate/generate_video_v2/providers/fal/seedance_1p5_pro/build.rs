use fal_client::requests::webhook::video::image::enqueue_seedance_1p5_pro_image_to_video_webhook::{
  EnqueueSeedance1p5ProImageToVideoAspectRatio, EnqueueSeedance1p5ProImageToVideoDuration,
  EnqueueSeedance1p5ProImageToVideoRequest, EnqueueSeedance1p5ProImageToVideoResolution,
};
use fal_client::requests::webhook::video::text::enqueue_seedance_1p5_pro_text_to_video_webhook::{
  EnqueueSeedance1p5ProTextToVideoAspectRatio, EnqueueSeedance1p5ProTextToVideoDuration,
  EnqueueSeedance1p5ProTextToVideoRequest, EnqueueSeedance1p5ProTextToVideoResolution,
};

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::fal::seedance_1p5_pro::request::{
  FalSeedance1p5ProMode, FalSeedance1p5ProRequestState,
};
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

// Resolution / duration / aspect-ratio variants used for planning. Mirrors the
// v1 plan types, but lives entirely inside this module so the v2 dir is self-contained.
#[derive(Debug, Clone, Copy, Eq, PartialEq)]
enum PlanResolution {
  FourEightyP,
  SevenTwentyP,
  TenEightyP,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
enum PlanDuration {
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

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
enum PlanAspectRatio {
  Auto,
  TwentyOneByNine,
  SixteenByNine,
  FourByThree,
  Square,
  ThreeByFour,
  NineBySixteen,
}

pub fn build_fal_seedance_1p5_pro(
  mut builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // Decide t2v vs i2v based on whether a start_frame was provided.
  let image_url = optional_url(builder.start_frame.take())?;
  let end_image_url = optional_url(builder.end_frame.take())?;

  if image_url.is_none() && end_image_url.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "end_frame",
      value: "Seedance 1.5 Pro requires a start_frame when end_frame is provided".to_string(),
    }));
  }

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio.take(), strategy)?;
  let resolution = plan_resolution(builder.resolution.take(), strategy)?;
  let duration = plan_duration(builder.duration_seconds.take(), strategy)?;
  let prompt = builder.prompt.take().unwrap_or_default();
  let generate_audio = builder.generate_audio.take();

  let mode = match image_url {
    None => FalSeedance1p5ProMode::TextToVideo(EnqueueSeedance1p5ProTextToVideoRequest {
      prompt,
      resolution: resolution.map(to_t2v_resolution),
      duration: duration.map(to_t2v_duration),
      aspect_ratio: aspect_ratio.map(to_t2v_aspect_ratio),
      generate_audio,
    }),
    Some(image_url) => FalSeedance1p5ProMode::ImageToVideo(EnqueueSeedance1p5ProImageToVideoRequest {
      prompt,
      image_url,
      end_image_url,
      resolution: resolution.map(to_i2v_resolution),
      duration: duration.map(to_i2v_duration),
      aspect_ratio: aspect_ratio.map(to_i2v_aspect_ratio),
      generate_audio,
    }),
  };

  let state = FalSeedance1p5ProRequestState { mode };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalSeedance1p5Pro(state)))
}

// ── Plan helpers (kept in sync with v1 plan_generate_video_fal_seedance_1p5_pro.rs) ──

fn optional_url(image_ref: Option<ImageRef>) -> Result<Option<String>, ArtcraftRouterError> {
  match image_ref {
    None => Ok(None),
    Some(ImageRef::Url(url)) => Ok(Some(url)),
    Some(ImageRef::MediaFileToken(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "start_frame/end_frame",
        value: "Fal only supports image URLs, not media file tokens".to_string(),
      }))
    }
  }
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<PlanAspectRatio>, ArtcraftRouterError> {
  use PlanAspectRatio as Ar;
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
fn nearest_aspect_ratio(aspect_ratio: CommonAspectRatio) -> PlanAspectRatio {
  use PlanAspectRatio as Ar;
  match aspect_ratio {
    CommonAspectRatio::WideFiveByFour => Ar::FourByThree,
    CommonAspectRatio::WideThreeByTwo => Ar::FourByThree,
    CommonAspectRatio::TallFourByFive => Ar::ThreeByFour,
    CommonAspectRatio::TallTwoByThree => Ar::ThreeByFour,
    CommonAspectRatio::TallNineByTwentyOne => Ar::NineBySixteen,
    _ => Ar::Square,
  }
}

fn plan_resolution(
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<PlanResolution>, ArtcraftRouterError> {
  use PlanResolution as R;
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
) -> Result<Option<PlanDuration>, ArtcraftRouterError> {
  use PlanDuration as D;
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

// ── PlanXxx → fal_client request enum mapping ──

fn to_t2v_resolution(r: PlanResolution) -> EnqueueSeedance1p5ProTextToVideoResolution {
  use EnqueueSeedance1p5ProTextToVideoResolution as R;
  match r {
    PlanResolution::FourEightyP => R::FourEightyP,
    PlanResolution::SevenTwentyP => R::SevenTwentyP,
    PlanResolution::TenEightyP => R::TenEightyP,
  }
}

fn to_t2v_duration(d: PlanDuration) -> EnqueueSeedance1p5ProTextToVideoDuration {
  use EnqueueSeedance1p5ProTextToVideoDuration as D;
  match d {
    PlanDuration::Four => D::FourSeconds,
    PlanDuration::Five => D::FiveSeconds,
    PlanDuration::Six => D::SixSeconds,
    PlanDuration::Seven => D::SevenSeconds,
    PlanDuration::Eight => D::EightSeconds,
    PlanDuration::Nine => D::NineSeconds,
    PlanDuration::Ten => D::TenSeconds,
    PlanDuration::Eleven => D::ElevenSeconds,
    PlanDuration::Twelve => D::TwelveSeconds,
  }
}

fn to_t2v_aspect_ratio(a: PlanAspectRatio) -> EnqueueSeedance1p5ProTextToVideoAspectRatio {
  use EnqueueSeedance1p5ProTextToVideoAspectRatio as Ar;
  match a {
    PlanAspectRatio::Auto => Ar::Auto,
    PlanAspectRatio::TwentyOneByNine => Ar::TwentyOneByNine,
    PlanAspectRatio::SixteenByNine => Ar::SixteenByNine,
    PlanAspectRatio::FourByThree => Ar::FourByThree,
    PlanAspectRatio::Square => Ar::Square,
    PlanAspectRatio::ThreeByFour => Ar::ThreeByFour,
    PlanAspectRatio::NineBySixteen => Ar::NineBySixteen,
  }
}

fn to_i2v_resolution(r: PlanResolution) -> EnqueueSeedance1p5ProImageToVideoResolution {
  use EnqueueSeedance1p5ProImageToVideoResolution as R;
  match r {
    PlanResolution::FourEightyP => R::FourEightyP,
    PlanResolution::SevenTwentyP => R::SevenTwentyP,
    PlanResolution::TenEightyP => R::TenEightyP,
  }
}

fn to_i2v_duration(d: PlanDuration) -> EnqueueSeedance1p5ProImageToVideoDuration {
  use EnqueueSeedance1p5ProImageToVideoDuration as D;
  match d {
    PlanDuration::Four => D::FourSeconds,
    PlanDuration::Five => D::FiveSeconds,
    PlanDuration::Six => D::SixSeconds,
    PlanDuration::Seven => D::SevenSeconds,
    PlanDuration::Eight => D::EightSeconds,
    PlanDuration::Nine => D::NineSeconds,
    PlanDuration::Ten => D::TenSeconds,
    PlanDuration::Eleven => D::ElevenSeconds,
    PlanDuration::Twelve => D::TwelveSeconds,
  }
}

fn to_i2v_aspect_ratio(a: PlanAspectRatio) -> EnqueueSeedance1p5ProImageToVideoAspectRatio {
  use EnqueueSeedance1p5ProImageToVideoAspectRatio as Ar;
  match a {
    PlanAspectRatio::Auto => Ar::Auto,
    PlanAspectRatio::TwentyOneByNine => Ar::TwentyOneByNine,
    PlanAspectRatio::SixteenByNine => Ar::SixteenByNine,
    PlanAspectRatio::FourByThree => Ar::FourByThree,
    PlanAspectRatio::Square => Ar::Square,
    PlanAspectRatio::ThreeByFour => Ar::ThreeByFour,
    PlanAspectRatio::NineBySixteen => Ar::NineBySixteen,
  }
}

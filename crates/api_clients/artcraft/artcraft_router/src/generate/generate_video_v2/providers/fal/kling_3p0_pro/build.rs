use fal_client::requests::webhook::video::image::enqueue_kling_3p0_pro_image_to_video_webhook::{
  EnqueueKling3p0ProImageToVideoAspectRatio, EnqueueKling3p0ProImageToVideoDuration,
  EnqueueKling3p0ProImageToVideoRequest,
};
use fal_client::requests::webhook::video::text::enqueue_kling_3p0_pro_text_to_video_webhook::{
  EnqueueKling3p0ProTextToVideoAspectRatio, EnqueueKling3p0ProTextToVideoDuration,
  EnqueueKling3p0ProTextToVideoRequest,
};

use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::fal::kling_1_6_pro::build::optional_url;
use crate::generate::generate_video_v2::providers::fal::kling_3p0_pro::request::{
  FalKling3p0ProMode, FalKling3p0ProRequestState,
};
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

#[derive(Debug, Clone, Copy)]
pub(crate) enum PlanAspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
}

/// 3-15 seconds inclusive — represented as a `u8` because the fal_client side
/// has 13 enum variants (Three..Fifteen). Stored here so the cost calculator
/// can recover the exact second count for billing.
#[derive(Debug, Clone, Copy)]
pub(crate) struct PlanDuration(pub u8);

const MIN_DURATION: u16 = 3;
const MAX_DURATION: u16 = 15;

pub fn build_fal_kling_3p0_pro(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_kling_3p0_pro_state(builder)?;
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling3p0Pro(state)))
}

fn build_kling_3p0_pro_state(
  builder: GenerateVideoRequestBuilder,
) -> Result<FalKling3p0ProRequestState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
  let duration = plan_duration(builder.duration_seconds, strategy)?;
  let prompt = builder.prompt.clone().unwrap_or_default();
  let negative_prompt = builder.negative_prompt.clone();
  let generate_audio = builder.generate_audio;

  let mode = match optional_url(builder.start_frame.clone())? {
    None => {
      if builder.end_frame.is_some() {
        return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "end_frame",
          value: "Kling 3.0 Pro requires a start_frame when end_frame is provided".to_string(),
        }));
      }
      FalKling3p0ProMode::TextToVideo(EnqueueKling3p0ProTextToVideoRequest {
        prompt,
        generate_audio,
        negative_prompt,
        duration: duration.map(to_t2v_duration),
        aspect_ratio: aspect_ratio.map(to_t2v_aspect_ratio),
        shot_type: None,
      })
    }
    Some(image_url) => FalKling3p0ProMode::ImageToVideo(EnqueueKling3p0ProImageToVideoRequest {
      prompt,
      image_url,
      end_image_url: optional_url(builder.end_frame.clone())?,
      generate_audio,
      negative_prompt,
      duration: duration.map(to_i2v_duration),
      aspect_ratio: aspect_ratio.map(to_i2v_aspect_ratio),
      shot_type: None,
    }),
  };

  Ok(FalKling3p0ProRequestState { mode })
}

pub(crate) fn plan_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<PlanAspectRatio>, ArtcraftRouterError> {
  use PlanAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(None),

    Some(RouterAspectRatio::Square) | Some(RouterAspectRatio::SquareHd) => Ok(Some(Ar::Square)),
    Some(RouterAspectRatio::WideSixteenByNine) | Some(RouterAspectRatio::Wide) => Ok(Some(Ar::SixteenByNine)),
    Some(RouterAspectRatio::TallNineBySixteen) | Some(RouterAspectRatio::Tall) => Ok(Some(Ar::NineBySixteen)),

    Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto4k) => Ok(Some(Ar::SixteenByNine)),

    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", other),
        }))
      }
      _ => Ok(Some(Ar::SixteenByNine)),
    },
  }
}

pub(crate) fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<PlanDuration>, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(None),
    Some(d) if (MIN_DURATION..=MAX_DURATION).contains(&d) => Ok(Some(PlanDuration(d as u8))),
    Some(d) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", d),
        }))
      }
      _ => Ok(Some(PlanDuration(d.clamp(MIN_DURATION, MAX_DURATION) as u8))),
    },
  }
}

fn to_t2v_duration(d: PlanDuration) -> EnqueueKling3p0ProTextToVideoDuration {
  use EnqueueKling3p0ProTextToVideoDuration as D;
  match d.0 {
    3 => D::ThreeSeconds,
    4 => D::FourSeconds,
    5 => D::FiveSeconds,
    6 => D::SixSeconds,
    7 => D::SevenSeconds,
    8 => D::EightSeconds,
    9 => D::NineSeconds,
    10 => D::TenSeconds,
    11 => D::ElevenSeconds,
    12 => D::TwelveSeconds,
    13 => D::ThirteenSeconds,
    14 => D::FourteenSeconds,
    _ => D::FifteenSeconds,
  }
}

fn to_i2v_duration(d: PlanDuration) -> EnqueueKling3p0ProImageToVideoDuration {
  use EnqueueKling3p0ProImageToVideoDuration as D;
  match d.0 {
    3 => D::ThreeSeconds,
    4 => D::FourSeconds,
    5 => D::FiveSeconds,
    6 => D::SixSeconds,
    7 => D::SevenSeconds,
    8 => D::EightSeconds,
    9 => D::NineSeconds,
    10 => D::TenSeconds,
    11 => D::ElevenSeconds,
    12 => D::TwelveSeconds,
    13 => D::ThirteenSeconds,
    14 => D::FourteenSeconds,
    _ => D::FifteenSeconds,
  }
}

fn to_t2v_aspect_ratio(a: PlanAspectRatio) -> EnqueueKling3p0ProTextToVideoAspectRatio {
  match a {
    PlanAspectRatio::Square => EnqueueKling3p0ProTextToVideoAspectRatio::Square,
    PlanAspectRatio::SixteenByNine => EnqueueKling3p0ProTextToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => EnqueueKling3p0ProTextToVideoAspectRatio::NineBySixteen,
  }
}

fn to_i2v_aspect_ratio(a: PlanAspectRatio) -> EnqueueKling3p0ProImageToVideoAspectRatio {
  match a {
    PlanAspectRatio::Square => EnqueueKling3p0ProImageToVideoAspectRatio::Square,
    PlanAspectRatio::SixteenByNine => EnqueueKling3p0ProImageToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => EnqueueKling3p0ProImageToVideoAspectRatio::NineBySixteen,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;

  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Kling3p0Pro,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      ..Default::default()
    }
  }

  #[test]
  fn no_start_frame_picks_t2v() {
    let result = build_fal_kling_3p0_pro(base_builder()).expect("build");
    if let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling3p0Pro(s)) = result {
      assert!(matches!(s.mode, FalKling3p0ProMode::TextToVideo(_)));
    } else { panic!("expected FalKling3p0Pro"); }
  }

  #[test]
  fn end_frame_without_start_frame_errors() {
    let mut b = base_builder();
    b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
    assert!(build_fal_kling_3p0_pro(b).is_err());
  }

  #[test]
  fn duration_3s_accepted() {
    let mut b = base_builder();
    b.duration_seconds = Some(3);
    assert!(build_fal_kling_3p0_pro(b).is_ok());
  }

  #[test]
  fn duration_15s_accepted() {
    let mut b = base_builder();
    b.duration_seconds = Some(15);
    assert!(build_fal_kling_3p0_pro(b).is_ok());
  }

  #[test]
  fn duration_out_of_range_errors_with_error_out() {
    let mut b = base_builder();
    b.duration_seconds = Some(2);
    b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
    assert!(build_fal_kling_3p0_pro(b).is_err());
  }

  #[test]
  fn duration_out_of_range_clamps_with_pay_less() {
    let mut b = base_builder();
    b.duration_seconds = Some(20);
    b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayLessDowngrade;
    assert!(build_fal_kling_3p0_pro(b).is_ok());
  }

  use crate::generate::generate_video_v2::providers::fal::kling_3p0_pro::request::FalKling3p0ProMode;
}

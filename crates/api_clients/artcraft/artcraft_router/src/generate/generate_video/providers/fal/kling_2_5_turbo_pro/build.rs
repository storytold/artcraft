use fal_client::requests::api::video::image::kling_2p5_turbo_pro_image_to_video::api::{
  Kling2p5TurboProImageToVideoDuration, Kling2p5TurboProImageToVideoRequest,
};
use fal_client::requests::api::video::text::kling_2p5_turbo_pro_text_to_video::api::{
  Kling2p5TurboProTextToVideoAspectRatio, Kling2p5TurboProTextToVideoDuration,
  Kling2p5TurboProTextToVideoRequest,
};

use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::fal::kling_1_6_pro::build::optional_url;
use crate::generate::generate_video::providers::fal::kling_2_5_turbo_pro::request::{
  FalKling2p5TurboProMode, FalKling2p5TurboProRequestState,
};
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

#[derive(Debug, Clone, Copy)]
pub(crate) enum PlanAspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
}

#[derive(Debug, Clone, Copy)]
pub(crate) enum PlanDuration {
  Five,
  Ten,
}

pub fn build_fal_kling_2_5_turbo_pro(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
  let duration = plan_duration(builder.duration_seconds, strategy)?;
  let prompt = builder.prompt.clone().unwrap_or_default();
  let negative_prompt = builder.negative_prompt.clone();

  let mode = match optional_url(builder.start_frame.clone())? {
    None => {
      if builder.end_frame.is_some() {
        return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "end_frame",
          value: "Kling 2.5 Turbo Pro requires a start_frame when end_frame is provided".to_string(),
        }));
      }
      FalKling2p5TurboProMode::TextToVideo(Kling2p5TurboProTextToVideoRequest {
        prompt,
        negative_prompt,
        duration: duration.map(to_t2v_duration),
        aspect_ratio: aspect_ratio.map(to_t2v_aspect_ratio),
        cfg_scale: None,
      })
    }
    Some(image_url) => FalKling2p5TurboProMode::ImageToVideo(Kling2p5TurboProImageToVideoRequest {
      prompt,
      image_url,
      tail_image_url: optional_url(builder.end_frame.clone())?,
      duration: duration.map(to_i2v_duration),
      negative_prompt,
      cfg_scale: None,
    }),
  };

  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling2p5TurboPro(
    FalKling2p5TurboProRequestState { mode },
  )))
}

fn plan_aspect_ratio(
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

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<PlanDuration>, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(None),
    Some(5) => Ok(Some(PlanDuration::Five)),
    Some(10) => Ok(Some(PlanDuration::Ten)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(PlanDuration::Ten)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(PlanDuration::Five)),
    },
  }
}

fn to_t2v_duration(d: PlanDuration) -> Kling2p5TurboProTextToVideoDuration {
  match d {
    PlanDuration::Five => Kling2p5TurboProTextToVideoDuration::FiveSeconds,
    PlanDuration::Ten => Kling2p5TurboProTextToVideoDuration::TenSeconds,
  }
}

fn to_t2v_aspect_ratio(a: PlanAspectRatio) -> Kling2p5TurboProTextToVideoAspectRatio {
  match a {
    PlanAspectRatio::Square => Kling2p5TurboProTextToVideoAspectRatio::Square,
    PlanAspectRatio::SixteenByNine => Kling2p5TurboProTextToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => Kling2p5TurboProTextToVideoAspectRatio::NineBySixteen,
  }
}

fn to_i2v_duration(d: PlanDuration) -> Kling2p5TurboProImageToVideoDuration {
  match d {
    PlanDuration::Five => Kling2p5TurboProImageToVideoDuration::FiveSeconds,
    PlanDuration::Ten => Kling2p5TurboProImageToVideoDuration::TenSeconds,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_video_model::RouterVideoModel;

  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Kling2p5TurboPro,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      ..Default::default()
    }
  }

  #[test]
  fn no_start_frame_picks_t2v() {
    let result = build_fal_kling_2_5_turbo_pro(base_builder()).expect("build");
    let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling2p5TurboPro(s)) = result else {
      panic!("expected FalKling2p5TurboPro");
    };
    assert!(matches!(s.mode, FalKling2p5TurboProMode::TextToVideo(_)));
  }

  #[test]
  fn start_frame_picks_i2v() {
    let mut b = base_builder();
    b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
    let result = build_fal_kling_2_5_turbo_pro(b).expect("build");
    let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling2p5TurboPro(s)) = result else {
      panic!("expected FalKling2p5TurboPro");
    };
    assert!(matches!(s.mode, FalKling2p5TurboProMode::ImageToVideo(_)));
  }

  #[test]
  fn end_frame_without_start_frame_errors() {
    let mut b = base_builder();
    b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
    assert!(build_fal_kling_2_5_turbo_pro(b).is_err());
  }

  #[test]
  fn tail_image_url_propagates() {
    let mut b = base_builder();
    b.start_frame = Some(ImageRef::Url("https://example.com/start.png".to_string()));
    b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
    let result = build_fal_kling_2_5_turbo_pro(b).expect("build");
    let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling2p5TurboPro(s)) = result else {
      panic!("expected FalKling2p5TurboPro");
    };
    let FalKling2p5TurboProMode::ImageToVideo(req) = s.mode else {
      panic!("expected ImageToVideo");
    };
    assert_eq!(req.tail_image_url.as_deref(), Some("https://example.com/end.png"));
  }
}

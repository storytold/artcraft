use fal_client::requests::api::video::image::kling_2p6_pro_image_to_video::api::{
  Kling2p6ProImageToVideoDuration, Kling2p6ProImageToVideoRequest,
};
use fal_client::requests::api::video::text::kling_2p6_pro_text_to_video::api::{
  Kling2p6ProTextToVideoAspectRatio, Kling2p6ProTextToVideoDuration,
  Kling2p6ProTextToVideoRequest,
};

use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::fal::kling_1_6_pro::build::optional_url;
use crate::generate::generate_video::providers::fal::kling_2_6_pro::request::{
  FalKling2p6ProMode, FalKling2p6ProRequestState,
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

pub fn build_fal_kling_2_6_pro(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
  let duration = plan_duration(builder.duration_seconds, strategy)?;
  let prompt = builder.prompt.clone().unwrap_or_default();
  let negative_prompt = builder.negative_prompt.clone();
  let generate_audio = builder.generate_audio;
  let end_image_url = optional_url(builder.end_frame.clone())?;

  let mode = match optional_url(builder.start_frame.clone())? {
    None => {
      if end_image_url.is_some() {
        return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "end_frame",
          value: "Kling 2.6 Pro requires a start_frame when end_frame is provided".to_string(),
        }));
      }
      FalKling2p6ProMode::TextToVideo(Kling2p6ProTextToVideoRequest {
        prompt,
        generate_audio,
        negative_prompt,
        duration: duration.map(to_t2v_duration),
        aspect_ratio: aspect_ratio.map(to_t2v_aspect_ratio),
        cfg_scale: None,
      })
    }
    Some(start_image_url) => FalKling2p6ProMode::ImageToVideo(Kling2p6ProImageToVideoRequest {
      prompt,
      start_image_url,
      end_image_url,
      duration: duration.map(to_i2v_duration),
      negative_prompt,
      generate_audio,
      voice_ids: None,
    }),
  };

  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling2p6Pro(
    FalKling2p6ProRequestState { mode },
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

fn to_t2v_duration(d: PlanDuration) -> Kling2p6ProTextToVideoDuration {
  match d {
    PlanDuration::Five => Kling2p6ProTextToVideoDuration::FiveSeconds,
    PlanDuration::Ten => Kling2p6ProTextToVideoDuration::TenSeconds,
  }
}

fn to_t2v_aspect_ratio(a: PlanAspectRatio) -> Kling2p6ProTextToVideoAspectRatio {
  match a {
    PlanAspectRatio::Square => Kling2p6ProTextToVideoAspectRatio::Square,
    PlanAspectRatio::SixteenByNine => Kling2p6ProTextToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => Kling2p6ProTextToVideoAspectRatio::NineBySixteen,
  }
}

fn to_i2v_duration(d: PlanDuration) -> Kling2p6ProImageToVideoDuration {
  match d {
    PlanDuration::Five => Kling2p6ProImageToVideoDuration::FiveSeconds,
    PlanDuration::Ten => Kling2p6ProImageToVideoDuration::TenSeconds,
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
      model: RouterVideoModel::Kling2p6Pro,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      ..Default::default()
    }
  }

  #[test]
  fn no_start_frame_picks_t2v() {
    let result = build_fal_kling_2_6_pro(base_builder()).expect("build");
    let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling2p6Pro(s)) = result else {
      panic!("expected FalKling2p6Pro");
    };
    assert!(matches!(s.mode, FalKling2p6ProMode::TextToVideo(_)));
  }

  #[test]
  fn start_frame_picks_i2v() {
    let mut b = base_builder();
    b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
    let result = build_fal_kling_2_6_pro(b).expect("build");
    let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling2p6Pro(s)) = result else {
      panic!("expected FalKling2p6Pro");
    };
    assert!(matches!(s.mode, FalKling2p6ProMode::ImageToVideo(_)));
  }

  #[test]
  fn end_frame_without_start_frame_errors() {
    let mut b = base_builder();
    b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
    assert!(build_fal_kling_2_6_pro(b).is_err());
  }

  #[test]
  fn end_frame_with_start_frame_propagates_through_i2v() {
    // Kling 2.6 Pro image-to-video accepts an end frame (`end_image_url`).
    let mut b = base_builder();
    b.start_frame = Some(ImageRef::Url("https://example.com/start.png".to_string()));
    b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
    let result = build_fal_kling_2_6_pro(b).expect("build");
    let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling2p6Pro(s)) = result else {
      panic!("expected FalKling2p6Pro");
    };
    let FalKling2p6ProMode::ImageToVideo(req) = s.mode else {
      panic!("expected ImageToVideo");
    };
    assert_eq!(req.end_image_url.as_deref(), Some("https://example.com/end.png"));
  }

  #[test]
  fn generate_audio_propagates() {
    let mut b = base_builder();
    b.generate_audio = Some(false);
    let result = build_fal_kling_2_6_pro(b).expect("build");
    let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling2p6Pro(s)) = result else {
      panic!("expected FalKling2p6Pro");
    };
    let FalKling2p6ProMode::TextToVideo(req) = s.mode else {
      panic!("expected TextToVideo");
    };
    assert_eq!(req.generate_audio, Some(false));
  }
}

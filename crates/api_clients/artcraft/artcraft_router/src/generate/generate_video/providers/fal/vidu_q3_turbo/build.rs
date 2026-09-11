use fal_client::requests::api::video::image::vidu_q3_turbo::api::{
  ViduQ3TurboImageToVideoRequest, ViduQ3TurboImageToVideoResolution,
};
use fal_client::requests::api::video::text::vidu_q3_turbo::api::{
  ViduQ3TurboTextToVideoAspectRatio, ViduQ3TurboTextToVideoRequest, ViduQ3TurboTextToVideoResolution,
};

use crate::api::image_list_ref::ImageListRef;
use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_resolution::RouterResolution;
use crate::api::video_list_ref::VideoListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::fal::kling_1_6_pro::build::optional_url;
use crate::generate::generate_video::providers::fal::vidu_q3_turbo::request::{
  FalViduQ3TurboMode, FalViduQ3TurboRequestState,
};
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

const MIN_DURATION_SECONDS: u16 = 1;
const MAX_DURATION_SECONDS: u16 = 16;

#[derive(Debug, Clone, Copy)]
pub(crate) enum PlanAspectRatio {
  SixteenByNine,
  NineBySixteen,
  FourByThree,
  ThreeByFour,
  Square,
}

/// Vidu also offers 360p, but no `RouterResolution` maps to it (fal bills 360p
/// and 540p identically, so 540p is always the better pick).
#[derive(Debug, Clone, Copy)]
pub(crate) enum PlanResolution {
  FiveFortyP,
  SevenTwentyP,
  TenEightyP,
}

pub fn build_fal_vidu_q3_turbo(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_vidu_q3_turbo_state(builder)?;
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalViduQ3Turbo(state)))
}

pub(crate) fn build_fal_vidu_q3_turbo_state(
  builder: GenerateVideoRequestBuilder,
) -> Result<FalViduQ3TurboRequestState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  reject_reference_videos(&builder.reference_videos)?;
  reject_reference_images(&builder.reference_images)?;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
  let resolution = plan_resolution(builder.resolution, strategy)?;
  let duration = plan_duration(builder.duration_seconds, strategy)?;
  let prompt = builder.prompt.clone().unwrap_or_default();
  let audio = builder.generate_audio;
  let start_image_url = optional_url(builder.start_frame.clone())?;
  let end_image_url = optional_url(builder.end_frame.clone())?;

  // Dispatch: start_frame → image; else → text. Turbo has no reference-to-video
  // endpoint (that's the non-turbo Vidu Q3 model).
  let mode = if let Some(image_url) = start_image_url {
    let i2v_resolution = resolution.map(to_i2v_resolution);
    check_i2v_end_frame_resolution(i2v_resolution, end_image_url.is_some())?;
    // Image-to-video has no aspect_ratio input — the output follows the start
    // frame — so any requested aspect ratio is silently dropped here.
    FalViduQ3TurboMode::ImageToVideo(ViduQ3TurboImageToVideoRequest {
      prompt,
      image_url,
      end_image_url,
      duration,
      seed: None,
      resolution: i2v_resolution,
      audio,
    })
  } else {
    if end_image_url.is_some() {
      return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "end_frame",
        value: "Vidu Q3 Turbo requires a start_frame when end_frame is provided".to_string(),
      }));
    }
    FalViduQ3TurboMode::TextToVideo(ViduQ3TurboTextToVideoRequest {
      prompt,
      duration,
      seed: None,
      aspect_ratio: aspect_ratio.map(to_t2v_aspect_ratio),
      resolution: resolution.map(to_t2v_resolution),
      audio,
    })
  };

  Ok(FalViduQ3TurboRequestState { mode })
}

// ── Input helpers ──

fn reject_reference_videos(
  reference_videos: &Option<VideoListRef>,
) -> Result<(), ArtcraftRouterError> {
  let has_reference_videos = match reference_videos {
    None => false,
    Some(VideoListRef::Urls(urls)) => !urls.is_empty(),
    Some(VideoListRef::MediaFileTokens(tokens)) => !tokens.is_empty(),
  };
  if has_reference_videos {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "reference_videos",
      value: "Vidu Q3 Turbo does not support video references".to_string(),
    }));
  }
  Ok(())
}

fn reject_reference_images(
  reference_images: &Option<ImageListRef>,
) -> Result<(), ArtcraftRouterError> {
  let has_reference_images = match reference_images {
    None => false,
    Some(ImageListRef::Urls(urls)) => !urls.is_empty(),
    Some(ImageListRef::MediaFileTokens(tokens)) => !tokens.is_empty(),
  };
  if has_reference_images {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "reference_images",
      value: "Vidu Q3 Turbo does not support reference images (use Vidu Q3 for reference-to-video)".to_string(),
    }));
  }
  Ok(())
}

/// fal rejects 360p image-to-video requests that include an end frame.
/// `plan_resolution` can't currently produce 360p, but guard anyway so a
/// future mapping change can't silently ship the rejected combination.
fn check_i2v_end_frame_resolution(
  resolution: Option<ViduQ3TurboImageToVideoResolution>,
  has_end_frame: bool,
) -> Result<(), ArtcraftRouterError> {
  if has_end_frame && matches!(resolution, Some(ViduQ3TurboImageToVideoResolution::ThreeSixtyP)) {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "resolution",
      value: "Vidu Q3 Turbo image-to-video does not support 360p when an end_frame is provided".to_string(),
    }));
  }
  Ok(())
}

// ── Plan helpers ──

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
    Some(RouterAspectRatio::WideFourByThree) => Ok(Some(Ar::FourByThree)),
    Some(RouterAspectRatio::TallThreeByFour) => Ok(Some(Ar::ThreeByFour)),

    Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto3k)
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

fn plan_resolution(
  resolution: Option<RouterResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<PlanResolution>, ArtcraftRouterError> {
  match resolution {
    None => Ok(None),

    // Vidu doesn't offer 480p; 540p is the nearest supported size (and bills
    // at the same per-second rate as 360p, so nothing cheaper is lost).
    Some(RouterResolution::FourEightyP) => Ok(Some(PlanResolution::FiveFortyP)),
    Some(RouterResolution::SevenTwentyP) => Ok(Some(PlanResolution::SevenTwentyP)),
    Some(RouterResolution::TenEightyP) => Ok(Some(PlanResolution::TenEightyP)),

    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(PlanResolution::TenEightyP)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(PlanResolution::FiveFortyP)),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<u8>, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(None),
    Some(seconds) if (MIN_DURATION_SECONDS..=MAX_DURATION_SECONDS).contains(&seconds) => {
      Ok(Some(seconds as u8))
    }
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(other.clamp(MIN_DURATION_SECONDS, MAX_DURATION_SECONDS) as u8))
      }
    },
  }
}

// ── Leaf converters ──

fn to_t2v_aspect_ratio(a: PlanAspectRatio) -> ViduQ3TurboTextToVideoAspectRatio {
  match a {
    PlanAspectRatio::SixteenByNine => ViduQ3TurboTextToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => ViduQ3TurboTextToVideoAspectRatio::NineBySixteen,
    PlanAspectRatio::FourByThree => ViduQ3TurboTextToVideoAspectRatio::FourByThree,
    PlanAspectRatio::ThreeByFour => ViduQ3TurboTextToVideoAspectRatio::ThreeByFour,
    PlanAspectRatio::Square => ViduQ3TurboTextToVideoAspectRatio::Square,
  }
}

fn to_t2v_resolution(r: PlanResolution) -> ViduQ3TurboTextToVideoResolution {
  match r {
    PlanResolution::FiveFortyP => ViduQ3TurboTextToVideoResolution::FiveFortyP,
    PlanResolution::SevenTwentyP => ViduQ3TurboTextToVideoResolution::SevenTwentyP,
    PlanResolution::TenEightyP => ViduQ3TurboTextToVideoResolution::TenEightyP,
  }
}

fn to_i2v_resolution(r: PlanResolution) -> ViduQ3TurboImageToVideoResolution {
  match r {
    PlanResolution::FiveFortyP => ViduQ3TurboImageToVideoResolution::FiveFortyP,
    PlanResolution::SevenTwentyP => ViduQ3TurboImageToVideoResolution::SevenTwentyP,
    PlanResolution::TenEightyP => ViduQ3TurboImageToVideoResolution::TenEightyP,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_video_model::RouterVideoModel;

  use super::*;

  const START_URL: &str = "https://example.com/start.png";
  const END_URL: &str = "https://example.com/end.png";

  mod dispatch_tests {
    use super::*;

    #[test]
    fn no_inputs_picks_t2v() {
      let state = build_fal_vidu_q3_turbo_state(base_builder()).expect("build");
      assert!(matches!(state.mode, FalViduQ3TurboMode::TextToVideo(_)));
    }

    #[test]
    fn start_frame_picks_i2v() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url(START_URL.to_string()));
      let state = build_fal_vidu_q3_turbo_state(b).expect("build");
      assert!(matches!(state.mode, FalViduQ3TurboMode::ImageToVideo(_)));
    }

    #[test]
    fn start_and_end_frame_picks_i2v_with_end_image_url() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url(START_URL.to_string()));
      b.end_frame = Some(ImageRef::Url(END_URL.to_string()));
      let state = build_fal_vidu_q3_turbo_state(b).expect("build");
      let FalViduQ3TurboMode::ImageToVideo(req) = state.mode else {
        panic!("expected ImageToVideo");
      };
      assert_eq!(req.image_url, START_URL);
      assert_eq!(req.end_image_url.as_deref(), Some(END_URL));
    }

    #[test]
    fn end_frame_without_start_frame_errors() {
      let mut b = base_builder();
      b.end_frame = Some(ImageRef::Url(END_URL.to_string()));
      assert!(build_fal_vidu_q3_turbo_state(b).is_err());
    }

    #[test]
    fn reference_images_error() {
      let mut b = base_builder();
      b.reference_images = Some(ImageListRef::Urls(vec!["https://example.com/ref.png".to_string()]));
      assert!(build_fal_vidu_q3_turbo_state(b).is_err());
    }

    #[test]
    fn reference_videos_error() {
      let mut b = base_builder();
      b.reference_videos = Some(VideoListRef::Urls(vec!["https://example.com/a.mp4".to_string()]));
      assert!(build_fal_vidu_q3_turbo_state(b).is_err());
    }
  }

  mod plan_tests {
    use super::*;

    #[test]
    fn duration_20_errors_under_error_out() {
      let mut b = base_builder();
      b.duration_seconds = Some(20);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      assert!(build_fal_vidu_q3_turbo_state(b).is_err());
    }

    #[test]
    fn duration_20_clamps_to_16_under_pay_less() {
      let mut b = base_builder();
      b.duration_seconds = Some(20);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayLessDowngrade;
      let state = build_fal_vidu_q3_turbo_state(b).expect("build");
      let FalViduQ3TurboMode::TextToVideo(req) = state.mode else {
        panic!("expected TextToVideo");
      };
      assert_eq!(req.duration, Some(16));
    }

    #[test]
    fn resolution_480p_maps_to_540p() {
      let mut b = base_builder();
      b.resolution = Some(RouterResolution::FourEightyP);
      let state = build_fal_vidu_q3_turbo_state(b).expect("build");
      let FalViduQ3TurboMode::TextToVideo(req) = state.mode else {
        panic!("expected TextToVideo");
      };
      assert_eq!(req.resolution, Some(ViduQ3TurboTextToVideoResolution::FiveFortyP));
    }

    #[test]
    fn i2v_aspect_ratio_is_silently_dropped() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url(START_URL.to_string()));
      b.aspect_ratio = Some(RouterAspectRatio::TallNineBySixteen);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      // Image-to-video has no aspect_ratio field; the request still builds.
      let state = build_fal_vidu_q3_turbo_state(b).expect("build");
      assert!(matches!(state.mode, FalViduQ3TurboMode::ImageToVideo(_)));
    }

    #[test]
    fn i2v_360p_with_end_frame_is_rejected_by_guard() {
      // 360p is unreachable from RouterResolution today, so exercise the
      // guard directly against the fal-level resolution enum.
      let result = check_i2v_end_frame_resolution(
        Some(ViduQ3TurboImageToVideoResolution::ThreeSixtyP),
        true,
      );
      assert!(result.is_err());
      assert!(check_i2v_end_frame_resolution(Some(ViduQ3TurboImageToVideoResolution::ThreeSixtyP), false).is_ok());
      assert!(check_i2v_end_frame_resolution(Some(ViduQ3TurboImageToVideoResolution::SevenTwentyP), true).is_ok());
    }

    #[test]
    fn generate_audio_propagates() {
      let mut b = base_builder();
      b.generate_audio = Some(false);
      let state = build_fal_vidu_q3_turbo_state(b).expect("build");
      let FalViduQ3TurboMode::TextToVideo(req) = state.mode else {
        panic!("expected TextToVideo");
      };
      assert_eq!(req.audio, Some(false));
    }
  }

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::ViduQ3Turbo,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      ..Default::default()
    }
  }
}

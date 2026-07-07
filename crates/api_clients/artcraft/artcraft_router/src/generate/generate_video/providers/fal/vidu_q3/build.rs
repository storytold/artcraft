use fal_client::requests::api::video::image::vidu_q3::api::{
  ViduQ3ImageToVideoRequest, ViduQ3ImageToVideoResolution,
};
use fal_client::requests::api::video::reference::vidu_q3_reference_to_video::api::{
  ViduQ3ReferenceToVideoAspectRatio, ViduQ3ReferenceToVideoRequest, ViduQ3ReferenceToVideoResolution,
};
use fal_client::requests::api::video::reference::vidu_q3_reference_to_video_mix::api::{
  ViduQ3ReferenceToVideoMixAspectRatio, ViduQ3ReferenceToVideoMixRequest,
  ViduQ3ReferenceToVideoMixResolution,
};
use fal_client::requests::api::video::text::vidu_q3::api::{
  ViduQ3TextToVideoAspectRatio, ViduQ3TextToVideoRequest, ViduQ3TextToVideoResolution,
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
use crate::generate::generate_video::providers::fal::vidu_q3::request::{
  FalViduQ3Mode, FalViduQ3RequestState,
};
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

const MAX_REFERENCE_IMAGES: usize = 4;
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

pub fn build_fal_vidu_q3(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_vidu_q3_state(builder)?;
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalViduQ3(state)))
}

pub(crate) fn build_fal_vidu_q3_state(
  builder: GenerateVideoRequestBuilder,
) -> Result<FalViduQ3RequestState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  reject_reference_videos(&builder.reference_videos)?;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
  let resolution = plan_resolution(builder.resolution, strategy)?;
  let duration = plan_duration(builder.duration_seconds, strategy)?;
  let prompt = builder.prompt.clone().unwrap_or_default();
  let audio = builder.generate_audio;
  let reference_image_urls = resolve_reference_image_urls(builder.reference_images.clone())?;
  let start_image_url = optional_url(builder.start_frame.clone())?;
  let end_image_url = optional_url(builder.end_frame.clone())?;

  // Dispatch: reference_images → reference-to-video; start_frame → image; else → text.
  let mode = if !reference_image_urls.is_empty() {
    if start_image_url.is_some() || end_image_url.is_some() {
      return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "reference_images",
        value: "Vidu Q3 reference-to-video cannot also accept a start_frame or end_frame".to_string(),
      }));
    }
    if reference_image_urls.len() > MAX_REFERENCE_IMAGES {
      return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "reference_images",
        value: format!(
          "Vidu Q3 supports at most {} reference images, got {}",
          MAX_REFERENCE_IMAGES,
          reference_image_urls.len(),
        ),
      }));
    }
    // The plain reference endpoint keeps a single subject consistent; the /mix
    // variant blends multiple subjects, so 2+ references route there.
    if reference_image_urls.len() == 1 {
      FalViduQ3Mode::ReferenceToVideo(ViduQ3ReferenceToVideoRequest {
        prompt,
        reference_image_urls,
        duration,
        seed: None,
        aspect_ratio: aspect_ratio.map(to_reference_aspect_ratio),
        resolution: resolution.map(to_reference_resolution),
        audio,
      })
    } else {
      FalViduQ3Mode::ReferenceToVideoMix(ViduQ3ReferenceToVideoMixRequest {
        prompt,
        reference_image_urls,
        duration,
        seed: None,
        aspect_ratio: aspect_ratio.map(to_mix_aspect_ratio),
        resolution: resolution.map(to_mix_resolution),
        audio,
      })
    }
  } else if let Some(image_url) = start_image_url {
    let i2v_resolution = resolution.map(to_i2v_resolution);
    check_i2v_end_frame_resolution(i2v_resolution, end_image_url.is_some())?;
    // Image-to-video has no aspect_ratio input — the output follows the start
    // frame — so any requested aspect ratio is silently dropped here.
    FalViduQ3Mode::ImageToVideo(ViduQ3ImageToVideoRequest {
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
        value: "Vidu Q3 requires a start_frame when end_frame is provided".to_string(),
      }));
    }
    FalViduQ3Mode::TextToVideo(ViduQ3TextToVideoRequest {
      prompt,
      duration,
      seed: None,
      aspect_ratio: aspect_ratio.map(to_t2v_aspect_ratio),
      resolution: resolution.map(to_t2v_resolution),
      audio,
    })
  };

  Ok(FalViduQ3RequestState { mode })
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
      value: "Vidu Q3 does not support video references".to_string(),
    }));
  }
  Ok(())
}

fn resolve_reference_image_urls(
  reference_images: Option<ImageListRef>,
) -> Result<Vec<String>, ArtcraftRouterError> {
  match reference_images {
    None => Ok(vec![]),
    Some(ImageListRef::Urls(urls)) => Ok(urls),
    Some(ImageListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
  }
}

/// fal rejects 360p image-to-video requests that include an end frame.
/// `plan_resolution` can't currently produce 360p, but guard anyway so a
/// future mapping change can't silently ship the rejected combination.
fn check_i2v_end_frame_resolution(
  resolution: Option<ViduQ3ImageToVideoResolution>,
  has_end_frame: bool,
) -> Result<(), ArtcraftRouterError> {
  if has_end_frame && matches!(resolution, Some(ViduQ3ImageToVideoResolution::ThreeSixtyP)) {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "resolution",
      value: "Vidu Q3 image-to-video does not support 360p when an end_frame is provided".to_string(),
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

fn to_t2v_aspect_ratio(a: PlanAspectRatio) -> ViduQ3TextToVideoAspectRatio {
  match a {
    PlanAspectRatio::SixteenByNine => ViduQ3TextToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => ViduQ3TextToVideoAspectRatio::NineBySixteen,
    PlanAspectRatio::FourByThree => ViduQ3TextToVideoAspectRatio::FourByThree,
    PlanAspectRatio::ThreeByFour => ViduQ3TextToVideoAspectRatio::ThreeByFour,
    PlanAspectRatio::Square => ViduQ3TextToVideoAspectRatio::Square,
  }
}

fn to_reference_aspect_ratio(a: PlanAspectRatio) -> ViduQ3ReferenceToVideoAspectRatio {
  match a {
    PlanAspectRatio::SixteenByNine => ViduQ3ReferenceToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => ViduQ3ReferenceToVideoAspectRatio::NineBySixteen,
    PlanAspectRatio::FourByThree => ViduQ3ReferenceToVideoAspectRatio::FourByThree,
    PlanAspectRatio::ThreeByFour => ViduQ3ReferenceToVideoAspectRatio::ThreeByFour,
    PlanAspectRatio::Square => ViduQ3ReferenceToVideoAspectRatio::Square,
  }
}

fn to_mix_aspect_ratio(a: PlanAspectRatio) -> ViduQ3ReferenceToVideoMixAspectRatio {
  match a {
    PlanAspectRatio::SixteenByNine => ViduQ3ReferenceToVideoMixAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => ViduQ3ReferenceToVideoMixAspectRatio::NineBySixteen,
    PlanAspectRatio::FourByThree => ViduQ3ReferenceToVideoMixAspectRatio::FourByThree,
    PlanAspectRatio::ThreeByFour => ViduQ3ReferenceToVideoMixAspectRatio::ThreeByFour,
    PlanAspectRatio::Square => ViduQ3ReferenceToVideoMixAspectRatio::Square,
  }
}

fn to_t2v_resolution(r: PlanResolution) -> ViduQ3TextToVideoResolution {
  match r {
    PlanResolution::FiveFortyP => ViduQ3TextToVideoResolution::FiveFortyP,
    PlanResolution::SevenTwentyP => ViduQ3TextToVideoResolution::SevenTwentyP,
    PlanResolution::TenEightyP => ViduQ3TextToVideoResolution::TenEightyP,
  }
}

fn to_i2v_resolution(r: PlanResolution) -> ViduQ3ImageToVideoResolution {
  match r {
    PlanResolution::FiveFortyP => ViduQ3ImageToVideoResolution::FiveFortyP,
    PlanResolution::SevenTwentyP => ViduQ3ImageToVideoResolution::SevenTwentyP,
    PlanResolution::TenEightyP => ViduQ3ImageToVideoResolution::TenEightyP,
  }
}

fn to_reference_resolution(r: PlanResolution) -> ViduQ3ReferenceToVideoResolution {
  match r {
    PlanResolution::FiveFortyP => ViduQ3ReferenceToVideoResolution::FiveFortyP,
    PlanResolution::SevenTwentyP => ViduQ3ReferenceToVideoResolution::SevenTwentyP,
    PlanResolution::TenEightyP => ViduQ3ReferenceToVideoResolution::TenEightyP,
  }
}

fn to_mix_resolution(r: PlanResolution) -> ViduQ3ReferenceToVideoMixResolution {
  match r {
    PlanResolution::FiveFortyP => ViduQ3ReferenceToVideoMixResolution::FiveFortyP,
    PlanResolution::SevenTwentyP => ViduQ3ReferenceToVideoMixResolution::SevenTwentyP,
    PlanResolution::TenEightyP => ViduQ3ReferenceToVideoMixResolution::TenEightyP,
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
      let state = build_fal_vidu_q3_state(base_builder()).expect("build");
      assert!(matches!(state.mode, FalViduQ3Mode::TextToVideo(_)));
    }

    #[test]
    fn start_frame_picks_i2v() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url(START_URL.to_string()));
      let state = build_fal_vidu_q3_state(b).expect("build");
      assert!(matches!(state.mode, FalViduQ3Mode::ImageToVideo(_)));
    }

    #[test]
    fn start_and_end_frame_picks_i2v_with_end_image_url() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url(START_URL.to_string()));
      b.end_frame = Some(ImageRef::Url(END_URL.to_string()));
      let state = build_fal_vidu_q3_state(b).expect("build");
      let FalViduQ3Mode::ImageToVideo(req) = state.mode else {
        panic!("expected ImageToVideo");
      };
      assert_eq!(req.image_url, START_URL);
      assert_eq!(req.end_image_url.as_deref(), Some(END_URL));
    }

    #[test]
    fn end_frame_without_start_frame_errors() {
      let mut b = base_builder();
      b.end_frame = Some(ImageRef::Url(END_URL.to_string()));
      assert!(build_fal_vidu_q3_state(b).is_err());
    }

    #[test]
    fn one_reference_image_picks_reference_to_video() {
      let state = build_fal_vidu_q3_state(builder_with_references(1)).expect("build");
      assert!(matches!(state.mode, FalViduQ3Mode::ReferenceToVideo(_)));
    }

    #[test]
    fn three_reference_images_pick_reference_to_video_mix() {
      let state = build_fal_vidu_q3_state(builder_with_references(3)).expect("build");
      let FalViduQ3Mode::ReferenceToVideoMix(req) = state.mode else {
        panic!("expected ReferenceToVideoMix");
      };
      assert_eq!(req.reference_image_urls.len(), 3);
    }

    #[test]
    fn five_reference_images_error() {
      assert!(build_fal_vidu_q3_state(builder_with_references(5)).is_err());
    }

    #[test]
    fn reference_images_with_start_frame_error() {
      let mut b = builder_with_references(2);
      b.start_frame = Some(ImageRef::Url(START_URL.to_string()));
      assert!(build_fal_vidu_q3_state(b).is_err());
    }

    #[test]
    fn reference_videos_error() {
      let mut b = base_builder();
      b.reference_videos = Some(VideoListRef::Urls(vec!["https://example.com/a.mp4".to_string()]));
      assert!(build_fal_vidu_q3_state(b).is_err());
    }
  }

  mod plan_tests {
    use super::*;

    #[test]
    fn duration_20_errors_under_error_out() {
      let mut b = base_builder();
      b.duration_seconds = Some(20);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      assert!(build_fal_vidu_q3_state(b).is_err());
    }

    #[test]
    fn duration_20_clamps_to_16_under_pay_less() {
      let mut b = base_builder();
      b.duration_seconds = Some(20);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayLessDowngrade;
      let state = build_fal_vidu_q3_state(b).expect("build");
      let FalViduQ3Mode::TextToVideo(req) = state.mode else {
        panic!("expected TextToVideo");
      };
      assert_eq!(req.duration, Some(16));
    }

    #[test]
    fn resolution_480p_maps_to_540p() {
      let mut b = base_builder();
      b.resolution = Some(RouterResolution::FourEightyP);
      let state = build_fal_vidu_q3_state(b).expect("build");
      let FalViduQ3Mode::TextToVideo(req) = state.mode else {
        panic!("expected TextToVideo");
      };
      assert_eq!(req.resolution, Some(ViduQ3TextToVideoResolution::FiveFortyP));
    }

    #[test]
    fn i2v_aspect_ratio_is_silently_dropped() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url(START_URL.to_string()));
      b.aspect_ratio = Some(RouterAspectRatio::TallNineBySixteen);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      // Image-to-video has no aspect_ratio field; the request still builds.
      let state = build_fal_vidu_q3_state(b).expect("build");
      assert!(matches!(state.mode, FalViduQ3Mode::ImageToVideo(_)));
    }

    #[test]
    fn i2v_360p_with_end_frame_is_rejected_by_guard() {
      // 360p is unreachable from RouterResolution today, so exercise the
      // guard directly against the fal-level resolution enum.
      let result = check_i2v_end_frame_resolution(
        Some(ViduQ3ImageToVideoResolution::ThreeSixtyP),
        true,
      );
      assert!(result.is_err());
      assert!(check_i2v_end_frame_resolution(Some(ViduQ3ImageToVideoResolution::ThreeSixtyP), false).is_ok());
      assert!(check_i2v_end_frame_resolution(Some(ViduQ3ImageToVideoResolution::SevenTwentyP), true).is_ok());
    }

    #[test]
    fn generate_audio_propagates() {
      let mut b = base_builder();
      b.generate_audio = Some(false);
      let state = build_fal_vidu_q3_state(b).expect("build");
      let FalViduQ3Mode::TextToVideo(req) = state.mode else {
        panic!("expected TextToVideo");
      };
      assert_eq!(req.audio, Some(false));
    }
  }

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::ViduQ3,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      ..Default::default()
    }
  }

  fn builder_with_references(count: usize) -> GenerateVideoRequestBuilder {
    let urls = (0..count)
      .map(|i| format!("https://example.com/ref-{}.png", i))
      .collect();
    let mut b = base_builder();
    b.reference_images = Some(ImageListRef::Urls(urls));
    b
  }
}

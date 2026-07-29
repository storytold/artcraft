use fal_client::requests::api::video::extend::veo_3p1::api::{
  Veo3p1ExtendVideoAspectRatio, Veo3p1ExtendVideoDuration, Veo3p1ExtendVideoRequest,
  Veo3p1ExtendVideoResolution,
};
use fal_client::requests::api::video::image::veo_3p1::api::{
  Veo3p1ImageToVideoAspectRatio, Veo3p1ImageToVideoDuration, Veo3p1ImageToVideoRequest,
  Veo3p1ImageToVideoResolution,
};
use fal_client::requests::api::video::images::veo_3p1::api::{
  Veo3p1FirstLastFrameToVideoAspectRatio, Veo3p1FirstLastFrameToVideoDuration,
  Veo3p1FirstLastFrameToVideoRequest, Veo3p1FirstLastFrameToVideoResolution,
};
use fal_client::requests::api::video::reference::veo_3p1::api::{
  Veo3p1ReferenceToVideoAspectRatio, Veo3p1ReferenceToVideoDuration, Veo3p1ReferenceToVideoRequest,
  Veo3p1ReferenceToVideoResolution,
};
use fal_client::requests::api::video::text::veo_3p1::api::{
  Veo3p1TextToVideoAspectRatio, Veo3p1TextToVideoDuration, Veo3p1TextToVideoRequest,
  Veo3p1TextToVideoResolution,
};

use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_resolution::RouterResolution;
use crate::api::video_list_ref::VideoListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::fal::veo_3p1::request::{FalVeo3p1Mode, FalVeo3p1RequestState};
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

#[derive(Debug, Clone, Copy)]
pub(crate) enum PlanAspectRatio {
  Auto,
  SixteenByNine,
  NineBySixteen,
}

#[derive(Debug, Clone, Copy)]
pub(crate) enum PlanResolution {
  SevenTwentyP,
  TenEightyP,
  FourK,
}

#[derive(Debug, Clone, Copy)]
pub(crate) enum PlanDuration {
  Four,
  Six,
  Eight,
}

pub fn build_fal_veo_3p1(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_veo_3p1_state(builder)?;
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalVeo3p1(state)))
}

pub(crate) fn build_fal_veo_3p1_state(
  builder: GenerateVideoRequestBuilder,
) -> Result<FalVeo3p1RequestState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let start = optional_url(builder.start_frame.clone())?;
  let end = optional_url(builder.end_frame.clone())?;
  let reference_images = reference_image_urls(builder.reference_images.clone())?;
  let reference_videos = reference_video_urls(builder.reference_videos.clone())?;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
  let resolution = plan_resolution(builder.resolution, strategy)?;
  let prompt = builder.prompt.clone().unwrap_or_default();
  let negative_prompt = builder.negative_prompt.clone();
  let generate_audio = builder.generate_audio;

  // Modality dispatch, most specific inputs first:
  //   1. reference videos    → extend-video
  //   2. reference images    → reference-to-video
  //   3. start + end frames  → first-last-frame-to-video
  //   4. start frame only    → image-to-video
  //   5. no media            → text-to-video
  let mode = if let Some(video_urls) = reference_videos {
    if reference_images.is_some() {
      return Err(unsupported(
        "reference_images",
        "Veo 3.1 extend-video cannot combine reference_images with a reference video",
      ));
    }
    if start.is_some() {
      return Err(unsupported(
        "start_frame",
        "Veo 3.1 extend-video cannot combine start_frame with a reference video",
      ));
    }
    if end.is_some() {
      return Err(unsupported(
        "end_frame",
        "Veo 3.1 extend-video cannot combine end_frame with a reference video",
      ));
    }
    if video_urls.len() != 1 {
      return Err(unsupported(
        "reference_videos",
        &format!("Veo 3.1 extend-video requires exactly 1 reference video, got {}", video_urls.len()),
      ));
    }
    let video_url = video_urls.into_iter().next().expect("checked len == 1");
    FalVeo3p1Mode::ExtendVideo(Veo3p1ExtendVideoRequest {
      prompt,
      video_url,
      aspect_ratio: aspect_ratio.map(to_extend_aspect_ratio),
      duration: plan_extend_duration(builder.duration_seconds, strategy)?,
      resolution: resolution.map(|r| to_extend_resolution(r, strategy)).transpose()?,
      negative_prompt,
      generate_audio,
      seed: None,
      auto_fix: None,
      safety_tolerance: None,
    })
  } else if let Some(image_urls) = reference_images {
    if start.is_some() {
      return Err(unsupported(
        "start_frame",
        "Veo 3.1 reference-to-video cannot combine start_frame with reference_images",
      ));
    }
    if end.is_some() {
      return Err(unsupported(
        "end_frame",
        "Veo 3.1 reference-to-video cannot combine end_frame with reference_images",
      ));
    }
    // NB: reference-to-video has no negative_prompt or seed fields on fal's
    // schema — those builder inputs are dropped silently.
    FalVeo3p1Mode::ReferenceToVideo(Veo3p1ReferenceToVideoRequest {
      prompt,
      image_urls,
      aspect_ratio: aspect_ratio.and_then(to_reference_aspect_ratio),
      duration: plan_duration(builder.duration_seconds, strategy)?.map(to_reference_duration),
      resolution: resolution.map(to_reference_resolution),
      generate_audio,
      auto_fix: None,
      safety_tolerance: None,
    })
  } else {
    let duration = plan_duration(builder.duration_seconds, strategy)?;
    match (start, end) {
      (None, None) => FalVeo3p1Mode::TextToVideo(Veo3p1TextToVideoRequest {
        prompt,
        aspect_ratio: aspect_ratio.and_then(to_t2v_aspect_ratio),
        duration: duration.map(to_t2v_duration),
        resolution: resolution.map(to_t2v_resolution),
        negative_prompt,
        generate_audio,
        seed: None,
        auto_fix: None,
        safety_tolerance: None,
      }),
      (Some(image_url), None) => FalVeo3p1Mode::ImageToVideo(Veo3p1ImageToVideoRequest {
        prompt,
        image_url,
        aspect_ratio: aspect_ratio.map(to_i2v_aspect_ratio),
        duration: duration.map(to_i2v_duration),
        resolution: resolution.map(to_i2v_resolution),
        generate_audio,
        negative_prompt,
        seed: None,
        auto_fix: None,
        safety_tolerance: None,
      }),
      (Some(first_frame_url), Some(last_frame_url)) => FalVeo3p1Mode::FirstLastFrameToVideo(
        Veo3p1FirstLastFrameToVideoRequest {
          prompt,
          first_frame_url,
          last_frame_url,
          aspect_ratio: aspect_ratio.map(to_flf_aspect_ratio),
          duration: duration.map(to_flf_duration),
          resolution: resolution.map(to_flf_resolution),
          generate_audio,
          negative_prompt,
          seed: None,
          auto_fix: None,
          safety_tolerance: None,
        },
      ),
      (None, Some(_)) => {
        return Err(unsupported(
          "end_frame",
          "Veo 3.1 requires a start_frame when end_frame is provided",
        ));
      }
    }
  };

  Ok(FalVeo3p1RequestState { mode })
}

fn optional_url(image_ref: Option<ImageRef>) -> Result<Option<String>, ArtcraftRouterError> {
  match image_ref {
    None => Ok(None),
    Some(ImageRef::Url(url)) => Ok(Some(url)),
    Some(ImageRef::MediaFileToken(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
  }
}

fn reference_image_urls(refs: Option<ImageListRef>) -> Result<Option<Vec<String>>, ArtcraftRouterError> {
  match refs {
    None => Ok(None),
    Some(ImageListRef::Urls(urls)) if urls.is_empty() => Ok(None),
    Some(ImageListRef::Urls(urls)) => Ok(Some(urls)),
    Some(ImageListRef::MediaFileTokens(tokens)) if tokens.is_empty() => Ok(None),
    Some(ImageListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
  }
}

fn reference_video_urls(refs: Option<VideoListRef>) -> Result<Option<Vec<String>>, ArtcraftRouterError> {
  match refs {
    None => Ok(None),
    Some(VideoListRef::Urls(urls)) if urls.is_empty() => Ok(None),
    Some(VideoListRef::Urls(urls)) => Ok(Some(urls)),
    Some(VideoListRef::MediaFileTokens(tokens)) if tokens.is_empty() => Ok(None),
    Some(VideoListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
  }
}

fn plan_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<PlanAspectRatio>, ArtcraftRouterError> {
  use PlanAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(None),

    Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto4k) => Ok(Some(Ar::Auto)),

    Some(RouterAspectRatio::WideSixteenByNine) | Some(RouterAspectRatio::Wide) => Ok(Some(Ar::SixteenByNine)),
    Some(RouterAspectRatio::TallNineBySixteen) | Some(RouterAspectRatio::Tall) => Ok(Some(Ar::NineBySixteen)),

    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("aspect_ratio", &format!("{:?}", other)))
      }
      _ => Ok(Some(Ar::Auto)),
    },
  }
}

fn plan_resolution(
  resolution: Option<RouterResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<PlanResolution>, ArtcraftRouterError> {
  use PlanResolution as R;
  match resolution {
    None => Ok(None),
    Some(RouterResolution::SevenTwentyP) => Ok(Some(R::SevenTwentyP)),
    Some(RouterResolution::TenEightyP) => Ok(Some(R::TenEightyP)),
    Some(RouterResolution::FourK) => Ok(Some(R::FourK)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("resolution", &format!("{:?}", other)))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(R::TenEightyP)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(R::SevenTwentyP)),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<PlanDuration>, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(None),
    Some(4) => Ok(Some(PlanDuration::Four)),
    Some(6) => Ok(Some(PlanDuration::Six)),
    Some(8) => Ok(Some(PlanDuration::Eight)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("duration_seconds", &format!("{}", other)))
      }
      // Nearest supported duration above/below, clamped to the 4s–8s range.
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(match other {
        0..=4 => PlanDuration::Four,
        5..=6 => PlanDuration::Six,
        _ => PlanDuration::Eight,
      })),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(match other {
        0..=5 => PlanDuration::Four,
        6..=7 => PlanDuration::Six,
        _ => PlanDuration::Eight,
      })),
    },
  }
}

/// Extend-video also supports fal's 7s default in addition to 4/6/8.
fn plan_extend_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Veo3p1ExtendVideoDuration>, ArtcraftRouterError> {
  use Veo3p1ExtendVideoDuration as D;
  match duration_seconds {
    None => Ok(None),
    Some(4) => Ok(Some(D::FourSeconds)),
    Some(6) => Ok(Some(D::SixSeconds)),
    Some(7) => Ok(Some(D::SevenSeconds)),
    Some(8) => Ok(Some(D::EightSeconds)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("duration_seconds", &format!("{}", other)))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => {
        Ok(Some(if other < 5 { D::FourSeconds } else if other == 5 { D::SixSeconds } else { D::EightSeconds }))
      }
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(if other <= 5 { D::FourSeconds } else { D::EightSeconds }))
      }
    },
  }
}

fn unsupported(field: &'static str, value: &str) -> ArtcraftRouterError {
  ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
    field,
    value: value.to_string(),
  })
}

// The text-to-video endpoint has no `auto` aspect ratio; omit the field and
// let fal apply its own default (16:9).
fn to_t2v_aspect_ratio(a: PlanAspectRatio) -> Option<Veo3p1TextToVideoAspectRatio> {
  match a {
    PlanAspectRatio::Auto => None,
    PlanAspectRatio::SixteenByNine => Some(Veo3p1TextToVideoAspectRatio::SixteenByNine),
    PlanAspectRatio::NineBySixteen => Some(Veo3p1TextToVideoAspectRatio::NineBySixteen),
  }
}

fn to_t2v_duration(d: PlanDuration) -> Veo3p1TextToVideoDuration {
  match d {
    PlanDuration::Four => Veo3p1TextToVideoDuration::FourSeconds,
    PlanDuration::Six => Veo3p1TextToVideoDuration::SixSeconds,
    PlanDuration::Eight => Veo3p1TextToVideoDuration::EightSeconds,
  }
}

fn to_t2v_resolution(r: PlanResolution) -> Veo3p1TextToVideoResolution {
  match r {
    PlanResolution::SevenTwentyP => Veo3p1TextToVideoResolution::SevenTwentyP,
    PlanResolution::TenEightyP => Veo3p1TextToVideoResolution::TenEightyP,
    PlanResolution::FourK => Veo3p1TextToVideoResolution::FourK,
  }
}

fn to_i2v_aspect_ratio(a: PlanAspectRatio) -> Veo3p1ImageToVideoAspectRatio {
  match a {
    PlanAspectRatio::Auto => Veo3p1ImageToVideoAspectRatio::Auto,
    PlanAspectRatio::SixteenByNine => Veo3p1ImageToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => Veo3p1ImageToVideoAspectRatio::NineBySixteen,
  }
}

fn to_i2v_duration(d: PlanDuration) -> Veo3p1ImageToVideoDuration {
  match d {
    PlanDuration::Four => Veo3p1ImageToVideoDuration::FourSeconds,
    PlanDuration::Six => Veo3p1ImageToVideoDuration::SixSeconds,
    PlanDuration::Eight => Veo3p1ImageToVideoDuration::EightSeconds,
  }
}

fn to_i2v_resolution(r: PlanResolution) -> Veo3p1ImageToVideoResolution {
  match r {
    PlanResolution::SevenTwentyP => Veo3p1ImageToVideoResolution::SevenTwentyP,
    PlanResolution::TenEightyP => Veo3p1ImageToVideoResolution::TenEightyP,
    PlanResolution::FourK => Veo3p1ImageToVideoResolution::FourK,
  }
}

fn to_flf_aspect_ratio(a: PlanAspectRatio) -> Veo3p1FirstLastFrameToVideoAspectRatio {
  match a {
    PlanAspectRatio::Auto => Veo3p1FirstLastFrameToVideoAspectRatio::Auto,
    PlanAspectRatio::SixteenByNine => Veo3p1FirstLastFrameToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => Veo3p1FirstLastFrameToVideoAspectRatio::NineBySixteen,
  }
}

fn to_flf_duration(d: PlanDuration) -> Veo3p1FirstLastFrameToVideoDuration {
  match d {
    PlanDuration::Four => Veo3p1FirstLastFrameToVideoDuration::FourSeconds,
    PlanDuration::Six => Veo3p1FirstLastFrameToVideoDuration::SixSeconds,
    PlanDuration::Eight => Veo3p1FirstLastFrameToVideoDuration::EightSeconds,
  }
}

fn to_flf_resolution(r: PlanResolution) -> Veo3p1FirstLastFrameToVideoResolution {
  match r {
    PlanResolution::SevenTwentyP => Veo3p1FirstLastFrameToVideoResolution::SevenTwentyP,
    PlanResolution::TenEightyP => Veo3p1FirstLastFrameToVideoResolution::TenEightyP,
    PlanResolution::FourK => Veo3p1FirstLastFrameToVideoResolution::FourK,
  }
}

// The reference-to-video endpoint has no `auto` aspect ratio; omit the field
// and let fal apply its own default (16:9).
fn to_reference_aspect_ratio(a: PlanAspectRatio) -> Option<Veo3p1ReferenceToVideoAspectRatio> {
  match a {
    PlanAspectRatio::Auto => None,
    PlanAspectRatio::SixteenByNine => Some(Veo3p1ReferenceToVideoAspectRatio::SixteenByNine),
    PlanAspectRatio::NineBySixteen => Some(Veo3p1ReferenceToVideoAspectRatio::NineBySixteen),
  }
}

fn to_reference_duration(d: PlanDuration) -> Veo3p1ReferenceToVideoDuration {
  match d {
    PlanDuration::Four => Veo3p1ReferenceToVideoDuration::FourSeconds,
    PlanDuration::Six => Veo3p1ReferenceToVideoDuration::SixSeconds,
    PlanDuration::Eight => Veo3p1ReferenceToVideoDuration::EightSeconds,
  }
}

fn to_reference_resolution(r: PlanResolution) -> Veo3p1ReferenceToVideoResolution {
  match r {
    PlanResolution::SevenTwentyP => Veo3p1ReferenceToVideoResolution::SevenTwentyP,
    PlanResolution::TenEightyP => Veo3p1ReferenceToVideoResolution::TenEightyP,
    PlanResolution::FourK => Veo3p1ReferenceToVideoResolution::FourK,
  }
}

fn to_extend_aspect_ratio(a: PlanAspectRatio) -> Veo3p1ExtendVideoAspectRatio {
  match a {
    PlanAspectRatio::Auto => Veo3p1ExtendVideoAspectRatio::Auto,
    PlanAspectRatio::SixteenByNine => Veo3p1ExtendVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => Veo3p1ExtendVideoAspectRatio::NineBySixteen,
  }
}

// Extend-video has no 4k tier; the nearest supported resolution in either
// direction is 1080p.
fn to_extend_resolution(
  r: PlanResolution,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Veo3p1ExtendVideoResolution, ArtcraftRouterError> {
  match r {
    PlanResolution::SevenTwentyP => Ok(Veo3p1ExtendVideoResolution::SevenTwentyP),
    PlanResolution::TenEightyP => Ok(Veo3p1ExtendVideoResolution::TenEightyP),
    PlanResolution::FourK => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("resolution", "Veo 3.1 extend-video does not support 4k"))
      }
      _ => Ok(Veo3p1ExtendVideoResolution::TenEightyP),
    },
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

  use super::*;

  const START_FRAME_URL: &str = "https://example.com/a.png";
  const END_FRAME_URL: &str = "https://example.com/b.png";
  const REFERENCE_IMAGE_URL_A: &str = "https://example.com/ref_a.png";
  const REFERENCE_IMAGE_URL_B: &str = "https://example.com/ref_b.png";
  const REFERENCE_VIDEO_URL: &str = "https://example.com/in.mp4";

  mod mode_selection {
    use super::*;

    #[test]
    fn no_frames_picks_t2v() {
      assert!(matches!(unwrap_mode(base_builder()), FalVeo3p1Mode::TextToVideo(_)));
    }

    #[test]
    fn start_only_picks_i2v() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url(START_FRAME_URL.to_string()));
      assert!(matches!(unwrap_mode(b), FalVeo3p1Mode::ImageToVideo(_)));
    }

    #[test]
    fn start_and_end_picks_first_last_frame() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url(START_FRAME_URL.to_string()));
      b.end_frame = Some(ImageRef::Url(END_FRAME_URL.to_string()));
      assert!(matches!(unwrap_mode(b), FalVeo3p1Mode::FirstLastFrameToVideo(_)));
    }

    #[test]
    fn end_only_errors() {
      let mut b = base_builder();
      b.end_frame = Some(ImageRef::Url(END_FRAME_URL.to_string()));
      assert!(build_fal_veo_3p1_state(b).is_err());
    }

    #[test]
    fn reference_images_pick_reference_to_video() {
      let mut b = base_builder();
      b.reference_images = Some(ImageListRef::Urls(vec![REFERENCE_IMAGE_URL_A.to_string()]));
      assert!(matches!(unwrap_mode(b), FalVeo3p1Mode::ReferenceToVideo(_)));
    }

    #[test]
    fn reference_videos_pick_extend_video() {
      let mut b = base_builder();
      b.reference_videos = Some(VideoListRef::Urls(vec![REFERENCE_VIDEO_URL.to_string()]));
      assert!(matches!(unwrap_mode(b), FalVeo3p1Mode::ExtendVideo(_)));
    }

    #[test]
    fn empty_reference_lists_fall_through_to_t2v() {
      let mut b = base_builder();
      b.reference_images = Some(ImageListRef::Urls(vec![]));
      b.reference_videos = Some(VideoListRef::Urls(vec![]));
      assert!(matches!(unwrap_mode(b), FalVeo3p1Mode::TextToVideo(_)));
    }

    #[test]
    fn public_build_fn_wraps_request_enum() {
      match build_fal_veo_3p1(base_builder()).expect("build") {
        VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalVeo3p1(s)) => {
          assert!(matches!(s.mode, FalVeo3p1Mode::TextToVideo(_)));
        }
        _ => panic!("expected Request(FalVeo3p1)"),
      }
    }
  }

  mod extend_video {
    use super::*;

    #[test]
    fn extend_maps_video_url_and_7s_duration() {
      let mut b = base_builder();
      b.reference_videos = Some(VideoListRef::Urls(vec![REFERENCE_VIDEO_URL.to_string()]));
      b.duration_seconds = Some(7);
      match unwrap_mode(b) {
        FalVeo3p1Mode::ExtendVideo(r) => {
          assert_eq!(r.video_url, REFERENCE_VIDEO_URL);
          assert!(matches!(r.duration, Some(Veo3p1ExtendVideoDuration::SevenSeconds)));
        }
        _ => panic!("expected extend"),
      }
    }

    #[test]
    fn extend_requires_exactly_one_video() {
      let mut b = base_builder();
      b.reference_videos = Some(VideoListRef::Urls(vec![
        REFERENCE_VIDEO_URL.to_string(),
        "https://example.com/other.mp4".to_string(),
      ]));
      assert!(build_fal_veo_3p1_state(b).is_err());
    }

    #[test]
    fn extend_rejects_start_frame() {
      let mut b = base_builder();
      b.reference_videos = Some(VideoListRef::Urls(vec![REFERENCE_VIDEO_URL.to_string()]));
      b.start_frame = Some(ImageRef::Url(START_FRAME_URL.to_string()));
      assert!(build_fal_veo_3p1_state(b).is_err());
    }

    #[test]
    fn extend_rejects_end_frame() {
      let mut b = base_builder();
      b.reference_videos = Some(VideoListRef::Urls(vec![REFERENCE_VIDEO_URL.to_string()]));
      b.end_frame = Some(ImageRef::Url(END_FRAME_URL.to_string()));
      assert!(build_fal_veo_3p1_state(b).is_err());
    }

    #[test]
    fn extend_rejects_reference_images() {
      let mut b = base_builder();
      b.reference_videos = Some(VideoListRef::Urls(vec![REFERENCE_VIDEO_URL.to_string()]));
      b.reference_images = Some(ImageListRef::Urls(vec![REFERENCE_IMAGE_URL_A.to_string()]));
      assert!(build_fal_veo_3p1_state(b).is_err());
    }

    #[test]
    fn extend_duration_5s_pay_more_upgrades_to_6() {
      let mut b = base_builder();
      b.reference_videos = Some(VideoListRef::Urls(vec![REFERENCE_VIDEO_URL.to_string()]));
      b.duration_seconds = Some(5);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayMoreUpgrade;
      match unwrap_mode(b) {
        FalVeo3p1Mode::ExtendVideo(r) => {
          assert!(matches!(r.duration, Some(Veo3p1ExtendVideoDuration::SixSeconds)));
        }
        _ => panic!("expected extend"),
      }
    }

    #[test]
    fn extend_4k_errors_with_error_out() {
      let mut b = base_builder();
      b.reference_videos = Some(VideoListRef::Urls(vec![REFERENCE_VIDEO_URL.to_string()]));
      b.resolution = Some(RouterResolution::FourK);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      assert!(build_fal_veo_3p1_state(b).is_err());
    }

    #[test]
    fn extend_4k_maps_to_1080p_with_mitigation() {
      for strategy in [
        RequestMismatchMitigationStrategy::PayMoreUpgrade,
        RequestMismatchMitigationStrategy::PayLessDowngrade,
      ] {
        let mut b = base_builder();
        b.reference_videos = Some(VideoListRef::Urls(vec![REFERENCE_VIDEO_URL.to_string()]));
        b.resolution = Some(RouterResolution::FourK);
        b.request_mismatch_mitigation_strategy = strategy;
        match unwrap_mode(b) {
          FalVeo3p1Mode::ExtendVideo(r) => {
            assert!(matches!(r.resolution, Some(Veo3p1ExtendVideoResolution::TenEightyP)));
          }
          _ => panic!("expected extend"),
        }
      }
    }
  }

  mod reference_to_video {
    use super::*;

    #[test]
    fn reference_maps_image_urls() {
      let mut b = base_builder();
      b.reference_images = Some(ImageListRef::Urls(vec![
        REFERENCE_IMAGE_URL_A.to_string(),
        REFERENCE_IMAGE_URL_B.to_string(),
      ]));
      match unwrap_mode(b) {
        FalVeo3p1Mode::ReferenceToVideo(r) => {
          assert_eq!(r.image_urls, vec![REFERENCE_IMAGE_URL_A, REFERENCE_IMAGE_URL_B]);
        }
        _ => panic!("expected reference"),
      }
    }

    #[test]
    fn reference_rejects_start_frame() {
      let mut b = base_builder();
      b.reference_images = Some(ImageListRef::Urls(vec![REFERENCE_IMAGE_URL_A.to_string()]));
      b.start_frame = Some(ImageRef::Url(START_FRAME_URL.to_string()));
      assert!(build_fal_veo_3p1_state(b).is_err());
    }

    #[test]
    fn reference_rejects_end_frame() {
      let mut b = base_builder();
      b.reference_images = Some(ImageListRef::Urls(vec![REFERENCE_IMAGE_URL_A.to_string()]));
      b.end_frame = Some(ImageRef::Url(END_FRAME_URL.to_string()));
      assert!(build_fal_veo_3p1_state(b).is_err());
    }

    #[test]
    fn reference_auto_aspect_ratio_is_omitted() {
      // reference-to-video has no `auto` wire value; Auto must map to None.
      let mut b = base_builder();
      b.reference_images = Some(ImageListRef::Urls(vec![REFERENCE_IMAGE_URL_A.to_string()]));
      b.aspect_ratio = Some(RouterAspectRatio::Auto);
      match unwrap_mode(b) {
        FalVeo3p1Mode::ReferenceToVideo(r) => assert!(r.aspect_ratio.is_none()),
        _ => panic!("expected reference"),
      }
    }

    #[test]
    fn reference_maps_duration_and_resolution() {
      let mut b = base_builder();
      b.reference_images = Some(ImageListRef::Urls(vec![REFERENCE_IMAGE_URL_A.to_string()]));
      b.duration_seconds = Some(6);
      b.resolution = Some(RouterResolution::FourK);
      match unwrap_mode(b) {
        FalVeo3p1Mode::ReferenceToVideo(r) => {
          assert!(matches!(r.duration, Some(Veo3p1ReferenceToVideoDuration::SixSeconds)));
          assert!(matches!(r.resolution, Some(Veo3p1ReferenceToVideoResolution::FourK)));
        }
        _ => panic!("expected reference"),
      }
    }
  }

  mod duration_conversions {
    use super::*;

    #[test]
    fn duration_4s() {
      let mut b = base_builder();
      b.duration_seconds = Some(4);
      match unwrap_mode(b) {
        FalVeo3p1Mode::TextToVideo(r) => {
          assert!(matches!(r.duration, Some(Veo3p1TextToVideoDuration::FourSeconds)));
        }
        _ => panic!("expected t2v"),
      }
    }

    #[test]
    fn unsupported_duration_errors_with_error_out() {
      let mut b = base_builder();
      b.duration_seconds = Some(5);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      assert!(build_fal_veo_3p1_state(b).is_err());
    }

    #[test]
    fn duration_5s_pay_more_upgrades_to_6() {
      let mut b = base_builder();
      b.duration_seconds = Some(5);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayMoreUpgrade;
      match unwrap_mode(b) {
        FalVeo3p1Mode::TextToVideo(r) => {
          assert!(matches!(r.duration, Some(Veo3p1TextToVideoDuration::SixSeconds)));
        }
        _ => panic!("expected t2v"),
      }
    }

    #[test]
    fn duration_5s_pay_less_downgrades_to_4() {
      let mut b = base_builder();
      b.duration_seconds = Some(5);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayLessDowngrade;
      match unwrap_mode(b) {
        FalVeo3p1Mode::TextToVideo(r) => {
          assert!(matches!(r.duration, Some(Veo3p1TextToVideoDuration::FourSeconds)));
        }
        _ => panic!("expected t2v"),
      }
    }
  }

  mod resolution_conversions {
    use super::*;

    #[test]
    fn t2v_720p() {
      let mut b = base_builder();
      b.resolution = Some(RouterResolution::SevenTwentyP);
      match unwrap_mode(b) {
        FalVeo3p1Mode::TextToVideo(r) => {
          assert!(matches!(r.resolution, Some(Veo3p1TextToVideoResolution::SevenTwentyP)));
        }
        _ => panic!("expected t2v"),
      }
    }

    #[test]
    fn t2v_4k_maps_to_four_k() {
      let mut b = base_builder();
      b.resolution = Some(RouterResolution::FourK);
      match unwrap_mode(b) {
        FalVeo3p1Mode::TextToVideo(r) => {
          assert!(matches!(r.resolution, Some(Veo3p1TextToVideoResolution::FourK)));
        }
        _ => panic!("expected t2v"),
      }
    }
  }

  mod aspect_ratio_conversions {
    use super::*;

    #[test]
    fn t2v_auto_aspect_ratio_is_omitted() {
      // t2v has no `auto` wire value; Auto must map to None.
      let mut b = base_builder();
      b.aspect_ratio = Some(RouterAspectRatio::Auto);
      match unwrap_mode(b) {
        FalVeo3p1Mode::TextToVideo(r) => assert!(r.aspect_ratio.is_none()),
        _ => panic!("expected t2v"),
      }
    }

    #[test]
    fn i2v_auto_aspect_ratio_maps_to_auto() {
      let mut b = base_builder();
      b.aspect_ratio = Some(RouterAspectRatio::Auto);
      b.start_frame = Some(ImageRef::Url(START_FRAME_URL.to_string()));
      match unwrap_mode(b) {
        FalVeo3p1Mode::ImageToVideo(r) => {
          assert!(matches!(r.aspect_ratio, Some(Veo3p1ImageToVideoAspectRatio::Auto)));
        }
        _ => panic!("expected i2v"),
      }
    }
  }

  #[test]
  fn full_combinatorial_pass() {
    let resolutions = [None, Some(RouterResolution::SevenTwentyP), Some(RouterResolution::TenEightyP), Some(RouterResolution::FourK)];
    let durations = [None, Some(4u16), Some(6), Some(8)];
    let aspect_ratios = [None, Some(RouterAspectRatio::Auto), Some(RouterAspectRatio::WideSixteenByNine), Some(RouterAspectRatio::TallNineBySixteen)];
    let audios = [None, Some(true), Some(false)];

    let mut combos = 0;
    for &resolution in &resolutions {
      for &duration in &durations {
        for &aspect_ratio in &aspect_ratios {
          for &generate_audio in &audios {
            for frames in [0, 1, 2] {
              let mut b = base_builder();
              b.resolution = resolution;
              b.duration_seconds = duration;
              b.aspect_ratio = aspect_ratio;
              b.generate_audio = generate_audio;
              if frames >= 1 {
                b.start_frame = Some(ImageRef::Url(START_FRAME_URL.to_string()));
              }
              if frames == 2 {
                b.end_frame = Some(ImageRef::Url(END_FRAME_URL.to_string()));
              }
              assert!(build_fal_veo_3p1_state(b).is_ok());
              combos += 1;
            }
          }
        }
      }
    }
    assert_eq!(combos, 4 * 4 * 4 * 3 * 3);
  }

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Veo3p1,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      ..Default::default()
    }
  }

  fn unwrap_mode(b: GenerateVideoRequestBuilder) -> FalVeo3p1Mode {
    build_fal_veo_3p1_state(b).expect("build").mode
  }
}

use fal_client::requests::api::video::image::veo_3p1_lite::api::{
  Veo3p1LiteImageToVideoAspectRatio, Veo3p1LiteImageToVideoDuration, Veo3p1LiteImageToVideoRequest,
  Veo3p1LiteImageToVideoResolution,
};
use fal_client::requests::api::video::images::veo_3p1_lite::api::{
  Veo3p1LiteFirstLastFrameToVideoAspectRatio, Veo3p1LiteFirstLastFrameToVideoDuration,
  Veo3p1LiteFirstLastFrameToVideoRequest, Veo3p1LiteFirstLastFrameToVideoResolution,
};
use fal_client::requests::api::video::text::veo_3p1_lite::api::{
  Veo3p1LiteTextToVideoAspectRatio, Veo3p1LiteTextToVideoDuration, Veo3p1LiteTextToVideoRequest,
  Veo3p1LiteTextToVideoResolution,
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
use crate::generate::generate_video::providers::fal::veo_3p1_lite::request::{
  FalVeo3p1LiteMode, FalVeo3p1LiteRequestState,
};
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
}

#[derive(Debug, Clone, Copy)]
pub(crate) enum PlanDuration {
  Four,
  Six,
  Eight,
}

pub fn build_fal_veo_3p1_lite(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_veo_3p1_lite_state(builder)?;
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalVeo3p1Lite(state)))
}

pub(crate) fn build_fal_veo_3p1_lite_state(
  builder: GenerateVideoRequestBuilder,
) -> Result<FalVeo3p1LiteRequestState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // Lite has no reference-to-video or extend-video endpoints on fal.
  if has_reference_videos(&builder.reference_videos) {
    return Err(unsupported(
      "reference_videos",
      "Veo 3.1 Lite does not support extend-video (reference videos)",
    ));
  }
  if has_reference_images(&builder.reference_images) {
    return Err(unsupported(
      "reference_images",
      "Veo 3.1 Lite does not support reference-to-video (reference images)",
    ));
  }

  let start = optional_url(builder.start_frame.clone())?;
  let end = optional_url(builder.end_frame.clone())?;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
  let resolution = plan_resolution(builder.resolution, strategy)?;
  let duration = plan_duration(builder.duration_seconds, strategy)?;
  let prompt = builder.prompt.clone().unwrap_or_default();
  let negative_prompt = builder.negative_prompt.clone();
  let generate_audio = builder.generate_audio;

  let mode = match (start, end) {
    (None, None) => FalVeo3p1LiteMode::TextToVideo(Veo3p1LiteTextToVideoRequest {
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
    (Some(image_url), None) => FalVeo3p1LiteMode::ImageToVideo(Veo3p1LiteImageToVideoRequest {
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
    (Some(first_frame_url), Some(last_frame_url)) => FalVeo3p1LiteMode::FirstLastFrameToVideo(
      Veo3p1LiteFirstLastFrameToVideoRequest {
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
        "Veo 3.1 Lite requires a start_frame when end_frame is provided",
      ));
    }
  };

  Ok(FalVeo3p1LiteRequestState { mode })
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

fn has_reference_images(refs: &Option<ImageListRef>) -> bool {
  match refs {
    None => false,
    Some(ImageListRef::Urls(urls)) => !urls.is_empty(),
    Some(ImageListRef::MediaFileTokens(tokens)) => !tokens.is_empty(),
  }
}

fn has_reference_videos(refs: &Option<VideoListRef>) -> bool {
  match refs {
    None => false,
    Some(VideoListRef::Urls(urls)) => !urls.is_empty(),
    Some(VideoListRef::MediaFileTokens(tokens)) => !tokens.is_empty(),
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
    // Lite has no 4k tier; the nearest supported resolution in either
    // direction is 1080p.
    Some(RouterResolution::FourK) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("resolution", "Veo 3.1 Lite does not support 4k"))
      }
      _ => Ok(Some(R::TenEightyP)),
    },
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

fn unsupported(field: &'static str, value: &str) -> ArtcraftRouterError {
  ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
    field,
    value: value.to_string(),
  })
}

// The Lite text-to-video endpoint has no `auto` aspect ratio; omit the field
// and let fal apply its own default (16:9).
fn to_t2v_aspect_ratio(a: PlanAspectRatio) -> Option<Veo3p1LiteTextToVideoAspectRatio> {
  match a {
    PlanAspectRatio::Auto => None,
    PlanAspectRatio::SixteenByNine => Some(Veo3p1LiteTextToVideoAspectRatio::SixteenByNine),
    PlanAspectRatio::NineBySixteen => Some(Veo3p1LiteTextToVideoAspectRatio::NineBySixteen),
  }
}

fn to_t2v_duration(d: PlanDuration) -> Veo3p1LiteTextToVideoDuration {
  match d {
    PlanDuration::Four => Veo3p1LiteTextToVideoDuration::FourSeconds,
    PlanDuration::Six => Veo3p1LiteTextToVideoDuration::SixSeconds,
    PlanDuration::Eight => Veo3p1LiteTextToVideoDuration::EightSeconds,
  }
}

fn to_t2v_resolution(r: PlanResolution) -> Veo3p1LiteTextToVideoResolution {
  match r {
    PlanResolution::SevenTwentyP => Veo3p1LiteTextToVideoResolution::SevenTwentyP,
    PlanResolution::TenEightyP => Veo3p1LiteTextToVideoResolution::TenEightyP,
  }
}

fn to_i2v_aspect_ratio(a: PlanAspectRatio) -> Veo3p1LiteImageToVideoAspectRatio {
  match a {
    PlanAspectRatio::Auto => Veo3p1LiteImageToVideoAspectRatio::Auto,
    PlanAspectRatio::SixteenByNine => Veo3p1LiteImageToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => Veo3p1LiteImageToVideoAspectRatio::NineBySixteen,
  }
}

fn to_i2v_duration(d: PlanDuration) -> Veo3p1LiteImageToVideoDuration {
  match d {
    PlanDuration::Four => Veo3p1LiteImageToVideoDuration::FourSeconds,
    PlanDuration::Six => Veo3p1LiteImageToVideoDuration::SixSeconds,
    PlanDuration::Eight => Veo3p1LiteImageToVideoDuration::EightSeconds,
  }
}

fn to_i2v_resolution(r: PlanResolution) -> Veo3p1LiteImageToVideoResolution {
  match r {
    PlanResolution::SevenTwentyP => Veo3p1LiteImageToVideoResolution::SevenTwentyP,
    PlanResolution::TenEightyP => Veo3p1LiteImageToVideoResolution::TenEightyP,
  }
}

fn to_flf_aspect_ratio(a: PlanAspectRatio) -> Veo3p1LiteFirstLastFrameToVideoAspectRatio {
  match a {
    PlanAspectRatio::Auto => Veo3p1LiteFirstLastFrameToVideoAspectRatio::Auto,
    PlanAspectRatio::SixteenByNine => Veo3p1LiteFirstLastFrameToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => Veo3p1LiteFirstLastFrameToVideoAspectRatio::NineBySixteen,
  }
}

fn to_flf_duration(d: PlanDuration) -> Veo3p1LiteFirstLastFrameToVideoDuration {
  match d {
    PlanDuration::Four => Veo3p1LiteFirstLastFrameToVideoDuration::FourSeconds,
    PlanDuration::Six => Veo3p1LiteFirstLastFrameToVideoDuration::SixSeconds,
    PlanDuration::Eight => Veo3p1LiteFirstLastFrameToVideoDuration::EightSeconds,
  }
}

fn to_flf_resolution(r: PlanResolution) -> Veo3p1LiteFirstLastFrameToVideoResolution {
  match r {
    PlanResolution::SevenTwentyP => Veo3p1LiteFirstLastFrameToVideoResolution::SevenTwentyP,
    PlanResolution::TenEightyP => Veo3p1LiteFirstLastFrameToVideoResolution::TenEightyP,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_video_model::RouterVideoModel;

  use super::*;

  const START_FRAME_URL: &str = "https://example.com/a.png";
  const END_FRAME_URL: &str = "https://example.com/b.png";
  const REFERENCE_IMAGE_URL: &str = "https://example.com/ref.png";
  const REFERENCE_VIDEO_URL: &str = "https://example.com/in.mp4";

  mod mode_selection {
    use super::*;

    #[test]
    fn no_frames_picks_t2v() {
      assert!(matches!(unwrap_mode(base_builder()), FalVeo3p1LiteMode::TextToVideo(_)));
    }

    #[test]
    fn start_only_picks_i2v() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url(START_FRAME_URL.to_string()));
      assert!(matches!(unwrap_mode(b), FalVeo3p1LiteMode::ImageToVideo(_)));
    }

    #[test]
    fn start_and_end_picks_first_last_frame() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url(START_FRAME_URL.to_string()));
      b.end_frame = Some(ImageRef::Url(END_FRAME_URL.to_string()));
      assert!(matches!(unwrap_mode(b), FalVeo3p1LiteMode::FirstLastFrameToVideo(_)));
    }

    #[test]
    fn end_only_errors() {
      let mut b = base_builder();
      b.end_frame = Some(ImageRef::Url(END_FRAME_URL.to_string()));
      assert!(build_fal_veo_3p1_lite_state(b).is_err());
    }
  }

  mod unsupported_modalities {
    use super::*;

    #[test]
    fn reference_images_are_rejected() {
      let mut b = base_builder();
      b.reference_images = Some(ImageListRef::Urls(vec![REFERENCE_IMAGE_URL.to_string()]));
      assert!(build_fal_veo_3p1_lite_state(b).is_err());
    }

    #[test]
    fn reference_videos_are_rejected() {
      let mut b = base_builder();
      b.reference_videos = Some(VideoListRef::Urls(vec![REFERENCE_VIDEO_URL.to_string()]));
      assert!(build_fal_veo_3p1_lite_state(b).is_err());
    }

    #[test]
    fn empty_reference_lists_are_ignored() {
      let mut b = base_builder();
      b.reference_images = Some(ImageListRef::Urls(vec![]));
      b.reference_videos = Some(VideoListRef::Urls(vec![]));
      assert!(matches!(unwrap_mode(b), FalVeo3p1LiteMode::TextToVideo(_)));
    }
  }

  mod duration_conversions {
    use super::*;

    #[test]
    fn duration_4s() {
      let mut b = base_builder();
      b.duration_seconds = Some(4);
      match unwrap_mode(b) {
        FalVeo3p1LiteMode::TextToVideo(r) => {
          assert!(matches!(r.duration, Some(Veo3p1LiteTextToVideoDuration::FourSeconds)));
        }
        _ => panic!("expected t2v"),
      }
    }

    #[test]
    fn unsupported_duration_errors_with_error_out() {
      let mut b = base_builder();
      b.duration_seconds = Some(5);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      assert!(build_fal_veo_3p1_lite_state(b).is_err());
    }

    #[test]
    fn duration_5s_pay_more_upgrades_to_6() {
      let mut b = base_builder();
      b.duration_seconds = Some(5);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayMoreUpgrade;
      match unwrap_mode(b) {
        FalVeo3p1LiteMode::TextToVideo(r) => {
          assert!(matches!(r.duration, Some(Veo3p1LiteTextToVideoDuration::SixSeconds)));
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
        FalVeo3p1LiteMode::TextToVideo(r) => {
          assert!(matches!(r.duration, Some(Veo3p1LiteTextToVideoDuration::FourSeconds)));
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
        FalVeo3p1LiteMode::TextToVideo(r) => {
          assert!(matches!(r.resolution, Some(Veo3p1LiteTextToVideoResolution::SevenTwentyP)));
        }
        _ => panic!("expected t2v"),
      }
    }

    #[test]
    fn four_k_errors_with_error_out() {
      let mut b = base_builder();
      b.resolution = Some(RouterResolution::FourK);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      assert!(build_fal_veo_3p1_lite_state(b).is_err());
    }

    #[test]
    fn four_k_maps_to_1080p_with_mitigation() {
      for strategy in [
        RequestMismatchMitigationStrategy::PayMoreUpgrade,
        RequestMismatchMitigationStrategy::PayLessDowngrade,
      ] {
        let mut b = base_builder();
        b.resolution = Some(RouterResolution::FourK);
        b.request_mismatch_mitigation_strategy = strategy;
        match unwrap_mode(b) {
          FalVeo3p1LiteMode::TextToVideo(r) => {
            assert!(matches!(r.resolution, Some(Veo3p1LiteTextToVideoResolution::TenEightyP)));
          }
          _ => panic!("expected t2v"),
        }
      }
    }
  }

  #[test]
  fn t2v_auto_aspect_ratio_is_omitted() {
    // Lite t2v has no `auto` wire value; Auto must map to None.
    let mut b = base_builder();
    b.aspect_ratio = Some(RouterAspectRatio::Auto);
    match unwrap_mode(b) {
      FalVeo3p1LiteMode::TextToVideo(r) => assert!(r.aspect_ratio.is_none()),
      _ => panic!("expected t2v"),
    }
  }

  #[test]
  fn i2v_auto_aspect_ratio_maps_to_auto() {
    let mut b = base_builder();
    b.aspect_ratio = Some(RouterAspectRatio::Auto);
    b.start_frame = Some(ImageRef::Url(START_FRAME_URL.to_string()));
    match unwrap_mode(b) {
      FalVeo3p1LiteMode::ImageToVideo(r) => {
        assert!(matches!(r.aspect_ratio, Some(Veo3p1LiteImageToVideoAspectRatio::Auto)));
      }
      _ => panic!("expected i2v"),
    }
  }

  #[test]
  fn full_combinatorial_pass() {
    let resolutions = [None, Some(RouterResolution::SevenTwentyP), Some(RouterResolution::TenEightyP)];
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
              assert!(build_fal_veo_3p1_lite_state(b).is_ok());
              combos += 1;
            }
          }
        }
      }
    }
    assert_eq!(combos, 3 * 4 * 4 * 3 * 3);
  }

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Veo3p1Lite,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      ..Default::default()
    }
  }

  fn unwrap_mode(b: GenerateVideoRequestBuilder) -> FalVeo3p1LiteMode {
    build_fal_veo_3p1_lite_state(b).expect("build").mode
  }
}

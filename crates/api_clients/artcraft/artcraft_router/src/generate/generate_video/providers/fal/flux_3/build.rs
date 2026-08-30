use fal_client::requests::api::video::image::flux_3::api::Flux3ImageToVideoRequest;
use fal_client::requests::api::video::images::flux_3::api::Flux3FirstLastFrameToVideoRequest;
use fal_client::requests::api::video::text::flux_3::api::{
  Flux3AspectRatio, Flux3Duration, Flux3Resolution, Flux3TextToVideoRequest,
};

use crate::api::audio_list_ref::AudioListRef;
use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_resolution::RouterResolution;
use crate::api::video_list_ref::VideoListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::fal::flux_3::request::{
  FalFlux3Mode, FalFlux3RequestState,
};
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

pub(crate) const MIN_DURATION_SECONDS: u16 = 5;
pub(crate) const MAX_DURATION_SECONDS: u16 = 20;

#[derive(Debug, Clone, Copy)]
pub(crate) enum PlanAspectRatio {
  Auto,
  TwentyOneByNine,
  SixteenByNine,
  FourByThree,
  Square,
  ThreeByFour,
  NineBySixteen,
}

pub fn build_fal_flux_3(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_flux_3_state(builder)?;
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalFlux3(state)))
}

pub(crate) fn build_fal_flux_3_state(
  builder: GenerateVideoRequestBuilder,
) -> Result<FalFlux3RequestState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // Flux 3 exposes no reference modality here — only text, starting keyframe,
  // and start/end keyframes.
  reject_references(&builder)?;

  let start = optional_url(builder.start_frame.clone())?;
  let end = optional_url(builder.end_frame.clone())?;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
  let resolution = plan_resolution(builder.resolution, strategy)?;
  let flexible_duration = plan_flexible_duration(builder.duration_seconds, strategy)?;
  let fixed_duration = plan_fixed_duration(builder.duration_seconds, strategy)?;
  let prompt = builder.prompt.clone().unwrap_or_default();
  let generate_audio = builder.generate_audio;

  // Modality dispatch:
  //   start + end frames → first-last-frame-to-video
  //   start frame only   → image-to-video
  //   no media           → text-to-video
  let mode = match (start, end) {
    (None, None) => FalFlux3Mode::TextToVideo(Flux3TextToVideoRequest {
      prompt,
      duration: flexible_duration,
      resolution,
      aspect_ratio: aspect_ratio.map(to_flux_3_aspect_ratio),
      generate_audio,
      safety_tolerance: Some(4), // NB: 4 is the most permissive.
    }),
    (Some(image_url), None) => FalFlux3Mode::ImageToVideo(Flux3ImageToVideoRequest {
      prompt,
      image_url,
      duration: flexible_duration,
      resolution,
      aspect_ratio: aspect_ratio.map(to_flux_3_aspect_ratio),
      generate_audio,
      safety_tolerance: Some(4), // NB: 4 is the most permissive.
    }),
    (Some(start_image_url), Some(end_image_url)) => FalFlux3Mode::FirstLastFrameToVideo(
      Flux3FirstLastFrameToVideoRequest {
        prompt,
        start_image_url,
        end_image_url,
        duration: fixed_duration,
        resolution,
        aspect_ratio: aspect_ratio.map(to_flux_3_aspect_ratio),
        generate_audio,
        safety_tolerance: Some(4), // NB: 4 is the most permissive.
      },
    ),
    (None, Some(_)) => {
      return Err(unsupported(
        "end_frame",
        "Flux 3 requires a start_frame when end_frame is provided",
      ));
    }
  };

  Ok(FalFlux3RequestState { mode })
}

// ── Input helpers (shared with the draft variant) ──

pub(crate) fn unsupported(field: &'static str, value: &str) -> ArtcraftRouterError {
  ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
    field,
    value: value.to_string(),
  })
}

/// Flux 3 supports no reference inputs — no image, video, or audio references.
pub(crate) fn reject_references(builder: &GenerateVideoRequestBuilder) -> Result<(), ArtcraftRouterError> {
  let has_reference_images = match &builder.reference_images {
    None => false,
    Some(ImageListRef::Urls(urls)) => !urls.is_empty(),
    Some(ImageListRef::MediaFileTokens(tokens)) => !tokens.is_empty(),
  };
  if has_reference_images {
    return Err(unsupported("reference_images", "Flux 3 does not support image references"));
  }

  let has_reference_videos = match &builder.reference_videos {
    None => false,
    Some(VideoListRef::Urls(urls)) => !urls.is_empty(),
    Some(VideoListRef::MediaFileTokens(tokens)) => !tokens.is_empty(),
  };
  if has_reference_videos {
    return Err(unsupported("reference_videos", "Flux 3 does not support video references"));
  }

  let has_reference_audio = match &builder.reference_audio {
    None => false,
    Some(AudioListRef::Urls(urls)) => !urls.is_empty(),
    Some(AudioListRef::MediaFileTokens(tokens)) => !tokens.is_empty(),
  };
  if has_reference_audio {
    return Err(unsupported("reference_audio", "Flux 3 does not support audio references"));
  }

  Ok(())
}

pub(crate) fn optional_url(image_ref: Option<ImageRef>) -> Result<Option<String>, ArtcraftRouterError> {
  match image_ref {
    None => Ok(None),
    Some(ImageRef::Url(url)) => Ok(Some(url)),
    Some(ImageRef::MediaFileToken(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
  }
}

// ── Plan helpers (shared with the draft variant) ──

pub(crate) fn plan_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<PlanAspectRatio>, ArtcraftRouterError> {
  use PlanAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(None),

    Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto3k)
    | Some(RouterAspectRatio::Auto4k) => Ok(Some(Ar::Auto)),

    Some(RouterAspectRatio::WideTwentyOneByNine) => Ok(Some(Ar::TwentyOneByNine)),
    Some(RouterAspectRatio::WideSixteenByNine) | Some(RouterAspectRatio::Wide) => Ok(Some(Ar::SixteenByNine)),
    Some(RouterAspectRatio::TallNineBySixteen) | Some(RouterAspectRatio::Tall) => Ok(Some(Ar::NineBySixteen)),
    Some(RouterAspectRatio::WideFourByThree) => Ok(Some(Ar::FourByThree)),
    Some(RouterAspectRatio::TallThreeByFour) => Ok(Some(Ar::ThreeByFour)),
    Some(RouterAspectRatio::Square) | Some(RouterAspectRatio::SquareHd) => Ok(Some(Ar::Square)),

    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("aspect_ratio", &format!("{:?}", other)))
      }
      _ => Ok(Some(Ar::Auto)),
    },
  }
}

/// Flux 3 renders 720p or 1080p; 480p rounds up to 720p (same billing tier).
pub(crate) fn plan_resolution(
  resolution: Option<RouterResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Flux3Resolution>, ArtcraftRouterError> {
  match resolution {
    None => Ok(None),

    Some(RouterResolution::FourEightyP)
    | Some(RouterResolution::SevenTwentyP) => Ok(Some(Flux3Resolution::SevenTwentyP)),
    Some(RouterResolution::TenEightyP) => Ok(Some(Flux3Resolution::TenEightyP)),

    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("resolution", &format!("{:?}", other)))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(Flux3Resolution::TenEightyP)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(Flux3Resolution::SevenTwentyP)),
    },
  }
}

/// Duration for the modalities that accept `auto` (text, image). `None` stays
/// unset so fal's `auto` default applies.
pub(crate) fn plan_flexible_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Flux3Duration>, ArtcraftRouterError> {
  Ok(plan_fixed_duration(duration_seconds, strategy)?.map(Flux3Duration::Seconds))
}

/// Duration for the fixed-duration first-last-frame modality. `None` stays
/// unset so fal's 5-second default applies.
pub(crate) fn plan_fixed_duration(
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
        Err(unsupported("duration_seconds", &format!("{}", other)))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(other.clamp(MIN_DURATION_SECONDS, MAX_DURATION_SECONDS) as u8))
      }
    },
  }
}

// ── Leaf converters ──

pub(crate) fn to_flux_3_aspect_ratio(a: PlanAspectRatio) -> Flux3AspectRatio {
  match a {
    PlanAspectRatio::Auto => Flux3AspectRatio::Auto,
    PlanAspectRatio::TwentyOneByNine => Flux3AspectRatio::TwentyOneByNine,
    PlanAspectRatio::SixteenByNine => Flux3AspectRatio::SixteenByNine,
    PlanAspectRatio::FourByThree => Flux3AspectRatio::FourByThree,
    PlanAspectRatio::Square => Flux3AspectRatio::Square,
    PlanAspectRatio::ThreeByFour => Flux3AspectRatio::ThreeByFour,
    PlanAspectRatio::NineBySixteen => Flux3AspectRatio::NineBySixteen,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_video_model::RouterVideoModel;

  use super::*;

  const START_URL: &str = "https://example.com/start.png";
  const END_URL: &str = "https://example.com/end.png";

  mod dispatch_tests {
    use super::*;

    #[test]
    fn no_inputs_picks_t2v() {
      let state = build_fal_flux_3_state(base_builder()).expect("build");
      assert!(matches!(state.mode, FalFlux3Mode::TextToVideo(_)));
    }

    #[test]
    fn start_frame_picks_i2v() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url(START_URL.to_string()));
      let state = build_fal_flux_3_state(b).expect("build");
      assert!(matches!(state.mode, FalFlux3Mode::ImageToVideo(_)));
    }

    #[test]
    fn start_and_end_frames_pick_first_last_frame() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url(START_URL.to_string()));
      b.end_frame = Some(ImageRef::Url(END_URL.to_string()));
      let state = build_fal_flux_3_state(b).expect("build");
      let FalFlux3Mode::FirstLastFrameToVideo(req) = state.mode else {
        panic!("expected FirstLastFrameToVideo");
      };
      assert_eq!(req.start_image_url, START_URL);
      assert_eq!(req.end_image_url, END_URL);
    }

    #[test]
    fn end_frame_without_start_frame_errors() {
      let mut b = base_builder();
      b.end_frame = Some(ImageRef::Url(END_URL.to_string()));
      assert!(build_fal_flux_3_state(b).is_err());
    }

    #[test]
    fn reference_images_error() {
      let mut b = base_builder();
      b.reference_images = Some(ImageListRef::Urls(vec!["https://example.com/ref.png".to_string()]));
      assert!(build_fal_flux_3_state(b).is_err());
    }

    #[test]
    fn reference_videos_error() {
      let mut b = base_builder();
      b.reference_videos = Some(VideoListRef::Urls(vec!["https://example.com/v.mp4".to_string()]));
      assert!(build_fal_flux_3_state(b).is_err());
    }

    #[test]
    fn reference_audio_errors() {
      let mut b = base_builder();
      b.reference_audio = Some(AudioListRef::Urls(vec!["https://example.com/a.mp3".to_string()]));
      assert!(build_fal_flux_3_state(b).is_err());
    }

    #[test]
    fn empty_reference_lists_are_ignored() {
      let mut b = base_builder();
      b.reference_images = Some(ImageListRef::Urls(vec![]));
      b.reference_videos = Some(VideoListRef::Urls(vec![]));
      b.reference_audio = Some(AudioListRef::Urls(vec![]));
      let state = build_fal_flux_3_state(b).expect("build");
      assert!(matches!(state.mode, FalFlux3Mode::TextToVideo(_)));
    }
  }

  mod plan_tests {
    use super::*;

    #[test]
    fn duration_25_errors_under_error_out() {
      let mut b = base_builder();
      b.duration_seconds = Some(25);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      assert!(build_fal_flux_3_state(b).is_err());
    }

    #[test]
    fn duration_25_clamps_to_20_under_pay_less() {
      let mut b = base_builder();
      b.duration_seconds = Some(25);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayLessDowngrade;
      let state = build_fal_flux_3_state(b).expect("build");
      let FalFlux3Mode::TextToVideo(req) = state.mode else {
        panic!("expected TextToVideo");
      };
      assert_eq!(req.duration, Some(Flux3Duration::Seconds(20)));
    }

    #[test]
    fn resolution_480p_and_720p_map_to_720p() {
      for res in [RouterResolution::FourEightyP, RouterResolution::SevenTwentyP] {
        let mut b = base_builder();
        b.resolution = Some(res);
        let state = build_fal_flux_3_state(b).expect("build");
        let FalFlux3Mode::TextToVideo(req) = state.mode else {
          panic!("expected TextToVideo");
        };
        assert_eq!(req.resolution, Some(Flux3Resolution::SevenTwentyP), "res={res:?}");
      }
    }

    #[test]
    fn auto_aspect_ratio_maps_to_flux_auto() {
      let mut b = base_builder();
      b.aspect_ratio = Some(RouterAspectRatio::Auto);
      let state = build_fal_flux_3_state(b).expect("build");
      let FalFlux3Mode::TextToVideo(req) = state.mode else {
        panic!("expected TextToVideo");
      };
      assert_eq!(req.aspect_ratio, Some(Flux3AspectRatio::Auto));
    }

    #[test]
    fn twenty_one_by_nine_is_supported() {
      let mut b = base_builder();
      b.aspect_ratio = Some(RouterAspectRatio::WideTwentyOneByNine);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      let state = build_fal_flux_3_state(b).expect("build");
      let FalFlux3Mode::TextToVideo(req) = state.mode else {
        panic!("expected TextToVideo");
      };
      assert_eq!(req.aspect_ratio, Some(Flux3AspectRatio::TwentyOneByNine));
    }

    #[test]
    fn generate_audio_propagates() {
      let mut b = base_builder();
      b.generate_audio = Some(false);
      let state = build_fal_flux_3_state(b).expect("build");
      let FalFlux3Mode::TextToVideo(req) = state.mode else {
        panic!("expected TextToVideo");
      };
      assert_eq!(req.generate_audio, Some(false));
    }
  }

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Flux3,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      ..Default::default()
    }
  }
}

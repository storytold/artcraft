use fal_client::requests::api::video::image::minimax_h3::api::MinimaxH3ImageToVideoRequest;
use fal_client::requests::api::video::reference::minimax_h3::api::{
  MinimaxH3ReferenceToVideoAspectRatio, MinimaxH3ReferenceToVideoRequest,
};
use fal_client::requests::api::video::text::minimax_h3::api::{
  MinimaxH3Resolution, MinimaxH3TextToVideoAspectRatio, MinimaxH3TextToVideoRequest,
};

use crate::api::audio_list_ref::AudioListRef;
use crate::api::image_list_ref::ImageListRef;
use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_resolution::RouterResolution;
use crate::api::video_list_ref::VideoListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::fal::kling_1_6_pro::build::optional_url;
use crate::generate::generate_video::providers::fal::minimax_h3::request::{
  FalMinimaxH3Mode, FalMinimaxH3RequestState,
};
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

const MAX_REFERENCE_IMAGES: usize = 9;
const MAX_REFERENCE_VIDEOS: usize = 3;
const MAX_REFERENCE_AUDIO: usize = 3;
const MAX_REFERENCE_FILES: usize = 12;
const MIN_DURATION_SECONDS: u16 = 5;
const MAX_DURATION_SECONDS: u16 = 15;

#[derive(Debug, Clone, Copy)]
pub(crate) enum PlanAspectRatio {
  TwentyOneByNine,
  SixteenByNine,
  FourByThree,
  Square,
  ThreeByFour,
  NineBySixteen,
}

pub fn build_fal_minimax_h3(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_minimax_h3_state(builder)?;
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalMinimaxH3(state)))
}

pub(crate) fn build_fal_minimax_h3_state(
  builder: GenerateVideoRequestBuilder,
) -> Result<FalMinimaxH3RequestState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
  let resolution = plan_resolution(builder.resolution, strategy)?;
  let duration = plan_duration(builder.duration_seconds, strategy)?;
  let prompt = builder.prompt.clone().unwrap_or_default();
  let reference_image_urls = resolve_image_urls(builder.reference_images.clone())?;
  let reference_video_urls = resolve_video_urls(builder.reference_videos.clone())?;
  let reference_audio_urls = resolve_audio_urls(builder.reference_audio.clone())?;
  let start_image_url = optional_url(builder.start_frame.clone())?;
  let end_image_url = optional_url(builder.end_frame.clone())?;

  let has_references = !reference_image_urls.is_empty()
    || !reference_video_urls.is_empty()
    || !reference_audio_urls.is_empty();

  // Dispatch: any reference asset → reference-to-video; start_frame → image; else → text.
  let mode = if has_references {
    if start_image_url.is_some() || end_image_url.is_some() {
      return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "reference_images",
        value: "MiniMax H3 reference-to-video cannot also accept a start_frame or end_frame".to_string(),
      }));
    }
    check_reference_counts(
      reference_image_urls.len(),
      reference_video_urls.len(),
      reference_audio_urls.len(),
    )?;
    FalMinimaxH3Mode::ReferenceToVideo(MinimaxH3ReferenceToVideoRequest {
      prompt,
      reference_image_urls: non_empty(reference_image_urls),
      reference_video_urls: non_empty(reference_video_urls),
      reference_audio_urls: non_empty(reference_audio_urls),
      duration,
      resolution,
      aspect_ratio: aspect_ratio.map(to_reference_aspect_ratio),
    })
  } else if let Some(image_url) = start_image_url {
    // Image-to-video has no aspect_ratio input — the output follows the start
    // frame — so any requested aspect ratio is silently dropped here.
    FalMinimaxH3Mode::ImageToVideo(MinimaxH3ImageToVideoRequest {
      prompt,
      image_url,
      end_image_url,
      duration,
      resolution,
    })
  } else {
    if end_image_url.is_some() {
      return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "end_frame",
        value: "MiniMax H3 requires a start_frame when end_frame is provided".to_string(),
      }));
    }
    FalMinimaxH3Mode::TextToVideo(MinimaxH3TextToVideoRequest {
      prompt,
      duration,
      resolution,
      aspect_ratio: aspect_ratio.map(to_t2v_aspect_ratio),
    })
  };

  Ok(FalMinimaxH3RequestState { mode })
}

// ── Input helpers ──

/// fal's reference limits: at most 9 images, 3 videos, 3 audio clips, and 12
/// files overall; audio cannot be the only reference input.
fn check_reference_counts(
  image_count: usize,
  video_count: usize,
  audio_count: usize,
) -> Result<(), ArtcraftRouterError> {
  if image_count > MAX_REFERENCE_IMAGES {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "reference_images",
      value: format!("MiniMax H3 supports at most {MAX_REFERENCE_IMAGES} reference images, got {image_count}"),
    }));
  }
  if video_count > MAX_REFERENCE_VIDEOS {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "reference_videos",
      value: format!("MiniMax H3 supports at most {MAX_REFERENCE_VIDEOS} reference videos, got {video_count}"),
    }));
  }
  if audio_count > MAX_REFERENCE_AUDIO {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "reference_audio",
      value: format!("MiniMax H3 supports at most {MAX_REFERENCE_AUDIO} reference audio clips, got {audio_count}"),
    }));
  }
  let total = image_count + video_count + audio_count;
  if total > MAX_REFERENCE_FILES {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "reference_images",
      value: format!("MiniMax H3 supports at most {MAX_REFERENCE_FILES} reference files overall, got {total}"),
    }));
  }
  if audio_count > 0 && image_count == 0 && video_count == 0 {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "reference_audio",
      value: "MiniMax H3 requires at least one reference image or video alongside reference audio".to_string(),
    }));
  }
  Ok(())
}

fn resolve_image_urls(
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

fn resolve_video_urls(
  reference_videos: Option<VideoListRef>,
) -> Result<Vec<String>, ArtcraftRouterError> {
  match reference_videos {
    None => Ok(vec![]),
    Some(VideoListRef::Urls(urls)) => Ok(urls),
    Some(VideoListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
  }
}

fn resolve_audio_urls(
  reference_audio: Option<AudioListRef>,
) -> Result<Vec<String>, ArtcraftRouterError> {
  match reference_audio {
    None => Ok(vec![]),
    Some(AudioListRef::Urls(urls)) => Ok(urls),
    Some(AudioListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
  }
}

fn non_empty(urls: Vec<String>) -> Option<Vec<String>> {
  if urls.is_empty() { None } else { Some(urls) }
}

// ── Plan helpers ──

/// `None` (including the `Auto*` ratios) leaves the field unset so fal's
/// per-mode default applies: 16:9 for text-to-video, adaptive for
/// reference-to-video.
fn plan_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<PlanAspectRatio>, ArtcraftRouterError> {
  use PlanAspectRatio as Ar;
  match aspect_ratio {
    None
    | Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto3k)
    | Some(RouterAspectRatio::Auto4k) => Ok(None),

    Some(RouterAspectRatio::WideTwentyOneByNine) => Ok(Some(Ar::TwentyOneByNine)),
    Some(RouterAspectRatio::WideSixteenByNine) | Some(RouterAspectRatio::Wide) => Ok(Some(Ar::SixteenByNine)),
    Some(RouterAspectRatio::TallNineBySixteen) | Some(RouterAspectRatio::Tall) => Ok(Some(Ar::NineBySixteen)),
    Some(RouterAspectRatio::WideFourByThree) => Ok(Some(Ar::FourByThree)),
    Some(RouterAspectRatio::TallThreeByFour) => Ok(Some(Ar::ThreeByFour)),
    Some(RouterAspectRatio::Square) | Some(RouterAspectRatio::SquareHd) => Ok(Some(Ar::Square)),

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

/// MiniMax H3 offers exactly two output sizes: 768P and 2K.
fn plan_resolution(
  resolution: Option<RouterResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<MinimaxH3Resolution>, ArtcraftRouterError> {
  match resolution {
    None => Ok(None),

    // 480p/720p round up to 768P, the smallest size H3 offers.
    Some(RouterResolution::FourEightyP)
    | Some(RouterResolution::SevenTwentyP) => Ok(Some(MinimaxH3Resolution::SevenSixtyEightP)),
    Some(RouterResolution::TenEightyP)
    | Some(RouterResolution::TwoK) => Ok(Some(MinimaxH3Resolution::TwoK)),

    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(MinimaxH3Resolution::TwoK)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(MinimaxH3Resolution::SevenSixtyEightP)),
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

fn to_t2v_aspect_ratio(a: PlanAspectRatio) -> MinimaxH3TextToVideoAspectRatio {
  match a {
    PlanAspectRatio::TwentyOneByNine => MinimaxH3TextToVideoAspectRatio::TwentyOneByNine,
    PlanAspectRatio::SixteenByNine => MinimaxH3TextToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::FourByThree => MinimaxH3TextToVideoAspectRatio::FourByThree,
    PlanAspectRatio::Square => MinimaxH3TextToVideoAspectRatio::Square,
    PlanAspectRatio::ThreeByFour => MinimaxH3TextToVideoAspectRatio::ThreeByFour,
    PlanAspectRatio::NineBySixteen => MinimaxH3TextToVideoAspectRatio::NineBySixteen,
  }
}

fn to_reference_aspect_ratio(a: PlanAspectRatio) -> MinimaxH3ReferenceToVideoAspectRatio {
  match a {
    PlanAspectRatio::TwentyOneByNine => MinimaxH3ReferenceToVideoAspectRatio::TwentyOneByNine,
    PlanAspectRatio::SixteenByNine => MinimaxH3ReferenceToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::FourByThree => MinimaxH3ReferenceToVideoAspectRatio::FourByThree,
    PlanAspectRatio::Square => MinimaxH3ReferenceToVideoAspectRatio::Square,
    PlanAspectRatio::ThreeByFour => MinimaxH3ReferenceToVideoAspectRatio::ThreeByFour,
    PlanAspectRatio::NineBySixteen => MinimaxH3ReferenceToVideoAspectRatio::NineBySixteen,
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
      let state = build_fal_minimax_h3_state(base_builder()).expect("build");
      assert!(matches!(state.mode, FalMinimaxH3Mode::TextToVideo(_)));
    }

    #[test]
    fn start_frame_picks_i2v() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url(START_URL.to_string()));
      let state = build_fal_minimax_h3_state(b).expect("build");
      assert!(matches!(state.mode, FalMinimaxH3Mode::ImageToVideo(_)));
    }

    #[test]
    fn start_and_end_frame_picks_i2v_with_end_image_url() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url(START_URL.to_string()));
      b.end_frame = Some(ImageRef::Url(END_URL.to_string()));
      let state = build_fal_minimax_h3_state(b).expect("build");
      let FalMinimaxH3Mode::ImageToVideo(req) = state.mode else {
        panic!("expected ImageToVideo");
      };
      assert_eq!(req.image_url, START_URL);
      assert_eq!(req.end_image_url.as_deref(), Some(END_URL));
    }

    #[test]
    fn end_frame_without_start_frame_errors() {
      let mut b = base_builder();
      b.end_frame = Some(ImageRef::Url(END_URL.to_string()));
      assert!(build_fal_minimax_h3_state(b).is_err());
    }

    #[test]
    fn reference_images_pick_reference_to_video() {
      let state = build_fal_minimax_h3_state(builder_with_reference_images(3)).expect("build");
      let FalMinimaxH3Mode::ReferenceToVideo(req) = state.mode else {
        panic!("expected ReferenceToVideo");
      };
      assert_eq!(req.reference_image_urls.map(|urls| urls.len()), Some(3));
      assert_eq!(req.reference_video_urls, None);
      assert_eq!(req.reference_audio_urls, None);
    }

    #[test]
    fn reference_videos_pick_reference_to_video() {
      let mut b = base_builder();
      b.reference_videos = Some(VideoListRef::Urls(vec!["https://example.com/a.mp4".to_string()]));
      let state = build_fal_minimax_h3_state(b).expect("build");
      let FalMinimaxH3Mode::ReferenceToVideo(req) = state.mode else {
        panic!("expected ReferenceToVideo");
      };
      assert_eq!(req.reference_video_urls.map(|urls| urls.len()), Some(1));
    }

    #[test]
    fn ten_reference_images_error() {
      assert!(build_fal_minimax_h3_state(builder_with_reference_images(10)).is_err());
    }

    #[test]
    fn four_reference_videos_error() {
      let mut b = base_builder();
      b.reference_videos = Some(VideoListRef::Urls(
        (0..4).map(|i| format!("https://example.com/v-{i}.mp4")).collect(),
      ));
      assert!(build_fal_minimax_h3_state(b).is_err());
    }

    #[test]
    fn thirteen_reference_files_error() {
      // 9 images + 3 videos + 1 audio = 13 > 12 total.
      let mut b = builder_with_reference_images(9);
      b.reference_videos = Some(VideoListRef::Urls(
        (0..3).map(|i| format!("https://example.com/v-{i}.mp4")).collect(),
      ));
      b.reference_audio = Some(AudioListRef::Urls(vec!["https://example.com/a.mp3".to_string()]));
      assert!(build_fal_minimax_h3_state(b).is_err());
    }

    #[test]
    fn audio_only_reference_errors() {
      let mut b = base_builder();
      b.reference_audio = Some(AudioListRef::Urls(vec!["https://example.com/a.mp3".to_string()]));
      assert!(build_fal_minimax_h3_state(b).is_err());
    }

    #[test]
    fn reference_images_with_start_frame_error() {
      let mut b = builder_with_reference_images(2);
      b.start_frame = Some(ImageRef::Url(START_URL.to_string()));
      assert!(build_fal_minimax_h3_state(b).is_err());
    }
  }

  mod plan_tests {
    use super::*;

    #[test]
    fn duration_20_errors_under_error_out() {
      let mut b = base_builder();
      b.duration_seconds = Some(20);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      assert!(build_fal_minimax_h3_state(b).is_err());
    }

    #[test]
    fn duration_20_clamps_to_15_under_pay_less() {
      let mut b = base_builder();
      b.duration_seconds = Some(20);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayLessDowngrade;
      let state = build_fal_minimax_h3_state(b).expect("build");
      let FalMinimaxH3Mode::TextToVideo(req) = state.mode else {
        panic!("expected TextToVideo");
      };
      assert_eq!(req.duration, Some(15));
    }

    #[test]
    fn duration_3_clamps_to_5_under_pay_less() {
      let mut b = base_builder();
      b.duration_seconds = Some(3);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayLessDowngrade;
      let state = build_fal_minimax_h3_state(b).expect("build");
      let FalMinimaxH3Mode::TextToVideo(req) = state.mode else {
        panic!("expected TextToVideo");
      };
      assert_eq!(req.duration, Some(5));
    }

    #[test]
    fn resolution_480p_and_720p_map_to_768p() {
      for res in [RouterResolution::FourEightyP, RouterResolution::SevenTwentyP] {
        let mut b = base_builder();
        b.resolution = Some(res);
        let state = build_fal_minimax_h3_state(b).expect("build");
        let FalMinimaxH3Mode::TextToVideo(req) = state.mode else {
          panic!("expected TextToVideo");
        };
        assert_eq!(req.resolution, Some(MinimaxH3Resolution::SevenSixtyEightP), "res={res:?}");
      }
    }

    #[test]
    fn resolution_1080p_and_2k_map_to_2k() {
      for res in [RouterResolution::TenEightyP, RouterResolution::TwoK] {
        let mut b = base_builder();
        b.resolution = Some(res);
        let state = build_fal_minimax_h3_state(b).expect("build");
        let FalMinimaxH3Mode::TextToVideo(req) = state.mode else {
          panic!("expected TextToVideo");
        };
        assert_eq!(req.resolution, Some(MinimaxH3Resolution::TwoK), "res={res:?}");
      }
    }

    #[test]
    fn resolution_4k_errors_under_error_out() {
      let mut b = base_builder();
      b.resolution = Some(RouterResolution::FourK);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      assert!(build_fal_minimax_h3_state(b).is_err());
    }

    #[test]
    fn twenty_one_by_nine_is_supported() {
      let mut b = base_builder();
      b.aspect_ratio = Some(RouterAspectRatio::WideTwentyOneByNine);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      let state = build_fal_minimax_h3_state(b).expect("build");
      let FalMinimaxH3Mode::TextToVideo(req) = state.mode else {
        panic!("expected TextToVideo");
      };
      assert_eq!(req.aspect_ratio, Some(MinimaxH3TextToVideoAspectRatio::TwentyOneByNine));
    }

    #[test]
    fn auto_aspect_ratio_is_left_unset() {
      let mut b = base_builder();
      b.aspect_ratio = Some(RouterAspectRatio::Auto);
      let state = build_fal_minimax_h3_state(b).expect("build");
      let FalMinimaxH3Mode::TextToVideo(req) = state.mode else {
        panic!("expected TextToVideo");
      };
      assert_eq!(req.aspect_ratio, None);
    }

    #[test]
    fn i2v_aspect_ratio_is_silently_dropped() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url(START_URL.to_string()));
      b.aspect_ratio = Some(RouterAspectRatio::TallNineBySixteen);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      // Image-to-video has no aspect_ratio field; the request still builds.
      let state = build_fal_minimax_h3_state(b).expect("build");
      assert!(matches!(state.mode, FalMinimaxH3Mode::ImageToVideo(_)));
    }
  }

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::MinimaxH3,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      ..Default::default()
    }
  }

  fn builder_with_reference_images(count: usize) -> GenerateVideoRequestBuilder {
    let urls = (0..count)
      .map(|i| format!("https://example.com/ref-{}.png", i))
      .collect();
    let mut b = base_builder();
    b.reference_images = Some(ImageListRef::Urls(urls));
    b
  }
}

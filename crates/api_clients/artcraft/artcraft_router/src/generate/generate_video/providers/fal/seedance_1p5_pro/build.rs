use fal_client::requests::webhook::video::image::enqueue_seedance_1p5_pro_image_to_video_webhook::{
  EnqueueSeedance1p5ProImageToVideoAspectRatio, EnqueueSeedance1p5ProImageToVideoDuration,
  EnqueueSeedance1p5ProImageToVideoRequest, EnqueueSeedance1p5ProImageToVideoResolution,
};
use fal_client::requests::webhook::video::text::enqueue_seedance_1p5_pro_text_to_video_webhook::{
  EnqueueSeedance1p5ProTextToVideoAspectRatio, EnqueueSeedance1p5ProTextToVideoDuration,
  EnqueueSeedance1p5ProTextToVideoRequest, EnqueueSeedance1p5ProTextToVideoResolution,
};

use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_resolution::RouterResolution;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::fal::seedance_1p5_pro::request::{
  FalSeedance1p5ProMode, FalSeedance1p5ProRequestState,
};
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

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
  aspect_ratio: Option<RouterAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<PlanAspectRatio>, ArtcraftRouterError> {
  use PlanAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(None),

    Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto4k) => Ok(Some(Ar::Auto)),

    Some(RouterAspectRatio::Square) | Some(RouterAspectRatio::SquareHd) => Ok(Some(Ar::Square)),
    Some(RouterAspectRatio::WideFourByThree) => Ok(Some(Ar::FourByThree)),
    Some(RouterAspectRatio::WideSixteenByNine) | Some(RouterAspectRatio::Wide) => Ok(Some(Ar::SixteenByNine)),
    Some(RouterAspectRatio::WideTwentyOneByNine) => Ok(Some(Ar::TwentyOneByNine)),
    Some(RouterAspectRatio::TallThreeByFour) => Ok(Some(Ar::ThreeByFour)),
    Some(RouterAspectRatio::TallNineBySixteen) | Some(RouterAspectRatio::Tall) => Ok(Some(Ar::NineBySixteen)),

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
fn nearest_aspect_ratio(aspect_ratio: RouterAspectRatio) -> PlanAspectRatio {
  use PlanAspectRatio as Ar;
  match aspect_ratio {
    RouterAspectRatio::WideFiveByFour => Ar::FourByThree,
    RouterAspectRatio::WideThreeByTwo => Ar::FourByThree,
    RouterAspectRatio::TallFourByFive => Ar::ThreeByFour,
    RouterAspectRatio::TallTwoByThree => Ar::ThreeByFour,
    RouterAspectRatio::TallNineByTwentyOne => Ar::NineBySixteen,
    _ => Ar::Square,
  }
}

fn plan_resolution(
  resolution: Option<RouterResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<PlanResolution>, ArtcraftRouterError> {
  use PlanResolution as R;
  match resolution {
    None => Ok(None),
    Some(RouterResolution::FourEightyP) => Ok(Some(R::FourEightyP)),
    Some(RouterResolution::SevenTwentyP) => Ok(Some(R::SevenTwentyP)),
    Some(RouterResolution::TenEightyP) => Ok(Some(R::TenEightyP)),
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

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

  use super::*;

  // ── Helpers ──

  fn base_t2v_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance1p5Pro,
      provider: RouterProvider::Fal,
      prompt: Some("a corgi running".to_string()),
      // No start_frame → text-to-video.
      ..Default::default()
    }
  }

  fn base_i2v_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance1p5Pro,
      provider: RouterProvider::Fal,
      prompt: Some("a corgi running".to_string()),
      start_frame: Some(ImageRef::Url("https://example.com/start.png".to_string())),
      ..Default::default()
    }
  }

  fn make_t2v(f: impl FnOnce(&mut GenerateVideoRequestBuilder)) -> GenerateVideoRequestBuilder {
    let mut b = base_t2v_builder();
    f(&mut b);
    b
  }

  fn make_i2v(f: impl FnOnce(&mut GenerateVideoRequestBuilder)) -> GenerateVideoRequestBuilder {
    let mut b = base_i2v_builder();
    f(&mut b);
    b
  }

  fn unwrap_t2v(result: Result<VideoGenerationDraftOrRequest, ArtcraftRouterError>) -> EnqueueSeedance1p5ProTextToVideoRequest {
    use crate::generate::generate_video::providers::fal::seedance_1p5_pro::request::FalSeedance1p5ProMode;
    match result.expect("build should succeed") {
      VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalSeedance1p5Pro(state)) => match state.mode {
        FalSeedance1p5ProMode::TextToVideo(req) => req,
        FalSeedance1p5ProMode::ImageToVideo(_) => panic!("expected TextToVideo mode"),
      },
      _ => panic!("expected FalSeedance1p5Pro request"),
    }
  }

  fn unwrap_i2v(result: Result<VideoGenerationDraftOrRequest, ArtcraftRouterError>) -> EnqueueSeedance1p5ProImageToVideoRequest {
    use crate::generate::generate_video::providers::fal::seedance_1p5_pro::request::FalSeedance1p5ProMode;
    match result.expect("build should succeed") {
      VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalSeedance1p5Pro(state)) => match state.mode {
        FalSeedance1p5ProMode::ImageToVideo(req) => req,
        FalSeedance1p5ProMode::TextToVideo(_) => panic!("expected ImageToVideo mode"),
      },
      _ => panic!("expected FalSeedance1p5Pro request"),
    }
  }

  // ── Mode selection (t2v vs i2v) ──

  mod mode_selection {
    use super::*;

    #[test]
    fn no_start_frame_picks_t2v() {
      let _ = unwrap_t2v(build_fal_seedance_1p5_pro(base_t2v_builder()));
    }

    #[test]
    fn start_frame_picks_i2v() {
      let _ = unwrap_i2v(build_fal_seedance_1p5_pro(base_i2v_builder()));
    }

    #[test]
    fn end_frame_alone_without_start_frame_errors() {
      let result = build_fal_seedance_1p5_pro(make_t2v(|b| {
        b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
      }));
      assert!(result.is_err());
    }

    #[test]
    fn i2v_with_end_frame_succeeds() {
      let req = unwrap_i2v(build_fal_seedance_1p5_pro(make_i2v(|b| {
        b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
      })));
      assert_eq!(req.end_image_url.as_deref(), Some("https://example.com/end.png"));
    }

    #[test]
    fn media_file_token_for_start_frame_errors() {
      let result = build_fal_seedance_1p5_pro(make_t2v(|b| {
        b.start_frame = Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_x".to_string())));
      }));
      assert!(result.is_err());
    }

    #[test]
    fn media_file_token_for_end_frame_errors() {
      let result = build_fal_seedance_1p5_pro(make_i2v(|b| {
        b.end_frame = Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_x".to_string())));
      }));
      assert!(result.is_err());
    }
  }

  // ── Materialized field conversions ──

  mod materialized_field_conversions {
    use super::*;

    #[test]
    fn t2v_prompt_passed_through() {
      let req = unwrap_t2v(build_fal_seedance_1p5_pro(make_t2v(|b| {
        b.prompt = Some("hello world".to_string());
      })));
      assert_eq!(req.prompt, "hello world");
    }

    #[test]
    fn i2v_prompt_passed_through() {
      let req = unwrap_i2v(build_fal_seedance_1p5_pro(make_i2v(|b| {
        b.prompt = Some("hello world".to_string());
      })));
      assert_eq!(req.prompt, "hello world");
    }

    #[test]
    fn t2v_prompt_defaults_to_empty() {
      let req = unwrap_t2v(build_fal_seedance_1p5_pro(make_t2v(|b| { b.prompt = None; })));
      assert_eq!(req.prompt, "");
    }

    #[test]
    fn i2v_image_url_passed_through() {
      let req = unwrap_i2v(build_fal_seedance_1p5_pro(make_i2v(|b| {
        b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
      })));
      assert_eq!(req.image_url, "https://example.com/a.png");
    }

    #[test]
    fn i2v_end_image_absent_is_none() {
      let req = unwrap_i2v(build_fal_seedance_1p5_pro(base_i2v_builder()));
      assert!(req.end_image_url.is_none());
    }

    #[test]
    fn t2v_generate_audio_passed_through() {
      let req = unwrap_t2v(build_fal_seedance_1p5_pro(make_t2v(|b| {
        b.generate_audio = Some(true);
      })));
      assert_eq!(req.generate_audio, Some(true));
    }

    #[test]
    fn t2v_generate_audio_none_passed_through() {
      let req = unwrap_t2v(build_fal_seedance_1p5_pro(make_t2v(|b| {
        b.generate_audio = None;
      })));
      assert!(req.generate_audio.is_none());
    }

    #[test]
    fn i2v_generate_audio_false_passed_through() {
      let req = unwrap_i2v(build_fal_seedance_1p5_pro(make_i2v(|b| {
        b.generate_audio = Some(false);
      })));
      assert_eq!(req.generate_audio, Some(false));
    }
  }

  // ── Resolution conversions ──

  mod resolution_conversions {
    use super::*;

    #[test]
    fn t2v_resolution_480p() {
      let req = unwrap_t2v(build_fal_seedance_1p5_pro(make_t2v(|b| {
        b.resolution = Some(RouterResolution::FourEightyP);
      })));
      assert!(matches!(req.resolution, Some(EnqueueSeedance1p5ProTextToVideoResolution::FourEightyP)));
    }

    #[test]
    fn t2v_resolution_720p() {
      let req = unwrap_t2v(build_fal_seedance_1p5_pro(make_t2v(|b| {
        b.resolution = Some(RouterResolution::SevenTwentyP);
      })));
      assert!(matches!(req.resolution, Some(EnqueueSeedance1p5ProTextToVideoResolution::SevenTwentyP)));
    }

    #[test]
    fn t2v_resolution_1080p() {
      let req = unwrap_t2v(build_fal_seedance_1p5_pro(make_t2v(|b| {
        b.resolution = Some(RouterResolution::TenEightyP);
      })));
      assert!(matches!(req.resolution, Some(EnqueueSeedance1p5ProTextToVideoResolution::TenEightyP)));
    }

    #[test]
    fn t2v_resolution_none_stays_none() {
      let req = unwrap_t2v(build_fal_seedance_1p5_pro(make_t2v(|b| { b.resolution = None; })));
      assert!(req.resolution.is_none());
    }

    #[test]
    fn unsupported_resolution_errors_with_error_out() {
      let result = build_fal_seedance_1p5_pro(make_t2v(|b| {
        b.resolution = Some(RouterResolution::FourK);
        b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      }));
      assert!(result.is_err());
    }

    #[test]
    fn unsupported_resolution_upgrades_with_pay_more() {
      let req = unwrap_t2v(build_fal_seedance_1p5_pro(make_t2v(|b| {
        b.resolution = Some(RouterResolution::FourK);
        b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayMoreUpgrade;
      })));
      assert!(matches!(req.resolution, Some(EnqueueSeedance1p5ProTextToVideoResolution::TenEightyP)));
    }

    #[test]
    fn unsupported_resolution_downgrades_with_pay_less() {
      let req = unwrap_t2v(build_fal_seedance_1p5_pro(make_t2v(|b| {
        b.resolution = Some(RouterResolution::FourK);
        b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayLessDowngrade;
      })));
      assert!(matches!(req.resolution, Some(EnqueueSeedance1p5ProTextToVideoResolution::FourEightyP)));
    }
  }

  // ── Duration conversions (4 through 12 seconds supported) ──

  mod duration_conversions {
    use super::*;

    #[test]
    fn duration_4s() {
      let req = unwrap_t2v(build_fal_seedance_1p5_pro(make_t2v(|b| { b.duration_seconds = Some(4); })));
      assert!(matches!(req.duration, Some(EnqueueSeedance1p5ProTextToVideoDuration::FourSeconds)));
    }

    #[test]
    fn duration_12s() {
      let req = unwrap_t2v(build_fal_seedance_1p5_pro(make_t2v(|b| { b.duration_seconds = Some(12); })));
      assert!(matches!(req.duration, Some(EnqueueSeedance1p5ProTextToVideoDuration::TwelveSeconds)));
    }

    #[test]
    fn duration_none_stays_none() {
      let req = unwrap_t2v(build_fal_seedance_1p5_pro(make_t2v(|b| { b.duration_seconds = None; })));
      assert!(req.duration.is_none());
    }

    #[test]
    fn unsupported_duration_errors_with_error_out() {
      let result = build_fal_seedance_1p5_pro(make_t2v(|b| {
        b.duration_seconds = Some(13);
        b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      }));
      assert!(result.is_err());
    }

    #[test]
    fn unsupported_duration_upgrades_to_max_with_pay_more() {
      let req = unwrap_t2v(build_fal_seedance_1p5_pro(make_t2v(|b| {
        b.duration_seconds = Some(20);
        b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayMoreUpgrade;
      })));
      assert!(matches!(req.duration, Some(EnqueueSeedance1p5ProTextToVideoDuration::TwelveSeconds)));
    }

    #[test]
    fn unsupported_duration_downgrades_to_min_with_pay_less() {
      let req = unwrap_t2v(build_fal_seedance_1p5_pro(make_t2v(|b| {
        b.duration_seconds = Some(2);
        b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayLessDowngrade;
      })));
      assert!(matches!(req.duration, Some(EnqueueSeedance1p5ProTextToVideoDuration::FourSeconds)));
    }
  }

  // ── Aspect ratio conversions ──

  mod aspect_ratio_conversions {
    use super::*;

    #[test]
    fn auto() {
      let req = unwrap_t2v(build_fal_seedance_1p5_pro(make_t2v(|b| {
        b.aspect_ratio = Some(RouterAspectRatio::Auto);
      })));
      assert!(matches!(req.aspect_ratio, Some(EnqueueSeedance1p5ProTextToVideoAspectRatio::Auto)));
    }

    #[test]
    fn sixteen_by_nine() {
      let req = unwrap_t2v(build_fal_seedance_1p5_pro(make_t2v(|b| {
        b.aspect_ratio = Some(RouterAspectRatio::WideSixteenByNine);
      })));
      assert!(matches!(req.aspect_ratio, Some(EnqueueSeedance1p5ProTextToVideoAspectRatio::SixteenByNine)));
    }

    #[test]
    fn square() {
      let req = unwrap_t2v(build_fal_seedance_1p5_pro(make_t2v(|b| {
        b.aspect_ratio = Some(RouterAspectRatio::Square);
      })));
      assert!(matches!(req.aspect_ratio, Some(EnqueueSeedance1p5ProTextToVideoAspectRatio::Square)));
    }

    #[test]
    fn unsupported_aspect_ratio_falls_back_to_nearest_with_pay_more() {
      // WideFiveByFour → nearest wide → FourByThree (per nearest_aspect_ratio).
      let req = unwrap_t2v(build_fal_seedance_1p5_pro(make_t2v(|b| {
        b.aspect_ratio = Some(RouterAspectRatio::WideFiveByFour);
        b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayMoreUpgrade;
      })));
      assert!(matches!(req.aspect_ratio, Some(EnqueueSeedance1p5ProTextToVideoAspectRatio::FourByThree)));
    }

    #[test]
    fn unsupported_aspect_ratio_errors_with_error_out() {
      let result = build_fal_seedance_1p5_pro(make_t2v(|b| {
        b.aspect_ratio = Some(RouterAspectRatio::WideFiveByFour);
        b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      }));
      assert!(result.is_err());
    }
  }

  // ── Full combinatorial pass (t2v + i2v) ──

  #[test]
  fn t2v_combinatorial_pass() {
    let resolutions = [
      None,
      Some(RouterResolution::FourEightyP),
      Some(RouterResolution::SevenTwentyP),
      Some(RouterResolution::TenEightyP),
    ];
    let durations = [None, Some(4u16), Some(8u16), Some(12u16)];
    let aspect_ratios = [
      None,
      Some(RouterAspectRatio::Auto),
      Some(RouterAspectRatio::Square),
      Some(RouterAspectRatio::WideSixteenByNine),
      Some(RouterAspectRatio::TallNineBySixteen),
    ];
    let audios = [None, Some(true), Some(false)];

    let mut combos = 0;
    for &res in &resolutions {
      for &dur in &durations {
        for &ar in &aspect_ratios {
          for &audio in &audios {
            let mut b = base_t2v_builder();
            b.resolution = res;
            b.duration_seconds = dur;
            b.aspect_ratio = ar;
            b.generate_audio = audio;
            assert!(build_fal_seedance_1p5_pro(b).is_ok());
            combos += 1;
          }
        }
      }
    }
    assert_eq!(combos, 4 * 4 * 5 * 3);
  }

  #[test]
  fn i2v_combinatorial_pass() {
    let resolutions = [
      None,
      Some(RouterResolution::SevenTwentyP),
      Some(RouterResolution::TenEightyP),
    ];
    let durations = [None, Some(5u16), Some(12u16)];
    let aspect_ratios = [None, Some(RouterAspectRatio::WideSixteenByNine), Some(RouterAspectRatio::Square)];
    let audios = [None, Some(true), Some(false)];

    let mut combos = 0;
    for &res in &resolutions {
      for &dur in &durations {
        for &ar in &aspect_ratios {
          for &audio in &audios {
            for has_end in [false, true] {
              let mut b = base_i2v_builder();
              b.resolution = res;
              b.duration_seconds = dur;
              b.aspect_ratio = ar;
              b.generate_audio = audio;
              if has_end {
                b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
              }
              assert!(build_fal_seedance_1p5_pro(b).is_ok());
              combos += 1;
            }
          }
        }
      }
    }
    assert_eq!(combos, 3 * 3 * 3 * 3 * 2);
  }
}

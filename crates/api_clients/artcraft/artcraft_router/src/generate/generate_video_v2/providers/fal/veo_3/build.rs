use fal_client::requests::webhook::video::image::enqueue_veo_3_image_to_video_webhook::{
  Veo3I2vAspectRatio, Veo3I2vDuration, Veo3I2vResolution, Veo3Request,
};
use fal_client::requests::webhook::video::text::enqueue_veo_3_text_to_video_webhook::{
  Veo3T2vAspectRatio, Veo3T2vDuration, Veo3T2vResolution, Veo3TextToVideoRequest,
};

use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_resolution::RouterResolution;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::fal::veo_3::request::{FalVeo3Mode, FalVeo3RequestState};
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

/// Router-level resolution shared between both modes — kept here so the cost
/// calculator can reconstruct it from either mode's request.
#[derive(Debug, Clone, Copy)]
pub(crate) enum PlanResolution {
  Default,
  SevenTwentyP,
  TenEightyP,
}

#[derive(Debug, Clone, Copy)]
pub(crate) enum PlanDuration {
  Default,
  FourSeconds,
  SixSeconds,
  EightSeconds,
}

pub fn build_fal_veo_3(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  if builder.end_frame.is_some() {
    return Err(unsupported("end_frame", "Veo 3 does not support an ending frame"));
  }

  let prompt = builder.prompt.clone().unwrap_or_default();
  let negative_prompt = builder.negative_prompt.clone();
  let resolution = plan_resolution(builder.resolution, strategy)?;
  let duration = plan_duration(builder.duration_seconds, strategy)?;
  let generate_audio = builder.generate_audio.unwrap_or(true);

  let mode = match builder.start_frame.clone() {
    Some(ImageRef::Url(url)) => {
      let i2v_aspect_ratio = plan_i2v_aspect_ratio(builder.aspect_ratio, strategy)?;
      FalVeo3Mode::ImageToVideo(Veo3Request {
        image_url: url,
        prompt,
        duration: to_i2v_duration(duration),
        aspect_ratio: i2v_aspect_ratio,
        resolution: to_i2v_resolution(resolution),
        generate_audio,
      })
    }
    Some(ImageRef::MediaFileToken(_)) => {
      return Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls));
    }
    None => {
      let t2v_aspect_ratio = plan_t2v_aspect_ratio(builder.aspect_ratio, strategy)?;
      FalVeo3Mode::TextToVideo(Veo3TextToVideoRequest {
        prompt,
        negative_prompt,
        duration: to_t2v_duration(duration),
        aspect_ratio: t2v_aspect_ratio,
        resolution: to_t2v_resolution(resolution),
        generate_audio,
      })
    }
  };

  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalVeo3(
    FalVeo3RequestState { mode },
  )))
}

/// Text-to-video: only 16:9 and 9:16 (no Auto, no Square).
fn plan_t2v_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Veo3T2vAspectRatio, ArtcraftRouterError> {
  use Veo3T2vAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(Ar::Default),
    Some(RouterAspectRatio::WideSixteenByNine) | Some(RouterAspectRatio::Wide) => Ok(Ar::WideSixteenNine),
    Some(RouterAspectRatio::TallNineBySixteen) | Some(RouterAspectRatio::Tall) => Ok(Ar::TallNineSixteen),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("aspect_ratio", &format!("{:?}", other)))
      }
      _ => Ok(Ar::Default),
    },
  }
}

/// Image-to-video: Auto, 16:9, 9:16 (no Square).
fn plan_i2v_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Veo3I2vAspectRatio, ArtcraftRouterError> {
  use Veo3I2vAspectRatio as Ar;
  match aspect_ratio {
    None
    | Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto3k)
    | Some(RouterAspectRatio::Auto4k) => Ok(Ar::Auto),

    Some(RouterAspectRatio::WideSixteenByNine) | Some(RouterAspectRatio::Wide) => Ok(Ar::WideSixteenNine),
    Some(RouterAspectRatio::TallNineBySixteen) | Some(RouterAspectRatio::Tall) => Ok(Ar::TallNineSixteen),

    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("aspect_ratio", &format!("{:?}", other)))
      }
      _ => Ok(Ar::Auto),
    },
  }
}

fn plan_resolution(
  resolution: Option<RouterResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<PlanResolution, ArtcraftRouterError> {
  match resolution {
    None => Ok(PlanResolution::Default),
    Some(RouterResolution::SevenTwentyP) => Ok(PlanResolution::SevenTwentyP),
    Some(RouterResolution::TenEightyP) => Ok(PlanResolution::TenEightyP),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("resolution", &format!("{:?}", other)))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(PlanResolution::TenEightyP),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(PlanResolution::SevenTwentyP),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<PlanDuration, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(PlanDuration::Default),
    Some(4) => Ok(PlanDuration::FourSeconds),
    Some(6) => Ok(PlanDuration::SixSeconds),
    Some(8) => Ok(PlanDuration::EightSeconds),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("duration_seconds", &format!("{}", other)))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(PlanDuration::EightSeconds),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(PlanDuration::FourSeconds),
    },
  }
}

fn unsupported(field: &'static str, value: &str) -> ArtcraftRouterError {
  ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
    field,
    value: value.to_string(),
  })
}

fn to_t2v_duration(d: PlanDuration) -> Veo3T2vDuration {
  match d {
    PlanDuration::Default => Veo3T2vDuration::Default,
    PlanDuration::FourSeconds => Veo3T2vDuration::FourSeconds,
    PlanDuration::SixSeconds => Veo3T2vDuration::SixSeconds,
    PlanDuration::EightSeconds => Veo3T2vDuration::EightSeconds,
  }
}

fn to_i2v_duration(d: PlanDuration) -> Veo3I2vDuration {
  match d {
    PlanDuration::Default => Veo3I2vDuration::Default,
    PlanDuration::FourSeconds => Veo3I2vDuration::FourSeconds,
    PlanDuration::SixSeconds => Veo3I2vDuration::SixSeconds,
    PlanDuration::EightSeconds => Veo3I2vDuration::EightSeconds,
  }
}

fn to_t2v_resolution(r: PlanResolution) -> Veo3T2vResolution {
  match r {
    PlanResolution::Default => Veo3T2vResolution::Default,
    PlanResolution::SevenTwentyP => Veo3T2vResolution::SevenTwentyP,
    PlanResolution::TenEightyP => Veo3T2vResolution::TenEightyP,
  }
}

fn to_i2v_resolution(r: PlanResolution) -> Veo3I2vResolution {
  match r {
    PlanResolution::Default => Veo3I2vResolution::Default,
    PlanResolution::SevenTwentyP => Veo3I2vResolution::SevenTwentyP,
    PlanResolution::TenEightyP => Veo3I2vResolution::TenEightyP,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

  use super::*;

  fn base_t2v_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Veo3,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      ..Default::default()
    }
  }

  fn base_i2v_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      start_frame: Some(ImageRef::Url("https://example.com/a.png".to_string())),
      ..base_t2v_builder()
    }
  }

  fn t2v_request(b: GenerateVideoRequestBuilder) -> Veo3TextToVideoRequest {
    match build_fal_veo_3(b).expect("build") {
      VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalVeo3(state)) => match state.mode {
        FalVeo3Mode::TextToVideo(r) => r,
        FalVeo3Mode::ImageToVideo(_) => panic!("expected TextToVideo"),
      },
      _ => panic!("expected FalVeo3"),
    }
  }

  fn i2v_request(b: GenerateVideoRequestBuilder) -> Veo3Request {
    match build_fal_veo_3(b).expect("build") {
      VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalVeo3(state)) => match state.mode {
        FalVeo3Mode::ImageToVideo(r) => r,
        FalVeo3Mode::TextToVideo(_) => panic!("expected ImageToVideo"),
      },
      _ => panic!("expected FalVeo3"),
    }
  }

  use crate::generate::generate_video_v2::providers::fal::veo_3::request::{FalVeo3Mode, FalVeo3RequestState};

  mod mode_selection {
    use super::*;

    #[test]
    fn no_start_frame_picks_t2v() { let _ = t2v_request(base_t2v_builder()); }

    #[test]
    fn start_frame_picks_i2v() { let _ = i2v_request(base_i2v_builder()); }

    #[test]
    fn end_frame_errors() {
      let mut b = base_t2v_builder();
      b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
      assert!(build_fal_veo_3(b).is_err());
    }
  }

  mod resolution_conversions {
    use super::*;

    #[test]
    fn t2v_720p() {
      let mut b = base_t2v_builder();
      b.resolution = Some(RouterResolution::SevenTwentyP);
      assert!(matches!(t2v_request(b).resolution, Veo3T2vResolution::SevenTwentyP));
    }

    #[test]
    fn t2v_1080p() {
      let mut b = base_t2v_builder();
      b.resolution = Some(RouterResolution::TenEightyP);
      assert!(matches!(t2v_request(b).resolution, Veo3T2vResolution::TenEightyP));
    }

    #[test]
    fn t2v_unsupported_upgrades_with_pay_more() {
      let mut b = base_t2v_builder();
      b.resolution = Some(RouterResolution::FourK);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayMoreUpgrade;
      assert!(matches!(t2v_request(b).resolution, Veo3T2vResolution::TenEightyP));
    }
  }

  mod duration_conversions {
    use super::*;

    #[test]
    fn t2v_4s_6s_8s() {
      for (s, expected) in [
        (4, Veo3T2vDuration::FourSeconds),
        (6, Veo3T2vDuration::SixSeconds),
        (8, Veo3T2vDuration::EightSeconds),
      ] {
        let mut b = base_t2v_builder();
        b.duration_seconds = Some(s);
        assert_eq!(format!("{:?}", t2v_request(b).duration), format!("{:?}", expected));
      }
    }
  }

  mod aspect_ratio_conversions {
    use super::*;

    #[test]
    fn t2v_sixteen_nine() {
      let mut b = base_t2v_builder();
      b.aspect_ratio = Some(RouterAspectRatio::WideSixteenByNine);
      assert!(matches!(t2v_request(b).aspect_ratio, Veo3T2vAspectRatio::WideSixteenNine));
    }

    #[test]
    fn i2v_auto_when_unspecified() {
      assert!(matches!(i2v_request(base_i2v_builder()).aspect_ratio, Veo3I2vAspectRatio::Auto));
    }
  }

  mod audio_handling {
    use super::*;

    #[test]
    fn audio_defaults_to_true() {
      assert!(t2v_request(base_t2v_builder()).generate_audio);
    }

    #[test]
    fn audio_false_is_passed_through() {
      let mut b = base_t2v_builder();
      b.generate_audio = Some(false);
      assert!(!t2v_request(b).generate_audio);
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
            for has_start_frame in [false, true] {
              let mut b = if has_start_frame { base_i2v_builder() } else { base_t2v_builder() };
              b.resolution = resolution;
              b.duration_seconds = duration;
              b.aspect_ratio = aspect_ratio;
              b.generate_audio = generate_audio;
              assert!(build_fal_veo_3(b).is_ok());
              combos += 1;
            }
          }
        }
      }
    }
    assert_eq!(combos, 3 * 4 * 4 * 3 * 2);
  }

  // Silence unused warnings for FalVeo3RequestState in this scope.
  #[allow(dead_code)]
  fn _silence(_: FalVeo3RequestState) {}
}

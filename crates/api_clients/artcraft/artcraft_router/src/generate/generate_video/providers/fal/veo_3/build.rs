use fal_client::requests::api::video::image::veo_3::api::{
  Veo3ImageToVideoAspectRatio, Veo3ImageToVideoDuration, Veo3ImageToVideoRequest,
  Veo3ImageToVideoResolution,
};
use fal_client::requests::api::video::text::veo_3::api::{
  Veo3TextToVideoAspectRatio, Veo3TextToVideoDuration, Veo3TextToVideoRequest,
  Veo3TextToVideoResolution,
};

use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_resolution::RouterResolution;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::fal::veo_3::request::{FalVeo3Mode, FalVeo3RequestState};
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

/// Router-level resolution shared between both modes — each mode maps it onto
/// its own fal resolution enum.
#[derive(Debug, Clone, Copy)]
pub(crate) enum PlanResolution {
  SevenTwentyP,
  TenEightyP,
}

#[derive(Debug, Clone, Copy)]
pub(crate) enum PlanDuration {
  FourSeconds,
  SixSeconds,
  EightSeconds,
}

pub fn build_fal_veo_3(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_veo_3_state(builder)?;
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalVeo3(state)))
}

pub(crate) fn build_fal_veo_3_state(
  builder: GenerateVideoRequestBuilder,
) -> Result<FalVeo3RequestState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  if builder.end_frame.is_some() {
    return Err(unsupported("end_frame", "Veo 3 does not support an ending frame"));
  }

  let prompt = builder.prompt.clone().unwrap_or_default();
  let negative_prompt = builder.negative_prompt.clone();
  let resolution = plan_resolution(builder.resolution, strategy)?;
  let duration = plan_duration(builder.duration_seconds, strategy)?;
  // fal's server default is audio-on; keep the explicit `true` the old
  // endpoint sent so pricing stays deterministic.
  let generate_audio = Some(builder.generate_audio.unwrap_or(true));

  let mode = match builder.start_frame.clone() {
    Some(ImageRef::Url(url)) => {
      let i2v_aspect_ratio = plan_i2v_aspect_ratio(builder.aspect_ratio, strategy)?;
      FalVeo3Mode::ImageToVideo(Veo3ImageToVideoRequest {
        prompt,
        image_url: url,
        aspect_ratio: i2v_aspect_ratio,
        duration: duration.map(to_i2v_duration),
        resolution: resolution.map(to_i2v_resolution),
        generate_audio,
        negative_prompt,
        seed: None,
        auto_fix: None,
        safety_tolerance: None,
      })
    }
    Some(ImageRef::MediaFileToken(_)) => {
      return Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls));
    }
    None => {
      let t2v_aspect_ratio = plan_t2v_aspect_ratio(builder.aspect_ratio, strategy)?;
      FalVeo3Mode::TextToVideo(Veo3TextToVideoRequest {
        prompt,
        aspect_ratio: t2v_aspect_ratio,
        duration: duration.map(to_t2v_duration),
        resolution: resolution.map(to_t2v_resolution),
        negative_prompt,
        generate_audio,
        seed: None,
        auto_fix: None,
        safety_tolerance: None,
      })
    }
  };

  Ok(FalVeo3RequestState { mode })
}

/// Text-to-video: only 16:9 and 9:16 (no Auto, no Square). `None` lets fal
/// pick its default (16:9).
fn plan_t2v_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Veo3TextToVideoAspectRatio>, ArtcraftRouterError> {
  use Veo3TextToVideoAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(None),
    Some(RouterAspectRatio::WideSixteenByNine) | Some(RouterAspectRatio::Wide) => Ok(Some(Ar::SixteenByNine)),
    Some(RouterAspectRatio::TallNineBySixteen) | Some(RouterAspectRatio::Tall) => Ok(Some(Ar::NineBySixteen)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("aspect_ratio", &format!("{:?}", other)))
      }
      _ => Ok(None),
    },
  }
}

/// Image-to-video: Auto, 16:9, 9:16 (no Square).
fn plan_i2v_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Veo3ImageToVideoAspectRatio>, ArtcraftRouterError> {
  use Veo3ImageToVideoAspectRatio as Ar;
  match aspect_ratio {
    None
    | Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto3k)
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
  match resolution {
    None => Ok(None),
    Some(RouterResolution::SevenTwentyP) => Ok(Some(PlanResolution::SevenTwentyP)),
    Some(RouterResolution::TenEightyP) => Ok(Some(PlanResolution::TenEightyP)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("resolution", &format!("{:?}", other)))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(PlanResolution::TenEightyP)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(PlanResolution::SevenTwentyP)),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<PlanDuration>, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(None),
    Some(4) => Ok(Some(PlanDuration::FourSeconds)),
    Some(6) => Ok(Some(PlanDuration::SixSeconds)),
    Some(8) => Ok(Some(PlanDuration::EightSeconds)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("duration_seconds", &format!("{}", other)))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(PlanDuration::EightSeconds)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(PlanDuration::FourSeconds)),
    },
  }
}

fn unsupported(field: &'static str, value: &str) -> ArtcraftRouterError {
  ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
    field,
    value: value.to_string(),
  })
}

fn to_t2v_duration(d: PlanDuration) -> Veo3TextToVideoDuration {
  match d {
    PlanDuration::FourSeconds => Veo3TextToVideoDuration::FourSeconds,
    PlanDuration::SixSeconds => Veo3TextToVideoDuration::SixSeconds,
    PlanDuration::EightSeconds => Veo3TextToVideoDuration::EightSeconds,
  }
}

fn to_i2v_duration(d: PlanDuration) -> Veo3ImageToVideoDuration {
  match d {
    PlanDuration::FourSeconds => Veo3ImageToVideoDuration::FourSeconds,
    PlanDuration::SixSeconds => Veo3ImageToVideoDuration::SixSeconds,
    PlanDuration::EightSeconds => Veo3ImageToVideoDuration::EightSeconds,
  }
}

fn to_t2v_resolution(r: PlanResolution) -> Veo3TextToVideoResolution {
  match r {
    PlanResolution::SevenTwentyP => Veo3TextToVideoResolution::SevenTwentyP,
    PlanResolution::TenEightyP => Veo3TextToVideoResolution::TenEightyP,
  }
}

fn to_i2v_resolution(r: PlanResolution) -> Veo3ImageToVideoResolution {
  match r {
    PlanResolution::SevenTwentyP => Veo3ImageToVideoResolution::SevenTwentyP,
    PlanResolution::TenEightyP => Veo3ImageToVideoResolution::TenEightyP,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;

  use super::*;

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
      assert!(build_fal_veo_3_state(b).is_err());
    }
  }

  mod resolution_conversions {
    use super::*;

    #[test]
    fn t2v_720p() {
      let mut b = base_t2v_builder();
      b.resolution = Some(RouterResolution::SevenTwentyP);
      assert_eq!(t2v_request(b).resolution, Some(Veo3TextToVideoResolution::SevenTwentyP));
    }

    #[test]
    fn t2v_1080p() {
      let mut b = base_t2v_builder();
      b.resolution = Some(RouterResolution::TenEightyP);
      assert_eq!(t2v_request(b).resolution, Some(Veo3TextToVideoResolution::TenEightyP));
    }

    #[test]
    fn t2v_unsupported_upgrades_with_pay_more() {
      let mut b = base_t2v_builder();
      b.resolution = Some(RouterResolution::FourK);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayMoreUpgrade;
      assert_eq!(t2v_request(b).resolution, Some(Veo3TextToVideoResolution::TenEightyP));
    }
  }

  mod duration_conversions {
    use super::*;

    #[test]
    fn t2v_4s_6s_8s() {
      for (s, expected) in [
        (4, Veo3TextToVideoDuration::FourSeconds),
        (6, Veo3TextToVideoDuration::SixSeconds),
        (8, Veo3TextToVideoDuration::EightSeconds),
      ] {
        let mut b = base_t2v_builder();
        b.duration_seconds = Some(s);
        assert_eq!(t2v_request(b).duration, Some(expected));
      }
    }
  }

  mod aspect_ratio_conversions {
    use super::*;

    #[test]
    fn t2v_sixteen_nine() {
      let mut b = base_t2v_builder();
      b.aspect_ratio = Some(RouterAspectRatio::WideSixteenByNine);
      assert_eq!(t2v_request(b).aspect_ratio, Some(Veo3TextToVideoAspectRatio::SixteenByNine));
    }

    #[test]
    fn i2v_auto_when_unspecified() {
      assert_eq!(i2v_request(base_i2v_builder()).aspect_ratio, Some(Veo3ImageToVideoAspectRatio::Auto));
    }
  }

  mod audio_handling {
    use super::*;

    #[test]
    fn audio_defaults_to_true() {
      assert_eq!(t2v_request(base_t2v_builder()).generate_audio, Some(true));
    }

    #[test]
    fn audio_false_is_passed_through() {
      let mut b = base_t2v_builder();
      b.generate_audio = Some(false);
      assert_eq!(t2v_request(b).generate_audio, Some(false));
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
              assert!(build_fal_veo_3_state(b).is_ok());
              combos += 1;
            }
          }
        }
      }
    }
    assert_eq!(combos, 3 * 4 * 4 * 3 * 2);
  }

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
    match build_fal_veo_3_state(b).expect("build_fal_veo_3_state").mode {
      FalVeo3Mode::TextToVideo(r) => r,
      FalVeo3Mode::ImageToVideo(_) => panic!("expected TextToVideo"),
    }
  }

  fn i2v_request(b: GenerateVideoRequestBuilder) -> Veo3ImageToVideoRequest {
    match build_fal_veo_3_state(b).expect("build_fal_veo_3_state").mode {
      FalVeo3Mode::ImageToVideo(r) => r,
      FalVeo3Mode::TextToVideo(_) => panic!("expected ImageToVideo"),
    }
  }
}

use fal_client::requests::webhook::video::image::enqueue_veo_3p1_fast_first_last_frame_image_to_video_webhook::{
  EnqueueVeo3p1FastFirstLastFrameImageToVideoAspectRatio, EnqueueVeo3p1FastFirstLastFrameImageToVideoDurationSeconds,
  EnqueueVeo3p1FastFirstLastFrameImageToVideoRequest, EnqueueVeo3p1FastFirstLastFrameImageToVideoResolution,
};
use fal_client::requests::webhook::video::image::enqueue_veo_3p1_fast_image_to_video_webhook::{
  EnqueueVeo3p1FastImageToVideoAspectRatio, EnqueueVeo3p1FastImageToVideoDurationSeconds,
  EnqueueVeo3p1FastImageToVideoRequest, EnqueueVeo3p1FastImageToVideoResolution,
};
use fal_client::requests::webhook::video::text::enqueue_veo_3p1_fast_text_to_video_webhook::{
  EnqueueVeo3p1FastTextToVideoAspectRatio, EnqueueVeo3p1FastTextToVideoDurationSeconds,
  EnqueueVeo3p1FastTextToVideoRequest, EnqueueVeo3p1FastTextToVideoResolution,
};

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::fal::veo_3p1_fast::request::{
  FalVeo3p1FastMode, FalVeo3p1FastRequestState,
};
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

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

pub fn build_fal_veo_3p1_fast(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let start = optional_url(builder.start_frame.clone())?;
  let end = optional_url(builder.end_frame.clone())?;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
  let resolution = plan_resolution(builder.resolution, strategy)?;
  let duration = plan_duration(builder.duration_seconds, strategy)?;
  let prompt = builder.prompt.clone().unwrap_or_default();
  let negative_prompt = builder.negative_prompt.clone();
  let generate_audio = builder.generate_audio;

  let mode = match (start, end) {
    (None, None) => FalVeo3p1FastMode::TextToVideo(EnqueueVeo3p1FastTextToVideoRequest {
      prompt,
      duration: duration.map(to_t2v_duration),
      aspect_ratio: aspect_ratio.map(to_t2v_aspect_ratio),
      resolution: resolution.map(to_t2v_resolution),
      generate_audio,
      enhance_prompt: None,
      negative_prompt,
      seed: None,
      auto_fix: None,
    }),
    (Some(image_url), None) => FalVeo3p1FastMode::ImageToVideo(EnqueueVeo3p1FastImageToVideoRequest {
      prompt,
      image_url,
      duration: duration.map(to_i2v_duration),
      aspect_ratio: aspect_ratio.map(to_i2v_aspect_ratio),
      resolution: resolution.map(to_i2v_resolution),
      generate_audio,
    }),
    (Some(first_frame_url), Some(last_frame_url)) => FalVeo3p1FastMode::FirstLastFrame(
      EnqueueVeo3p1FastFirstLastFrameImageToVideoRequest {
        prompt,
        first_frame_url,
        last_frame_url,
        duration: duration.map(to_flf_duration),
        aspect_ratio: aspect_ratio.map(to_flf_aspect_ratio),
        resolution: resolution.map(to_flf_resolution),
        generate_audio,
      },
    ),
    (None, Some(_)) => {
      return Err(unsupported(
        "end_frame",
        "Veo 3.1 Fast requires a start_frame when end_frame is provided",
      ));
    }
  };

  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalVeo3p1Fast(
    FalVeo3p1FastRequestState { mode },
  )))
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

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<PlanAspectRatio>, ArtcraftRouterError> {
  use PlanAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(None),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Some(Ar::Auto)),

    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(Ar::SixteenByNine)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Some(Ar::NineBySixteen)),

    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(unsupported("aspect_ratio", &format!("{:?}", other)))
      }
      _ => Ok(Some(Ar::Auto)),
    },
  }
}

fn plan_resolution(
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<PlanResolution>, ArtcraftRouterError> {
  use PlanResolution as R;
  match resolution {
    None => Ok(None),
    Some(CommonResolution::SevenTwentyP) => Ok(Some(R::SevenTwentyP)),
    Some(CommonResolution::TenEightyP) => Ok(Some(R::TenEightyP)),
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
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(PlanDuration::Eight)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(PlanDuration::Four)),
    },
  }
}

fn unsupported(field: &'static str, value: &str) -> ArtcraftRouterError {
  ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
    field,
    value: value.to_string(),
  })
}

fn to_t2v_duration(d: PlanDuration) -> EnqueueVeo3p1FastTextToVideoDurationSeconds {
  match d {
    PlanDuration::Four => EnqueueVeo3p1FastTextToVideoDurationSeconds::Four,
    PlanDuration::Six => EnqueueVeo3p1FastTextToVideoDurationSeconds::Six,
    PlanDuration::Eight => EnqueueVeo3p1FastTextToVideoDurationSeconds::Eight,
  }
}

fn to_t2v_aspect_ratio(a: PlanAspectRatio) -> EnqueueVeo3p1FastTextToVideoAspectRatio {
  match a {
    PlanAspectRatio::Auto => EnqueueVeo3p1FastTextToVideoAspectRatio::Auto,
    PlanAspectRatio::SixteenByNine => EnqueueVeo3p1FastTextToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => EnqueueVeo3p1FastTextToVideoAspectRatio::NineBySixteen,
  }
}

fn to_t2v_resolution(r: PlanResolution) -> EnqueueVeo3p1FastTextToVideoResolution {
  match r {
    PlanResolution::SevenTwentyP => EnqueueVeo3p1FastTextToVideoResolution::SevenTwentyP,
    PlanResolution::TenEightyP => EnqueueVeo3p1FastTextToVideoResolution::TenEightyP,
  }
}

fn to_i2v_duration(d: PlanDuration) -> EnqueueVeo3p1FastImageToVideoDurationSeconds {
  match d {
    PlanDuration::Four => EnqueueVeo3p1FastImageToVideoDurationSeconds::Four,
    PlanDuration::Six => EnqueueVeo3p1FastImageToVideoDurationSeconds::Six,
    PlanDuration::Eight => EnqueueVeo3p1FastImageToVideoDurationSeconds::Eight,
  }
}

fn to_i2v_aspect_ratio(a: PlanAspectRatio) -> EnqueueVeo3p1FastImageToVideoAspectRatio {
  match a {
    PlanAspectRatio::Auto => EnqueueVeo3p1FastImageToVideoAspectRatio::Auto,
    PlanAspectRatio::SixteenByNine => EnqueueVeo3p1FastImageToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => EnqueueVeo3p1FastImageToVideoAspectRatio::NineBySixteen,
  }
}

fn to_i2v_resolution(r: PlanResolution) -> EnqueueVeo3p1FastImageToVideoResolution {
  match r {
    PlanResolution::SevenTwentyP => EnqueueVeo3p1FastImageToVideoResolution::SevenTwentyP,
    PlanResolution::TenEightyP => EnqueueVeo3p1FastImageToVideoResolution::TenEightyP,
  }
}

fn to_flf_duration(d: PlanDuration) -> EnqueueVeo3p1FastFirstLastFrameImageToVideoDurationSeconds {
  match d {
    PlanDuration::Four => EnqueueVeo3p1FastFirstLastFrameImageToVideoDurationSeconds::Four,
    PlanDuration::Six => EnqueueVeo3p1FastFirstLastFrameImageToVideoDurationSeconds::Six,
    PlanDuration::Eight => EnqueueVeo3p1FastFirstLastFrameImageToVideoDurationSeconds::Eight,
  }
}

fn to_flf_aspect_ratio(a: PlanAspectRatio) -> EnqueueVeo3p1FastFirstLastFrameImageToVideoAspectRatio {
  match a {
    PlanAspectRatio::Auto => EnqueueVeo3p1FastFirstLastFrameImageToVideoAspectRatio::Auto,
    PlanAspectRatio::SixteenByNine => EnqueueVeo3p1FastFirstLastFrameImageToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => EnqueueVeo3p1FastFirstLastFrameImageToVideoAspectRatio::NineBySixteen,
  }
}

fn to_flf_resolution(r: PlanResolution) -> EnqueueVeo3p1FastFirstLastFrameImageToVideoResolution {
  match r {
    PlanResolution::SevenTwentyP => EnqueueVeo3p1FastFirstLastFrameImageToVideoResolution::SevenTwentyP,
    PlanResolution::TenEightyP => EnqueueVeo3p1FastFirstLastFrameImageToVideoResolution::TenEightyP,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::provider::Provider;
  use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Veo3p1Fast,
      provider: Provider::Fal,
      prompt: Some("test".to_string()),
      ..Default::default()
    }
  }

  fn unwrap_mode(b: GenerateVideoRequestBuilder) -> FalVeo3p1FastMode {
    match build_fal_veo_3p1_fast(b).expect("build") {
      VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalVeo3p1Fast(s)) => s.mode,
      _ => panic!("expected FalVeo3p1Fast"),
    }
  }

  #[test]
  fn no_frames_picks_t2v() {
    assert!(matches!(unwrap_mode(base_builder()), FalVeo3p1FastMode::TextToVideo(_)));
  }

  #[test]
  fn start_only_picks_i2v() {
    let mut b = base_builder();
    b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
    assert!(matches!(unwrap_mode(b), FalVeo3p1FastMode::ImageToVideo(_)));
  }

  #[test]
  fn start_and_end_picks_flf() {
    let mut b = base_builder();
    b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
    b.end_frame = Some(ImageRef::Url("https://example.com/b.png".to_string()));
    assert!(matches!(unwrap_mode(b), FalVeo3p1FastMode::FirstLastFrame(_)));
  }

  #[test]
  fn end_only_errors() {
    let mut b = base_builder();
    b.end_frame = Some(ImageRef::Url("https://example.com/b.png".to_string()));
    assert!(build_fal_veo_3p1_fast(b).is_err());
  }

  #[test]
  fn full_combinatorial_pass() {
    let resolutions = [None, Some(CommonResolution::SevenTwentyP), Some(CommonResolution::TenEightyP)];
    let durations = [None, Some(4u16), Some(6), Some(8)];
    let aspect_ratios = [None, Some(CommonAspectRatio::Auto), Some(CommonAspectRatio::WideSixteenByNine), Some(CommonAspectRatio::TallNineBySixteen)];
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
                b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
              }
              if frames == 2 {
                b.end_frame = Some(ImageRef::Url("https://example.com/b.png".to_string()));
              }
              assert!(build_fal_veo_3p1_fast(b).is_ok());
              combos += 1;
            }
          }
        }
      }
    }
    assert_eq!(combos, 3 * 4 * 4 * 3 * 3);
  }
}

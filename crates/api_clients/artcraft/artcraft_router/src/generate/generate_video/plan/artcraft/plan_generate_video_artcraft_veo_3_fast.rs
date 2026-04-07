use crate::api::common_resolution::CommonResolution;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use artcraft_api_defs::generate::video::generate_veo_3_fast_image_to_video::{
  GenerateVeo3FastDuration, GenerateVeo3FastResolution,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftVeo3Fast<'a> {
  pub prompt: Option<&'a str>,
  pub start_frame: &'a MediaFileToken,
  pub resolution: Option<GenerateVeo3FastResolution>,
  pub duration: Option<GenerateVeo3FastDuration>,
  pub generate_audio: Option<bool>,
  pub idempotency_token: String,
}

pub fn plan_generate_video_artcraft_veo_3_fast<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let start_frame = match request.start_frame {
    Some(ImageRef::MediaFileToken(t)) => t,
    Some(ImageRef::Url(_)) => {
      return Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
    None => {
      return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "start_frame",
        value: "Veo 3 Fast requires a starting frame".to_string(),
      }))
    }
  };

  if request.end_frame.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "end_frame",
      value: "Veo 3 Fast does not support an ending frame".to_string(),
    }));
  }

  let resolution = plan_resolution(request.resolution, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::ArtcraftVeo3Fast(PlanArtcraftVeo3Fast {
    prompt: request.prompt,
    start_frame,
    resolution,
    duration,
    generate_audio: request.generate_audio,
    idempotency_token: request.get_or_generate_idempotency_token(),
  }))
}

fn plan_resolution(
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<GenerateVeo3FastResolution>, ArtcraftRouterError> {
  use GenerateVeo3FastResolution as R;
  match resolution {
    None => Ok(None),
    Some(CommonResolution::SevenTwentyP) => Ok(Some(R::SevenTwentyP)),
    Some(CommonResolution::TenEightyP) => Ok(Some(R::TenEightyP)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "resolution",
          value: format!("{:?}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(R::TenEightyP)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(R::SevenTwentyP)),
    },
  }
}

// Legacy storyteller Veo 3 Fast endpoint only exposes EightSeconds.
fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<GenerateVeo3FastDuration>, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(None),
    Some(8) => Ok(Some(GenerateVeo3FastDuration::EightSeconds)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      _ => Ok(Some(GenerateVeo3FastDuration::EightSeconds)),
    },
  }
}

impl PlanArtcraftVeo3Fast<'_> {
  pub fn duration_seconds_for_cost(&self) -> u64 {
    8
  }

  /// Legacy Veo 3 Fast generate handler defaults `generate_audio` to false.
  pub fn generate_audio_for_cost(&self) -> bool {
    self.generate_audio.unwrap_or(false)
  }
}

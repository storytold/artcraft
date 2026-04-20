use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use artcraft_api_defs::generate::video::generate_veo_3_image_to_video::{
  GenerateVeo3AspectRatio, GenerateVeo3Duration, GenerateVeo3Resolution,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftVeo3 {
  pub prompt: Option<String>,
  /// Required for image-to-video. None for text-to-video or when the
  /// omni-gen distillation hydrated the token to a URL.
  pub start_frame: Option<MediaFileToken>,
  pub aspect_ratio: Option<GenerateVeo3AspectRatio>,
  pub resolution: Option<GenerateVeo3Resolution>,
  pub duration: Option<GenerateVeo3Duration>,
  /// The raw requested duration in seconds, preserved for cost estimation.
  /// The `duration` field above maps everything to `EightSeconds` for the
  /// legacy endpoint, but cost should reflect the actual requested value.
  pub duration_seconds_raw: Option<u16>,
  pub generate_audio: Option<bool>,
  pub idempotency_token: String,
}

pub fn plan_generate_video_artcraft_veo_3(
  request: &GenerateVideoRequestBuilder,
) -> Result<VideoGenerationPlan, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let start_frame = match request.start_frame.clone() {
    Some(ImageRef::MediaFileToken(t)) => Some(t),
    // Omni-gen distillation hydrates media tokens to URLs before running the
    // Artcraft cost path. Cost only depends on duration/audio, so URL-form
    // refs are accepted and dropped.
    Some(ImageRef::Url(_)) => None,
    // No start_frame = text-to-video mode.
    None => None,
  };

  if request.end_frame.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "end_frame",
      value: "Veo 3 does not support an ending frame".to_string(),
    }));
  }

  // Aspect ratio only applies to text-to-video; image-to-video inherits
  // the source frame's aspect ratio.
  let is_image_mode = request.start_frame.is_some();
  let aspect_ratio = if is_image_mode {
    None
  } else {
    plan_aspect_ratio(request.aspect_ratio, strategy)?
  };
  let resolution = plan_resolution(request.resolution, strategy)?;
  let duration = plan_duration(request.duration_seconds, strategy)?;

  Ok(VideoGenerationPlan::ArtcraftVeo3(PlanArtcraftVeo3 {
    prompt: request.prompt.clone(),
    start_frame,
    aspect_ratio,
    resolution,
    duration,
    duration_seconds_raw: request.duration_seconds,
    generate_audio: request.generate_audio,
    idempotency_token: request.get_or_generate_idempotency_token(),
  }))
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<GenerateVeo3AspectRatio>, ArtcraftRouterError> {
  use GenerateVeo3AspectRatio as Ar;
  match aspect_ratio {
    None => Ok(None),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Some(Ar::WideSixteenNine)),

    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Some(Ar::Square)),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(Ar::WideSixteenNine)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Some(Ar::TallNineSixteen)),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      _ => Ok(Some(Ar::WideSixteenNine)),
    },
  }
}

fn plan_resolution(
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<GenerateVeo3Resolution>, ArtcraftRouterError> {
  use GenerateVeo3Resolution as R;
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

// The legacy storyteller endpoint for Veo 3 only exposes EightSeconds, but
// the artcraft plan stores the raw duration_seconds from the omni request so
// that cost estimation works for all supported durations (4/6/8).
fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<GenerateVeo3Duration>, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(None),
    // The api_defs enum only has EightSeconds; all durations map to it for
    // the legacy endpoint. The actual seconds are tracked via
    // `duration_seconds_raw` below for cost estimation.
    Some(4) | Some(6) | Some(8) => Ok(Some(GenerateVeo3Duration::EightSeconds)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(GenerateVeo3Duration::EightSeconds)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(GenerateVeo3Duration::EightSeconds)),
    },
  }
}

impl PlanArtcraftVeo3 {
  /// Duration in seconds for cost estimation. Uses the raw requested
  /// duration, clamped to {4, 6, 8}, defaulting to 8s.
  pub fn duration_seconds_for_cost(&self) -> u64 {
    match self.duration_seconds_raw {
      Some(s) if s <= 4 => 4,
      Some(s) if s <= 6 => 6,
      _ => 8, // None, 7, 8, or above → 8s
    }
  }

  /// Legacy Veo 3 generate handler defaults `generate_audio` to false.
  /// The omni path defaults to true (matching the fal plan builder).
  pub fn generate_audio_for_cost(&self) -> bool {
    self.generate_audio.unwrap_or(false)
  }
}

use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::artcraft::build_common::{
  build_artcraft_omni_video_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video::providers::artcraft::flux_3::request::ArtcraftFlux3RequestState;
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_flux_3(builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_artcraft_flux_3_state(builder)?;
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftFlux3(state)))
}

pub(crate) fn build_artcraft_flux_3_state(mut builder: GenerateVideoRequestBuilder) -> Result<ArtcraftFlux3RequestState, ArtcraftRouterError> {
  // Flux 3 accepts 5–20 seconds — wider than the generic helper's window —
  // so pre-plan the duration and reapply it after (the helper would clamp
  // 16–20s down). Also preserve generate_audio (the helper hardcodes None on
  // its output).
  let strategy = builder.request_mismatch_mitigation_strategy;
  let final_duration = plan_flux_3_duration(builder.duration_seconds, strategy)?;
  builder.duration_seconds = final_duration;

  let generate_audio = builder.generate_audio;
  let mut request = build_artcraft_omni_video_request(
    builder,
    CommonVideoModelEnum::Flux3,
    SupportedResolutions::Full,
    UltraWideSupport::Supported,
  )?;
  request.generate_audio = generate_audio;
  request.duration_seconds = final_duration;

  Ok(ArtcraftFlux3RequestState { request })
}

/// Flux 3 durations: 5–20 seconds (unset lets the model pick).
pub(crate) fn plan_flux_3_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<u16>, ArtcraftRouterError> {
  const MIN: u16 = 5;
  const MAX: u16 = 20;
  match duration_seconds {
    None => Ok(None),
    Some(d) if (MIN..=MAX).contains(&d) => Ok(Some(d)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(other.clamp(MIN, MAX)))
      }
    },
  }
}

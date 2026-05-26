use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::artcraft::build_common::{
  build_artcraft_omni_video_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video_v2::providers::artcraft::sora_2::request::ArtcraftSora2RequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_sora_2(mut builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  // Sora 2 accepts only {4,8,12} seconds; pre-plan so cost parity holds for
  // strategies that error or clamp.
  let strategy = builder.request_mismatch_mitigation_strategy;
  let final_duration = plan_sora_2_duration(builder.duration_seconds, strategy)?;
  builder.duration_seconds = final_duration;

  let request = build_artcraft_omni_video_request(
    builder,
    CommonVideoModelEnum::Sora2,
    SupportedResolutions::Full,
    UltraWideSupport::Unsupported,
  )?;
  let state = ArtcraftSora2RequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftSora2(state)))
}

pub(crate) fn plan_sora_2_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<u16>, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(None),
    Some(4) | Some(8) | Some(12) => Ok(duration_seconds),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(12)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(4)),
    },
  }
}

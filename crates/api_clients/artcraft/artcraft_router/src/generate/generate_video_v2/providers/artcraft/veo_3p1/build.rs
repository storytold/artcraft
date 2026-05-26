use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::artcraft::build_common::{
  build_artcraft_omni_video_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video_v2::providers::artcraft::veo_3p1::request::ArtcraftVeo3p1RequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_veo_3p1(mut builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  // Veo 3.1 accepts only {4,6,8} seconds; pre-plan so cost parity holds for
  // strategies that error or clamp. Also preserve generate_audio (omni-gen
  // helper hardcodes None on output).
  let strategy = builder.request_mismatch_mitigation_strategy;
  let final_duration = plan_veo_3p1_duration(builder.duration_seconds, strategy)?;
  builder.duration_seconds = final_duration;

  let generate_audio = builder.generate_audio;
  let mut request = build_artcraft_omni_video_request(
    builder,
    CommonVideoModelEnum::Veo3p1,
    SupportedResolutions::Full,
    UltraWideSupport::Unsupported,
  )?;
  request.generate_audio = generate_audio;

  let state = ArtcraftVeo3p1RequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftVeo3p1(state)))
}

pub(crate) fn plan_veo_3p1_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<u16>, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(None),
    Some(4) | Some(6) | Some(8) => Ok(duration_seconds),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(8)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(4)),
    },
  }
}

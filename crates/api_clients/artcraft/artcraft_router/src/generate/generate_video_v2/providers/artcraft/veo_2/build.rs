use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::artcraft::build_common::{
  build_artcraft_omni_video_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video_v2::providers::artcraft::veo_2::request::ArtcraftVeo2RequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_veo_2(mut builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  // Veo 2 accepts only {5,6,7,8} seconds; omni-gen helper allows the whole
  // 4-15 range, so we pre-plan here to maintain v1 parity (especially for
  // strategies that clamp).
  let strategy = builder.request_mismatch_mitigation_strategy;
  let final_duration = plan_veo_2_duration(builder.duration_seconds, strategy)?;
  builder.duration_seconds = final_duration;

  let request = build_artcraft_omni_video_request(
    builder,
    CommonVideoModelEnum::Veo2,
    SupportedResolutions::Full,
    UltraWideSupport::Unsupported,
  )?;
  let state = ArtcraftVeo2RequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftVeo2(state)))
}

fn plan_veo_2_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<u16>, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(None),
    Some(5) | Some(6) | Some(7) | Some(8) => Ok(duration_seconds),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(8)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(5)),
    },
  }
}

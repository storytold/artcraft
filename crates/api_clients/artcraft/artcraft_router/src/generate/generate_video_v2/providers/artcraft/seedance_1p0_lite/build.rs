use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::artcraft::build_common::{
  build_artcraft_omni_video_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video_v2::providers::artcraft::seedance_1p0_lite::request::ArtcraftSeedance10LiteRequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_seedance_1p0_lite(mut builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  // Seedance 1.0 Lite accepts only {5, 10} seconds; pre-plan so cost parity holds.
  let strategy = builder.request_mismatch_mitigation_strategy;
  let final_duration = plan_seedance_1p0_lite_duration(builder.duration_seconds, strategy)?;
  builder.duration_seconds = final_duration;

  let request = build_artcraft_omni_video_request(
    builder,
    CommonVideoModelEnum::Seedance10Lite,
    SupportedResolutions::Fast,
    UltraWideSupport::Supported,
  )?;
  let state = ArtcraftSeedance10LiteRequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftSeedance10Lite(state)))
}

fn plan_seedance_1p0_lite_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<u16>, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(None),
    Some(5) | Some(10) => Ok(duration_seconds),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(10)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(5)),
    },
  }
}

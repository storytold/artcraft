use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::artcraft::build_common::{
  build_artcraft_omni_video_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video_v2::providers::artcraft::kling_3p0_pro::request::ArtcraftKling3p0ProRequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_kling_3p0_pro(mut builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  // Kling 3.0 Pro supports `generate_audio` — preserve it (build_artcraft_omni_request
  // hardcodes None on output). Also Kling 3.0 supports 3-15s durations, but the
  // omni-gen helper only accepts 4-15s; we plan the Kling-specific duration here
  // and substitute a stand-in (≥4) for the omni-gen call, then restore.
  let generate_audio = builder.generate_audio;
  let strategy = builder.request_mismatch_mitigation_strategy;
  let final_duration = plan_kling_3p0_duration(builder.duration_seconds, strategy)?;
  builder.duration_seconds = final_duration.map(|d| d.max(4));

  let mut request = build_artcraft_omni_video_request(
    builder,
    CommonVideoModelEnum::Kling3p0Pro,
    SupportedResolutions::Full,
    UltraWideSupport::Unsupported,
  )?;
  request.generate_audio = generate_audio;
  request.duration_seconds = final_duration;

  let state = ArtcraftKling3p0ProRequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftKling3p0Pro(state)))
}

/// Kling 3.0 (Pro and Standard) supports durations of 3-15 seconds.
pub(crate) fn plan_kling_3p0_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<u16>, ArtcraftRouterError> {
  const MIN: u16 = 3;
  const MAX: u16 = 15;
  match duration_seconds {
    None => Ok(None),
    Some(d) if (MIN..=MAX).contains(&d) => Ok(Some(d)),
    Some(d) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", d),
        }))
      }
      _ => Ok(Some(d.clamp(MIN, MAX))),
    },
  }
}

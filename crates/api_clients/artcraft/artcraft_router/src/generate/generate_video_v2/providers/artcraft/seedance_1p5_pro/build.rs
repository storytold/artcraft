use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::artcraft::build_common::{
  build_artcraft_omni_video_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video_v2::providers::artcraft::seedance_1p5_pro::request::ArtcraftSeedance1p5ProRequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_seedance_1p5_pro(mut builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  // Seedance 1.5 Pro supports 4-12 seconds; omni-gen helper accepts up to 15,
  // so we clamp the upper bound ourselves. Preserve generate_audio (omni-gen
  // hardcodes None on output).
  let strategy = builder.request_mismatch_mitigation_strategy;
  let final_duration = plan_seedance_1p5_pro_duration(builder.duration_seconds, strategy)?;
  builder.duration_seconds = final_duration;

  let generate_audio = builder.generate_audio;
  let mut request = build_artcraft_omni_video_request(
    builder,
    CommonVideoModelEnum::Seedance1p5Pro,
    SupportedResolutions::Full,
    UltraWideSupport::Supported,
  )?;
  request.generate_audio = generate_audio;

  let state = ArtcraftSeedance1p5ProRequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftSeedance1p5Pro(state)))
}

fn plan_seedance_1p5_pro_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<u16>, ArtcraftRouterError> {
  const MIN: u16 = 4;
  const MAX: u16 = 12;
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

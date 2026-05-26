use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::artcraft::build_common::{
  build_artcraft_omni_video_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video_v2::providers::artcraft::kling_3p0_pro::build::plan_kling_3p0_duration;
use crate::generate::generate_video_v2::providers::artcraft::kling_3p0_standard::request::ArtcraftKling3p0StandardRequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_kling_3p0_standard(mut builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  // Kling 3.0 Standard: same duration range as 3.0 Pro (3-15s); see kling_3p0_pro::build.
  let generate_audio = builder.generate_audio;
  let strategy = builder.request_mismatch_mitigation_strategy;
  let final_duration = plan_kling_3p0_duration(builder.duration_seconds, strategy)?;
  builder.duration_seconds = final_duration.map(|d| d.max(4));

  let mut request = build_artcraft_omni_video_request(
    builder,
    CommonVideoModelEnum::Kling3p0Standard,
    SupportedResolutions::Full,
    UltraWideSupport::Unsupported,
  )?;
  request.generate_audio = generate_audio;
  request.duration_seconds = final_duration;

  let state = ArtcraftKling3p0StandardRequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftKling3p0Standard(state)))
}

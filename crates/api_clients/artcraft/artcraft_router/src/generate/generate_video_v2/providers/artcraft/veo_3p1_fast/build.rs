use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::artcraft::build_common::{
  build_artcraft_omni_video_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video_v2::providers::artcraft::veo_3p1::build::plan_veo_3p1_duration;
use crate::generate::generate_video_v2::providers::artcraft::veo_3p1_fast::request::ArtcraftVeo3p1FastRequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_veo_3p1_fast(mut builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  // Same duration constraints as Veo 3.1 (4/6/8). See veo_3p1::build for rationale.
  let strategy = builder.request_mismatch_mitigation_strategy;
  let final_duration = plan_veo_3p1_duration(builder.duration_seconds, strategy)?;
  builder.duration_seconds = final_duration;

  let generate_audio = builder.generate_audio;
  let mut request = build_artcraft_omni_video_request(
    builder,
    CommonVideoModelEnum::Veo3p1Fast,
    SupportedResolutions::Full,
    UltraWideSupport::Unsupported,
  )?;
  request.generate_audio = generate_audio;

  let state = ArtcraftVeo3p1FastRequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftVeo3p1Fast(state)))
}

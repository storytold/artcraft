use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::artcraft::build_common::{
  build_artcraft_omni_video_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video::providers::artcraft::flux_3::build::plan_flux_3_duration;
use crate::generate::generate_video::providers::artcraft::flux_3_draft::request::ArtcraftFlux3DraftRequestState;
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_flux_3_draft(builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_artcraft_flux_3_draft_state(builder)?;
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftFlux3Draft(state)))
}

pub(crate) fn build_artcraft_flux_3_draft_state(mut builder: GenerateVideoRequestBuilder) -> Result<ArtcraftFlux3DraftRequestState, ArtcraftRouterError> {
  // Same duration handling as full-quality Flux 3: 5–20 seconds is wider than
  // the generic helper's window, so pre-plan and reapply after. Also preserve
  // generate_audio (the helper hardcodes None on its output).
  let strategy = builder.request_mismatch_mitigation_strategy;
  let final_duration = plan_flux_3_duration(builder.duration_seconds, strategy)?;
  builder.duration_seconds = final_duration;

  let generate_audio = builder.generate_audio;
  let mut request = build_artcraft_omni_video_request(
    builder,
    CommonVideoModelEnum::Flux3Draft,
    SupportedResolutions::Full,
    UltraWideSupport::Supported,
  )?;
  request.generate_audio = generate_audio;
  request.duration_seconds = final_duration;

  Ok(ArtcraftFlux3DraftRequestState { request })
}

use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::artcraft::build_common::{
  build_artcraft_omni_video_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video::providers::artcraft::minimax_h3::request::ArtcraftMinimaxH3RequestState;
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_minimax_h3(builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_artcraft_minimax_h3_state(builder)?;
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftMinimaxH3(state)))
}

pub(crate) fn build_artcraft_minimax_h3_state(builder: GenerateVideoRequestBuilder) -> Result<ArtcraftMinimaxH3RequestState, ArtcraftRouterError> {
  let request = build_artcraft_omni_video_request(
    builder,
    CommonVideoModelEnum::MinimaxH3,
    SupportedResolutions::Full,
    UltraWideSupport::Supported,
  )?;
  Ok(ArtcraftMinimaxH3RequestState { request })
}

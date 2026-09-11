use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::artcraft::build_common::{
  build_artcraft_omni_video_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video::providers::artcraft::veo_3p1_lite::request::ArtcraftVeo3p1LiteRequestState;
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_veo_3p1_lite(builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_artcraft_veo_3p1_lite_state(builder)?;
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftVeo3p1Lite(state)))
}

pub(crate) fn build_artcraft_veo_3p1_lite_state(builder: GenerateVideoRequestBuilder) -> Result<ArtcraftVeo3p1LiteRequestState, ArtcraftRouterError> {
  // Veo 3.1 Lite supports `generate_audio` — preserve it so cost can read it back.
  // build_artcraft_omni_video_request hardcodes generate_audio = None on its output.
  let generate_audio = builder.generate_audio;
  let mut request = build_artcraft_omni_video_request(
    builder,
    CommonVideoModelEnum::Veo3p1Lite,
    SupportedResolutions::NoFourEightyP,
    UltraWideSupport::Unsupported,
  )?;
  request.generate_audio = generate_audio;
  Ok(ArtcraftVeo3p1LiteRequestState { request })
}

use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::artcraft::build_common::{
  build_artcraft_omni_video_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video::providers::artcraft::vidu_q3::request::ArtcraftViduQ3RequestState;
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_vidu_q3(builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_artcraft_vidu_q3_state(builder)?;
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftViduQ3(state)))
}

pub(crate) fn build_artcraft_vidu_q3_state(builder: GenerateVideoRequestBuilder) -> Result<ArtcraftViduQ3RequestState, ArtcraftRouterError> {
  // Vidu Q3 supports `audio` — preserve it so cost can read it back.
  // build_artcraft_omni_video_request hardcodes generate_audio = None on its output.
  let generate_audio = builder.generate_audio;
  let mut request = build_artcraft_omni_video_request(
    builder,
    CommonVideoModelEnum::ViduQ3,
    SupportedResolutions::Full,
    UltraWideSupport::Unsupported,
  )?;
  request.generate_audio = generate_audio;
  Ok(ArtcraftViduQ3RequestState { request })
}

use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::artcraft::build_common::{
  build_artcraft_omni_video_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video_v2::providers::artcraft::veo_3_fast::request::ArtcraftVeo3FastRequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_veo_3_fast(builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  // Veo 3 Fast always bills 8s (v1 maps everything to EightSeconds). We preserve
  // generate_audio, and rely on cost.rs to bill 8s regardless of the request's
  // stored duration.
  let generate_audio = builder.generate_audio;
  let mut request = build_artcraft_omni_video_request(
    builder,
    CommonVideoModelEnum::Veo3Fast,
    SupportedResolutions::Full,
    UltraWideSupport::Unsupported,
  )?;
  request.generate_audio = generate_audio;
  let state = ArtcraftVeo3FastRequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftVeo3Fast(state)))
}

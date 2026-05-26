use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::artcraft::build_common::{
  build_artcraft_omni_video_request, SupportedResolutions, UltraWideSupport,
};
use crate::generate::generate_video_v2::providers::artcraft::sora_2::build::plan_sora_2_duration;
use crate::generate::generate_video_v2::providers::artcraft::sora_2_pro::request::ArtcraftSora2ProRequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_artcraft_sora_2_pro(mut builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  // Sora 2 Pro: same duration constraints as Sora 2 ({4,8,12}); reuse helper.
  let strategy = builder.request_mismatch_mitigation_strategy;
  let final_duration = plan_sora_2_duration(builder.duration_seconds, strategy)?;
  builder.duration_seconds = final_duration;

  let request = build_artcraft_omni_video_request(
    builder,
    CommonVideoModelEnum::Sora2Pro,
    SupportedResolutions::Full,
    UltraWideSupport::Unsupported,
  )?;
  let state = ArtcraftSora2ProRequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::ArtcraftSora2Pro(state)))
}

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::draft::KinoviSeedance2p0DraftState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::convert::{plan_aspect_ratio, plan_batch_count, plan_duration, plan_output_resolution};
use crate::generate::generate_video_v2::video_generation_draft::VideoGenerationDraftRequest;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;

pub fn build_kinovi_seedance_2p0(builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let draft = do_build_kinovi_seedance_2p0(builder)?;
  Ok(VideoGenerationDraftOrRequest::Draft(VideoGenerationDraftRequest::KinoviSeedance2p0(draft)))
}

fn do_build_kinovi_seedance_2p0(mut builder: GenerateVideoRequestBuilder) -> Result<KinoviSeedance2p0DraftState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
  let resolution = plan_output_resolution(builder.resolution, strategy)?;
  let batch_count = plan_batch_count(builder.video_batch_count, strategy)?;
  let duration_seconds = plan_duration(builder.duration_seconds, strategy)?;
  let prompt = builder.prompt.take().unwrap_or_default();

  // TODO: Fill out body
  Ok(KinoviSeedance2p0DraftState {
    aspect_ratio,
    resolution,
    batch_count,
    duration_seconds,
    prompt,
    remaining_request: Some(builder),
  })
}

use crate::api::common_video_model::CommonVideoModel;
use crate::api::provider::Provider;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance2p0::plan_generate_video_artcraft_seedance2p0;
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;

/// Read the video generation request, construct a plan, then yield a means to execute it.
pub fn begin_video_generation<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  match request.provider {
    Provider::Artcraft => match request.model {
      CommonVideoModel::Seedance2p0 => {
        plan_generate_video_artcraft_seedance2p0(request).map(VideoGenerationPlan::ArtcraftSeedance2p0)
      }
      _ => Err(ArtcraftRouterError::UnsupportedModel(format!("{:?}", request.model))),
    },
  }
}

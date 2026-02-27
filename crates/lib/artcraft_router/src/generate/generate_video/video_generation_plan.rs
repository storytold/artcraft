use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_seedance2p0::execute_artcraft_seedance2p0;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance2p0::PlanArtcraftSeedance2p0;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

#[derive(Clone, Debug)]
pub struct GenerateVideoResponse {
  pub inference_job_token: InferenceJobToken,
  pub all_inference_job_tokens: Vec<InferenceJobToken>,
}

#[derive(Debug)]
pub enum VideoGenerationPlan<'a> {
  ArtcraftSeedance2p0(PlanArtcraftSeedance2p0<'a>),
}

impl<'a> VideoGenerationPlan<'a> {
  pub async fn generate_video(
    &self,
    client: &RouterClient,
  ) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    match self {
      VideoGenerationPlan::ArtcraftSeedance2p0(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_seedance2p0(plan, artcraft_client).await
      }
    }
  }
}

use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_nano_banana_pro::estimate_image_cost_artcraft_nano_banana_pro;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_nano_banana_pro::execute_artcraft_nano_banana_pro;
use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_nano_banana_pro::PlanArtcraftNanaBananaPro;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

#[derive(Clone, Debug)]
pub struct GenerateImageResponse {
  pub inference_job_token: InferenceJobToken,
}

#[derive(Debug)]
pub enum ImageGenerationPlan<'a> {
  ArtcraftNanaBananaPro(PlanArtcraftNanaBananaPro<'a>),
}

impl<'a> ImageGenerationPlan<'a> {
  pub async fn generate_image(
    &self,
    client: &RouterClient,
  ) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    match self {
      ImageGenerationPlan::ArtcraftNanaBananaPro(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_nano_banana_pro(plan, artcraft_client).await
      }
    }
  }

  pub fn estimate_costs(&self) -> ImageGenerationCostEstimate {
    match self {
      ImageGenerationPlan::ArtcraftNanaBananaPro(plan) => {
        estimate_image_cost_artcraft_nano_banana_pro(plan)
      }
    }
  }
}

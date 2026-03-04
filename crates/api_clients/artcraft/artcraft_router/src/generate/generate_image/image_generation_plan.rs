use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_gpt_image_1p5::estimate_image_cost_artcraft_gpt_image_1p5;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_nano_banana::estimate_image_cost_artcraft_nano_banana;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_nano_banana_pro::estimate_image_cost_artcraft_nano_banana_pro;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_seedream_4::estimate_image_cost_artcraft_seedream_4;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_seedream_4p5::estimate_image_cost_artcraft_seedream_4p5;
use crate::generate::generate_image::cost::fal::estimate_image_cost_fal_nano_banana_pro::estimate_image_cost_fal_nano_banana_pro;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_gpt_image_1p5::execute_artcraft_gpt_image_1p5;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_nano_banana::execute_artcraft_nano_banana;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_nano_banana_pro::execute_artcraft_nano_banana_pro;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_seedream_4::execute_artcraft_seedream_4;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_seedream_4p5::execute_artcraft_seedream_4p5;
use crate::generate::generate_image::execute::fal::generate_image_fal_nano_banana_pro::execute_fal_nano_banana_pro;
use crate::generate::generate_image::generate_image_response::GenerateImageResponse;
use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_gpt_image_1p5::PlanArtcraftGptImage1p5;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_nano_banana::PlanArtcraftNanaBanana;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_nano_banana_pro::PlanArtcraftNanaBananaPro;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_seedream_4::PlanArtcraftSeedream4;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_seedream_4p5::PlanArtcraftSeedream4p5;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_nano_banana_pro::PlanFalNanaBananaPro;

#[derive(Debug)]
pub enum ImageGenerationPlan<'a> {
  ArtcraftGptImage1p5(PlanArtcraftGptImage1p5<'a>),
  ArtcraftNanaBanana(PlanArtcraftNanaBanana<'a>),
  ArtcraftNanaBananaPro(PlanArtcraftNanaBananaPro<'a>),
  ArtcraftSeedream4(PlanArtcraftSeedream4<'a>),
  ArtcraftSeedream4p5(PlanArtcraftSeedream4p5<'a>),
  FalNanaBananaPro(PlanFalNanaBananaPro<'a>),
}

impl<'a> ImageGenerationPlan<'a> {
  pub async fn generate_image(
    &self,
    client: &RouterClient,
  ) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    match self {
      ImageGenerationPlan::ArtcraftGptImage1p5(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_gpt_image_1p5(plan, artcraft_client).await
      }
      ImageGenerationPlan::ArtcraftNanaBanana(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_nano_banana(plan, artcraft_client).await
      }
      ImageGenerationPlan::ArtcraftNanaBananaPro(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_nano_banana_pro(plan, artcraft_client).await
      }
      ImageGenerationPlan::ArtcraftSeedream4(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_seedream_4(plan, artcraft_client).await
      }
      ImageGenerationPlan::ArtcraftSeedream4p5(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_seedream_4p5(plan, artcraft_client).await
      }
      ImageGenerationPlan::FalNanaBananaPro(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_nano_banana_pro(plan, fal_client).await
      }
    }
  }

  pub fn estimate_costs(&self) -> ImageGenerationCostEstimate {
    match self {
      ImageGenerationPlan::ArtcraftGptImage1p5(plan) => {
        estimate_image_cost_artcraft_gpt_image_1p5(plan)
      }
      ImageGenerationPlan::ArtcraftNanaBanana(plan) => {
        estimate_image_cost_artcraft_nano_banana(plan)
      }
      ImageGenerationPlan::ArtcraftNanaBananaPro(plan) => {
        estimate_image_cost_artcraft_nano_banana_pro(plan)
      }
      ImageGenerationPlan::ArtcraftSeedream4(plan) => {
        estimate_image_cost_artcraft_seedream_4(plan)
      }
      ImageGenerationPlan::ArtcraftSeedream4p5(plan) => {
        estimate_image_cost_artcraft_seedream_4p5(plan)
      }
      ImageGenerationPlan::FalNanaBananaPro(plan) => {
        estimate_image_cost_fal_nano_banana_pro(plan)
      }
    }
  }
}

use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::cost::artcraft::estimate_splat_cost_artcraft_marble_0p1_mini::estimate_splat_cost_artcraft_marble_0p1_mini;
use crate::generate::generate_splat::cost::artcraft::estimate_splat_cost_artcraft_marble_0p1_plus::estimate_splat_cost_artcraft_marble_0p1_plus;
use crate::generate::generate_splat::execute::artcraft::generate_splat_artcraft_marble_0p1_mini::execute_artcraft_marble_0p1_mini;
use crate::generate::generate_splat::execute::artcraft::generate_splat_artcraft_marble_0p1_plus::execute_artcraft_marble_0p1_plus;
use crate::generate::generate_splat::generate_splat_response::GenerateSplatResponse;
use crate::generate::generate_splat::plan::artcraft::plan_generate_splat_artcraft_marble_0p1_mini::PlanArtcraftMarble0p1Mini;
use crate::generate::generate_splat::plan::artcraft::plan_generate_splat_artcraft_marble_0p1_plus::PlanArtcraftMarble0p1Plus;
use crate::generate::generate_splat::splat_generation_cost_estimate::SplatGenerationCostEstimate;

#[derive(Debug)]
pub enum SplatGenerationPlan<'a> {
  ArtcraftMarble0p1Mini(PlanArtcraftMarble0p1Mini<'a>),
  ArtcraftMarble0p1Plus(PlanArtcraftMarble0p1Plus<'a>),
}

impl<'a> SplatGenerationPlan<'a> {
  pub async fn generate_splat(
    &self,
    client: &RouterClient,
  ) -> Result<GenerateSplatResponse, ArtcraftRouterError> {
    match self {
      SplatGenerationPlan::ArtcraftMarble0p1Mini(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_marble_0p1_mini(plan, artcraft_client).await
      }
      SplatGenerationPlan::ArtcraftMarble0p1Plus(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_marble_0p1_plus(plan, artcraft_client).await
      }
    }
  }

  pub fn estimate_costs(&self) -> SplatGenerationCostEstimate {
    match self {
      SplatGenerationPlan::ArtcraftMarble0p1Mini(plan) => {
        estimate_splat_cost_artcraft_marble_0p1_mini(plan)
      }
      SplatGenerationPlan::ArtcraftMarble0p1Plus(plan) => {
        estimate_splat_cost_artcraft_marble_0p1_plus(plan)
      }
    }
  }
}

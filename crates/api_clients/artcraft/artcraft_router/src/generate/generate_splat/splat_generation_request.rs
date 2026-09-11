use crate::api::router_provider::RouterProvider;
use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::generate_splat_response::GenerateSplatResponse;
use crate::generate::generate_splat::providers::artcraft::marble_1p0::cost::ArtcraftMarble1p0CostState;
use crate::generate::generate_splat::providers::artcraft::marble_1p0::request::ArtcraftMarble1p0RequestState;
use crate::generate::generate_splat::providers::artcraft::marble_1p0_draft::cost::ArtcraftMarble1p0DraftCostState;
use crate::generate::generate_splat::providers::artcraft::marble_1p0_draft::request::ArtcraftMarble1p0DraftRequestState;
use crate::generate::generate_splat::providers::artcraft::marble_1p1::cost::ArtcraftMarble1p1CostState;
use crate::generate::generate_splat::providers::artcraft::marble_1p1::request::ArtcraftMarble1p1RequestState;
use crate::generate::generate_splat::providers::artcraft::marble_1p1_plus::cost::ArtcraftMarble1p1PlusCostState;
use crate::generate::generate_splat::providers::artcraft::marble_1p1_plus::request::ArtcraftMarble1p1PlusRequestState;
use crate::generate::generate_splat::providers::artcraft::triposplat::cost::ArtcraftTripoSplatCostState;
use crate::generate::generate_splat::providers::artcraft::triposplat::request::ArtcraftTripoSplatRequestState;
use crate::generate::generate_splat::providers::fal::triposplat::cost::FalTripoSplatCostState;
use crate::generate::generate_splat::providers::fal::triposplat::request::FalTripoSplatRequestState;
use crate::generate::generate_splat::providers::worldlabs::marble_1p0::cost::WorldLabsMarble1p0CostState;
use crate::generate::generate_splat::providers::worldlabs::marble_1p0::request::WorldLabsMarble1p0RequestState;
use crate::generate::generate_splat::providers::worldlabs::marble_1p0_draft::cost::WorldLabsMarble1p0DraftModelCostState;
use crate::generate::generate_splat::providers::worldlabs::marble_1p0_draft::request::WorldLabsMarble1p0DraftModelRequestState;
use crate::generate::generate_splat::providers::worldlabs::marble_1p1::cost::WorldLabsMarble1p1CostState;
use crate::generate::generate_splat::providers::worldlabs::marble_1p1::request::WorldLabsMarble1p1RequestState;
use crate::generate::generate_splat::providers::worldlabs::marble_1p1_plus::cost::WorldLabsMarble1p1PlusCostState;
use crate::generate::generate_splat::providers::worldlabs::marble_1p1_plus::request::WorldLabsMarble1p1PlusRequestState;
use crate::generate::generate_splat::splat_generation_cost_estimate::SplatGenerationCostEstimate;

#[derive(Clone, Debug)]
pub enum SplatGenerationRequest {
  ArtcraftMarble1p0(ArtcraftMarble1p0RequestState),
  ArtcraftMarble1p0Draft(ArtcraftMarble1p0DraftRequestState),
  ArtcraftMarble1p1(ArtcraftMarble1p1RequestState),
  ArtcraftMarble1p1Plus(ArtcraftMarble1p1PlusRequestState),
  ArtcraftTripoSplat(ArtcraftTripoSplatRequestState),
  FalTripoSplat(FalTripoSplatRequestState),
  WorldLabsMarble1p0(WorldLabsMarble1p0RequestState),
  WorldLabsMarble1p0Draft(WorldLabsMarble1p0DraftModelRequestState),
  WorldLabsMarble1p1(WorldLabsMarble1p1RequestState),
  WorldLabsMarble1p1Plus(WorldLabsMarble1p1PlusRequestState),
}

impl SplatGenerationRequest {

  pub fn get_provider(&self) -> RouterProvider {
    match self {
      Self::ArtcraftMarble1p0(_) => RouterProvider::Artcraft,
      Self::ArtcraftMarble1p0Draft(_) => RouterProvider::Artcraft,
      Self::ArtcraftMarble1p1(_) => RouterProvider::Artcraft,
      Self::ArtcraftMarble1p1Plus(_) => RouterProvider::Artcraft,
      Self::ArtcraftTripoSplat(_) => RouterProvider::Artcraft,
      Self::FalTripoSplat(_) => RouterProvider::Fal,
      Self::WorldLabsMarble1p0(_) => RouterProvider::WorldLabs,
      Self::WorldLabsMarble1p0Draft(_) => RouterProvider::WorldLabs,
      Self::WorldLabsMarble1p1(_) => RouterProvider::WorldLabs,
      Self::WorldLabsMarble1p1Plus(_) => RouterProvider::WorldLabs,
    }
  }

  /// Return a cost estimate to fulfill the request.
  pub fn estimate_cost(&self) -> Result<SplatGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      SplatGenerationRequest::ArtcraftMarble1p0(request) => Ok(ArtcraftMarble1p0CostState::from_request(request).estimate_cost()),
      SplatGenerationRequest::ArtcraftMarble1p0Draft(request) => Ok(ArtcraftMarble1p0DraftCostState::from_request(request).estimate_cost()),
      SplatGenerationRequest::ArtcraftMarble1p1(request) => Ok(ArtcraftMarble1p1CostState::from_request(request).estimate_cost()),
      SplatGenerationRequest::ArtcraftMarble1p1Plus(request) => Ok(ArtcraftMarble1p1PlusCostState::from_request(request).estimate_cost()),
      SplatGenerationRequest::ArtcraftTripoSplat(request) => Ok(ArtcraftTripoSplatCostState::from_request(request).estimate_cost()),
      SplatGenerationRequest::FalTripoSplat(request) => Ok(FalTripoSplatCostState::from_request(request).estimate_cost()),
      SplatGenerationRequest::WorldLabsMarble1p0(request) => Ok(WorldLabsMarble1p0CostState::from_request(request).estimate_cost()),
      SplatGenerationRequest::WorldLabsMarble1p0Draft(request) => Ok(WorldLabsMarble1p0DraftModelCostState::from_request(request).estimate_cost()),
      SplatGenerationRequest::WorldLabsMarble1p1(request) => Ok(WorldLabsMarble1p1CostState::from_request(request).estimate_cost()),
      SplatGenerationRequest::WorldLabsMarble1p1Plus(request) => Ok(WorldLabsMarble1p1PlusCostState::from_request(request).estimate_cost()),
    }
  }

  /// Send the splat generation request
  /// If successful, returns the job IDs.
  pub async fn send_request(&self, client: &RouterClient) -> Result<GenerateSplatResponse, ArtcraftRouterError> {
    match self {
      SplatGenerationRequest::ArtcraftMarble1p0(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      SplatGenerationRequest::ArtcraftMarble1p0Draft(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      SplatGenerationRequest::ArtcraftMarble1p1(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      SplatGenerationRequest::ArtcraftMarble1p1Plus(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      SplatGenerationRequest::ArtcraftTripoSplat(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      SplatGenerationRequest::FalTripoSplat(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      SplatGenerationRequest::WorldLabsMarble1p0(request) => {
        let client_ref = client.get_worldlabs_client_ref()?;
        request.send(client_ref).await
      },
      SplatGenerationRequest::WorldLabsMarble1p0Draft(request) => {
        let client_ref = client.get_worldlabs_client_ref()?;
        request.send(client_ref).await
      },
      SplatGenerationRequest::WorldLabsMarble1p1(request) => {
        let client_ref = client.get_worldlabs_client_ref()?;
        request.send(client_ref).await
      },
      SplatGenerationRequest::WorldLabsMarble1p1Plus(request) => {
        let client_ref = client.get_worldlabs_client_ref()?;
        request.send(client_ref).await
      },
    }
  }
}

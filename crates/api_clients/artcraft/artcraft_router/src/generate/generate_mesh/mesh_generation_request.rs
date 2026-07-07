use crate::api::router_provider::RouterProvider;
use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::generate_mesh_response::GenerateMeshResponse;
use crate::generate::generate_mesh::mesh_generation_cost_estimate::MeshGenerationCostEstimate;
use crate::generate::generate_mesh::providers::artcraft::hunyuan3d_3::cost::ArtcraftHunyuan3d3CostState;
use crate::generate::generate_mesh::providers::artcraft::hunyuan3d_3::request::ArtcraftHunyuan3d3RequestState;
use crate::generate::generate_mesh::providers::artcraft::hunyuan3d_3_sketch::cost::ArtcraftHunyuan3d3SketchCostState;
use crate::generate::generate_mesh::providers::artcraft::hunyuan3d_3_sketch::request::ArtcraftHunyuan3d3SketchRequestState;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_2p0::cost::ArtcraftHunyuan3d2p0CostState;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_2p0::request::ArtcraftHunyuan3d2p0RequestState;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_2p1::cost::ArtcraftHunyuan3d2p1CostState;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_2p1::request::ArtcraftHunyuan3d2p1RequestState;
use crate::generate::generate_mesh::providers::fal::hunyuan3d_3::cost::{
  FalHunyuan3d3ImageCostState, FalHunyuan3d3TextCostState,
};
use crate::generate::generate_mesh::providers::fal::hunyuan3d_3::request::{
  FalHunyuan3d3ImageRequestState, FalHunyuan3d3TextRequestState,
};
use crate::generate::generate_mesh::providers::fal::hunyuan3d_3_sketch::cost::FalHunyuan3d3SketchCostState;
use crate::generate::generate_mesh::providers::fal::hunyuan3d_3_sketch::request::FalHunyuan3d3SketchRequestState;
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_2p0::cost::FalHunyuan3d2p0CostState;
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_2p0::request::FalHunyuan3d2p0RequestState;
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_2p1::cost::FalHunyuan3d2p1CostState;
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_2p1::request::FalHunyuan3d2p1RequestState;

#[derive(Clone, Debug)]
pub enum MeshGenerationRequest {
  ArtcraftHunyuan3d2p0(ArtcraftHunyuan3d2p0RequestState),
  ArtcraftHunyuan3d2p1(ArtcraftHunyuan3d2p1RequestState),
  ArtcraftHunyuan3d3(ArtcraftHunyuan3d3RequestState),
  ArtcraftHunyuan3d3Sketch(ArtcraftHunyuan3d3SketchRequestState),
  FalHunyuan3d2p0(FalHunyuan3d2p0RequestState),
  FalHunyuan3d2p1(FalHunyuan3d2p1RequestState),
  FalHunyuan3d3Image(FalHunyuan3d3ImageRequestState),
  FalHunyuan3d3Text(FalHunyuan3d3TextRequestState),
  FalHunyuan3d3Sketch(FalHunyuan3d3SketchRequestState),
}

impl MeshGenerationRequest {

  pub fn get_provider(&self) -> RouterProvider {
    match self {
      Self::ArtcraftHunyuan3d2p0(_) => RouterProvider::Artcraft,
      Self::ArtcraftHunyuan3d2p1(_) => RouterProvider::Artcraft,
      Self::ArtcraftHunyuan3d3(_) => RouterProvider::Artcraft,
      Self::ArtcraftHunyuan3d3Sketch(_) => RouterProvider::Artcraft,
      Self::FalHunyuan3d2p0(_) => RouterProvider::Fal,
      Self::FalHunyuan3d2p1(_) => RouterProvider::Fal,
      Self::FalHunyuan3d3Image(_) => RouterProvider::Fal,
      Self::FalHunyuan3d3Text(_) => RouterProvider::Fal,
      Self::FalHunyuan3d3Sketch(_) => RouterProvider::Fal,
    }
  }

  /// Return a cost estimate to fulfill the request.
  pub fn estimate_cost(&self) -> Result<MeshGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      MeshGenerationRequest::ArtcraftHunyuan3d2p0(request) => Ok(ArtcraftHunyuan3d2p0CostState::from_request(request).estimate_cost()),
      MeshGenerationRequest::ArtcraftHunyuan3d2p1(request) => Ok(ArtcraftHunyuan3d2p1CostState::from_request(request).estimate_cost()),
      MeshGenerationRequest::ArtcraftHunyuan3d3(request) => Ok(ArtcraftHunyuan3d3CostState::from_request(request).estimate_cost()),
      MeshGenerationRequest::ArtcraftHunyuan3d3Sketch(request) => Ok(ArtcraftHunyuan3d3SketchCostState::from_request(request).estimate_cost()),
      MeshGenerationRequest::FalHunyuan3d2p0(request) => Ok(FalHunyuan3d2p0CostState::from_request(request).estimate_cost()),
      MeshGenerationRequest::FalHunyuan3d2p1(request) => Ok(FalHunyuan3d2p1CostState::from_request(request).estimate_cost()),
      MeshGenerationRequest::FalHunyuan3d3Image(request) => Ok(FalHunyuan3d3ImageCostState::from_request(request).estimate_cost()),
      MeshGenerationRequest::FalHunyuan3d3Text(request) => Ok(FalHunyuan3d3TextCostState::from_request(request).estimate_cost()),
      MeshGenerationRequest::FalHunyuan3d3Sketch(request) => Ok(FalHunyuan3d3SketchCostState::from_request(request).estimate_cost()),
    }
  }

  /// Send the mesh generation request
  /// If successful, returns the job IDs.
  pub async fn send_request(&self, client: &RouterClient) -> Result<GenerateMeshResponse, ArtcraftRouterError> {
    match self {
      MeshGenerationRequest::ArtcraftHunyuan3d2p0(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      MeshGenerationRequest::ArtcraftHunyuan3d2p1(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      MeshGenerationRequest::ArtcraftHunyuan3d3(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      MeshGenerationRequest::ArtcraftHunyuan3d3Sketch(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      MeshGenerationRequest::FalHunyuan3d2p0(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      MeshGenerationRequest::FalHunyuan3d2p1(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      MeshGenerationRequest::FalHunyuan3d3Image(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      MeshGenerationRequest::FalHunyuan3d3Text(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      MeshGenerationRequest::FalHunyuan3d3Sketch(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
    }
  }
}

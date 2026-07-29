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
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_3p1_part::cost::ArtcraftHunyuan3d3p1PartCostState;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_3p1_part::request::ArtcraftHunyuan3d3p1PartRequestState;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_3p1_pro::cost::ArtcraftHunyuan3d3p1ProCostState;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_3p1_pro::request::ArtcraftHunyuan3d3p1ProRequestState;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_3p1_rapid::cost::ArtcraftHunyuan3d3p1RapidCostState;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_3p1_rapid::request::ArtcraftHunyuan3d3p1RapidRequestState;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_3p1_smart_topology::cost::ArtcraftHunyuan3d3p1SmartTopologyCostState;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_3p1_smart_topology::request::ArtcraftHunyuan3d3p1SmartTopologyRequestState;
use crate::generate::generate_mesh::providers::artcraft::meshy_v6::cost::ArtcraftMeshyV6CostState;
use crate::generate::generate_mesh::providers::artcraft::meshy_v6::request::ArtcraftMeshyV6RequestState;
use crate::generate::generate_mesh::providers::artcraft::rodin_2p5_fast::cost::ArtcraftRodin2p5FastCostState;
use crate::generate::generate_mesh::providers::artcraft::rodin_2p5_fast::request::ArtcraftRodin2p5FastRequestState;
use crate::generate::generate_mesh::providers::artcraft::tripo3d_h3p1::cost::ArtcraftTripo3dH3p1CostState;
use crate::generate::generate_mesh::providers::artcraft::tripo3d_h3p1::request::ArtcraftTripo3dH3p1RequestState;
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
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_3p1_part::cost::FalHunyuan3d3p1PartCostState;
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_3p1_part::request::FalHunyuan3d3p1PartRequestState;
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_3p1_pro::cost::{
  FalHunyuan3d3p1ProImageCostState, FalHunyuan3d3p1ProTextCostState,
};
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_3p1_pro::request::{
  FalHunyuan3d3p1ProImageRequestState, FalHunyuan3d3p1ProTextRequestState,
};
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_3p1_rapid::cost::{
  FalHunyuan3d3p1RapidImageCostState, FalHunyuan3d3p1RapidTextCostState,
};
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_3p1_rapid::request::{
  FalHunyuan3d3p1RapidImageRequestState, FalHunyuan3d3p1RapidTextRequestState,
};
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_3p1_smart_topology::cost::FalHunyuan3d3p1SmartTopologyCostState;
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_3p1_smart_topology::request::FalHunyuan3d3p1SmartTopologyRequestState;
use crate::generate::generate_mesh::providers::fal::meshy_v6::cost::{
  FalMeshyV6ImageCostState, FalMeshyV6TextCostState,
};
use crate::generate::generate_mesh::providers::fal::meshy_v6::request::{
  FalMeshyV6ImageRequestState, FalMeshyV6TextRequestState,
};
use crate::generate::generate_mesh::providers::fal::rodin_2p5_fast::cost::{
  FalRodin2p5FastImageCostState, FalRodin2p5FastTextCostState,
};
use crate::generate::generate_mesh::providers::fal::rodin_2p5_fast::request::{
  FalRodin2p5FastImageRequestState, FalRodin2p5FastTextRequestState,
};
use crate::generate::generate_mesh::providers::fal::tripo3d_h3p1::cost::{
  FalTripo3dH3p1ImageCostState, FalTripo3dH3p1MultiviewCostState, FalTripo3dH3p1TextCostState,
};
use crate::generate::generate_mesh::providers::fal::tripo3d_h3p1::request::{
  FalTripo3dH3p1ImageRequestState, FalTripo3dH3p1MultiviewRequestState, FalTripo3dH3p1TextRequestState,
};

#[derive(Clone, Debug)]
pub enum MeshGenerationRequest {
  ArtcraftHunyuan3d2p0(ArtcraftHunyuan3d2p0RequestState),
  ArtcraftHunyuan3d2p1(ArtcraftHunyuan3d2p1RequestState),
  ArtcraftHunyuan3d3(ArtcraftHunyuan3d3RequestState),
  ArtcraftHunyuan3d3Sketch(ArtcraftHunyuan3d3SketchRequestState),
  ArtcraftHunyuan3d3p1Pro(ArtcraftHunyuan3d3p1ProRequestState),
  ArtcraftHunyuan3d3p1Rapid(ArtcraftHunyuan3d3p1RapidRequestState),
  ArtcraftHunyuan3d3p1Part(ArtcraftHunyuan3d3p1PartRequestState),
  ArtcraftHunyuan3d3p1SmartTopology(ArtcraftHunyuan3d3p1SmartTopologyRequestState),
  ArtcraftTripo3dH3p1(ArtcraftTripo3dH3p1RequestState),
  ArtcraftMeshyV6(ArtcraftMeshyV6RequestState),
  ArtcraftRodin2p5Fast(ArtcraftRodin2p5FastRequestState),
  FalHunyuan3d2p0(FalHunyuan3d2p0RequestState),
  FalHunyuan3d2p1(FalHunyuan3d2p1RequestState),
  FalHunyuan3d3Image(FalHunyuan3d3ImageRequestState),
  FalHunyuan3d3Text(FalHunyuan3d3TextRequestState),
  FalHunyuan3d3Sketch(FalHunyuan3d3SketchRequestState),
  FalHunyuan3d3p1ProImage(FalHunyuan3d3p1ProImageRequestState),
  FalHunyuan3d3p1ProText(FalHunyuan3d3p1ProTextRequestState),
  FalHunyuan3d3p1RapidImage(FalHunyuan3d3p1RapidImageRequestState),
  FalHunyuan3d3p1RapidText(FalHunyuan3d3p1RapidTextRequestState),
  FalHunyuan3d3p1Part(FalHunyuan3d3p1PartRequestState),
  FalHunyuan3d3p1SmartTopology(FalHunyuan3d3p1SmartTopologyRequestState),
  FalTripo3dH3p1Text(FalTripo3dH3p1TextRequestState),
  FalTripo3dH3p1Image(FalTripo3dH3p1ImageRequestState),
  FalTripo3dH3p1Multiview(FalTripo3dH3p1MultiviewRequestState),
  FalMeshyV6Text(FalMeshyV6TextRequestState),
  FalMeshyV6Image(FalMeshyV6ImageRequestState),
  FalRodin2p5FastText(FalRodin2p5FastTextRequestState),
  FalRodin2p5FastImage(FalRodin2p5FastImageRequestState),
}

impl MeshGenerationRequest {

  pub fn get_provider(&self) -> RouterProvider {
    match self {
      Self::ArtcraftHunyuan3d2p0(_)
      | Self::ArtcraftHunyuan3d2p1(_)
      | Self::ArtcraftHunyuan3d3(_)
      | Self::ArtcraftHunyuan3d3Sketch(_)
      | Self::ArtcraftHunyuan3d3p1Pro(_)
      | Self::ArtcraftHunyuan3d3p1Rapid(_)
      | Self::ArtcraftHunyuan3d3p1Part(_)
      | Self::ArtcraftHunyuan3d3p1SmartTopology(_)
      | Self::ArtcraftTripo3dH3p1(_)
      | Self::ArtcraftMeshyV6(_)
      | Self::ArtcraftRodin2p5Fast(_) => RouterProvider::Artcraft,
      Self::FalHunyuan3d2p0(_)
      | Self::FalHunyuan3d2p1(_)
      | Self::FalHunyuan3d3Image(_)
      | Self::FalHunyuan3d3Text(_)
      | Self::FalHunyuan3d3Sketch(_)
      | Self::FalHunyuan3d3p1ProImage(_)
      | Self::FalHunyuan3d3p1ProText(_)
      | Self::FalHunyuan3d3p1RapidImage(_)
      | Self::FalHunyuan3d3p1RapidText(_)
      | Self::FalHunyuan3d3p1Part(_)
      | Self::FalHunyuan3d3p1SmartTopology(_)
      | Self::FalTripo3dH3p1Text(_)
      | Self::FalTripo3dH3p1Image(_)
      | Self::FalTripo3dH3p1Multiview(_)
      | Self::FalMeshyV6Text(_)
      | Self::FalMeshyV6Image(_)
      | Self::FalRodin2p5FastText(_)
      | Self::FalRodin2p5FastImage(_) => RouterProvider::Fal,
    }
  }

  /// Return a cost estimate to fulfill the request.
  pub fn estimate_cost(&self) -> Result<MeshGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      Self::ArtcraftHunyuan3d2p0(request) => Ok(ArtcraftHunyuan3d2p0CostState::from_request(request).estimate_cost()),
      Self::ArtcraftHunyuan3d2p1(request) => Ok(ArtcraftHunyuan3d2p1CostState::from_request(request).estimate_cost()),
      Self::ArtcraftHunyuan3d3(request) => Ok(ArtcraftHunyuan3d3CostState::from_request(request).estimate_cost()),
      Self::ArtcraftHunyuan3d3Sketch(request) => Ok(ArtcraftHunyuan3d3SketchCostState::from_request(request).estimate_cost()),
      Self::ArtcraftHunyuan3d3p1Pro(request) => Ok(ArtcraftHunyuan3d3p1ProCostState::from_request(request).estimate_cost()),
      Self::ArtcraftHunyuan3d3p1Rapid(request) => Ok(ArtcraftHunyuan3d3p1RapidCostState::from_request(request).estimate_cost()),
      Self::ArtcraftHunyuan3d3p1Part(request) => Ok(ArtcraftHunyuan3d3p1PartCostState::from_request(request).estimate_cost()),
      Self::ArtcraftHunyuan3d3p1SmartTopology(request) => Ok(ArtcraftHunyuan3d3p1SmartTopologyCostState::from_request(request).estimate_cost()),
      Self::ArtcraftTripo3dH3p1(request) => Ok(ArtcraftTripo3dH3p1CostState::from_request(request).estimate_cost()),
      Self::ArtcraftMeshyV6(request) => Ok(ArtcraftMeshyV6CostState::from_request(request).estimate_cost()),
      Self::ArtcraftRodin2p5Fast(request) => Ok(ArtcraftRodin2p5FastCostState::from_request(request).estimate_cost()),
      Self::FalHunyuan3d2p0(request) => Ok(FalHunyuan3d2p0CostState::from_request(request).estimate_cost()),
      Self::FalHunyuan3d2p1(request) => Ok(FalHunyuan3d2p1CostState::from_request(request).estimate_cost()),
      Self::FalHunyuan3d3Image(request) => Ok(FalHunyuan3d3ImageCostState::from_request(request).estimate_cost()),
      Self::FalHunyuan3d3Text(request) => Ok(FalHunyuan3d3TextCostState::from_request(request).estimate_cost()),
      Self::FalHunyuan3d3Sketch(request) => Ok(FalHunyuan3d3SketchCostState::from_request(request).estimate_cost()),
      Self::FalHunyuan3d3p1ProImage(request) => Ok(FalHunyuan3d3p1ProImageCostState::from_request(request).estimate_cost()),
      Self::FalHunyuan3d3p1ProText(request) => Ok(FalHunyuan3d3p1ProTextCostState::from_request(request).estimate_cost()),
      Self::FalHunyuan3d3p1RapidImage(request) => Ok(FalHunyuan3d3p1RapidImageCostState::from_request(request).estimate_cost()),
      Self::FalHunyuan3d3p1RapidText(request) => Ok(FalHunyuan3d3p1RapidTextCostState::from_request(request).estimate_cost()),
      Self::FalHunyuan3d3p1Part(request) => Ok(FalHunyuan3d3p1PartCostState::from_request(request).estimate_cost()),
      Self::FalHunyuan3d3p1SmartTopology(request) => Ok(FalHunyuan3d3p1SmartTopologyCostState::from_request(request).estimate_cost()),
      Self::FalTripo3dH3p1Text(request) => Ok(FalTripo3dH3p1TextCostState::from_request(request).estimate_cost()),
      Self::FalTripo3dH3p1Image(request) => Ok(FalTripo3dH3p1ImageCostState::from_request(request).estimate_cost()),
      Self::FalTripo3dH3p1Multiview(request) => Ok(FalTripo3dH3p1MultiviewCostState::from_request(request).estimate_cost()),
      Self::FalMeshyV6Text(request) => Ok(FalMeshyV6TextCostState::from_request(request).estimate_cost()),
      Self::FalMeshyV6Image(request) => Ok(FalMeshyV6ImageCostState::from_request(request).estimate_cost()),
      Self::FalRodin2p5FastText(request) => Ok(FalRodin2p5FastTextCostState::from_request(request).estimate_cost()),
      Self::FalRodin2p5FastImage(request) => Ok(FalRodin2p5FastImageCostState::from_request(request).estimate_cost()),
    }
  }

  /// Send the mesh generation request
  /// If successful, returns the job IDs.
  pub async fn send_request(&self, client: &RouterClient) -> Result<GenerateMeshResponse, ArtcraftRouterError> {
    match self {
      Self::ArtcraftHunyuan3d2p0(request) => request.send(client.get_artcraft_client_ref()?).await,
      Self::ArtcraftHunyuan3d2p1(request) => request.send(client.get_artcraft_client_ref()?).await,
      Self::ArtcraftHunyuan3d3(request) => request.send(client.get_artcraft_client_ref()?).await,
      Self::ArtcraftHunyuan3d3Sketch(request) => request.send(client.get_artcraft_client_ref()?).await,
      Self::ArtcraftHunyuan3d3p1Pro(request) => request.send(client.get_artcraft_client_ref()?).await,
      Self::ArtcraftHunyuan3d3p1Rapid(request) => request.send(client.get_artcraft_client_ref()?).await,
      Self::ArtcraftHunyuan3d3p1Part(request) => request.send(client.get_artcraft_client_ref()?).await,
      Self::ArtcraftHunyuan3d3p1SmartTopology(request) => request.send(client.get_artcraft_client_ref()?).await,
      Self::ArtcraftTripo3dH3p1(request) => request.send(client.get_artcraft_client_ref()?).await,
      Self::ArtcraftMeshyV6(request) => request.send(client.get_artcraft_client_ref()?).await,
      Self::ArtcraftRodin2p5Fast(request) => request.send(client.get_artcraft_client_ref()?).await,
      Self::FalHunyuan3d2p0(request) => request.send(client.get_fal_client_ref()?).await,
      Self::FalHunyuan3d2p1(request) => request.send(client.get_fal_client_ref()?).await,
      Self::FalHunyuan3d3Image(request) => request.send(client.get_fal_client_ref()?).await,
      Self::FalHunyuan3d3Text(request) => request.send(client.get_fal_client_ref()?).await,
      Self::FalHunyuan3d3Sketch(request) => request.send(client.get_fal_client_ref()?).await,
      Self::FalHunyuan3d3p1ProImage(request) => request.send(client.get_fal_client_ref()?).await,
      Self::FalHunyuan3d3p1ProText(request) => request.send(client.get_fal_client_ref()?).await,
      Self::FalHunyuan3d3p1RapidImage(request) => request.send(client.get_fal_client_ref()?).await,
      Self::FalHunyuan3d3p1RapidText(request) => request.send(client.get_fal_client_ref()?).await,
      Self::FalHunyuan3d3p1Part(request) => request.send(client.get_fal_client_ref()?).await,
      Self::FalHunyuan3d3p1SmartTopology(request) => request.send(client.get_fal_client_ref()?).await,
      Self::FalTripo3dH3p1Text(request) => request.send(client.get_fal_client_ref()?).await,
      Self::FalTripo3dH3p1Image(request) => request.send(client.get_fal_client_ref()?).await,
      Self::FalTripo3dH3p1Multiview(request) => request.send(client.get_fal_client_ref()?).await,
      Self::FalMeshyV6Text(request) => request.send(client.get_fal_client_ref()?).await,
      Self::FalMeshyV6Image(request) => request.send(client.get_fal_client_ref()?).await,
      Self::FalRodin2p5FastText(request) => request.send(client.get_fal_client_ref()?).await,
      Self::FalRodin2p5FastImage(request) => request.send(client.get_fal_client_ref()?).await,
    }
  }
}

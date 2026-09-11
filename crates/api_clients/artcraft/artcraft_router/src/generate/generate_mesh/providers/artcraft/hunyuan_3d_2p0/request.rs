use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_mesh_cost_and_generate_request::OmniGenMeshCostAndGenerateRequest;

use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::generate_mesh_response::GenerateMeshResponse;
use crate::generate::generate_mesh::providers::artcraft::request_common::send_artcraft_omni_mesh_request;

#[derive(Clone, Debug)]
pub struct ArtcraftHunyuan3d2p0RequestState {
  pub request: OmniGenMeshCostAndGenerateRequest,
}

impl ArtcraftHunyuan3d2p0RequestState {
  pub async fn send(&self, client: &RouterArtcraftClient) -> Result<GenerateMeshResponse, ArtcraftRouterError> {
    send_artcraft_omni_mesh_request(&self.request, client).await
  }
}

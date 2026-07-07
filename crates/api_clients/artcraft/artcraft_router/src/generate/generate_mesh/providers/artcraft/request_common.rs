use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_mesh_cost_and_generate_request::OmniGenMeshCostAndGenerateRequest;
use artcraft_client::endpoints::omni_gen::generate::mesh::omni_gen_mesh::omni_gen_mesh_generate;

use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_mesh::generate_mesh_response::{
  ArtcraftMeshResponsePayload, GenerateMeshResponse,
};

/// Send a mesh generation request to the Artcraft omni-gen endpoint.
/// All Artcraft model request states delegate to this function.
pub async fn send_artcraft_omni_mesh_request(
  request: &OmniGenMeshCostAndGenerateRequest,
  client: &RouterArtcraftClient,
) -> Result<GenerateMeshResponse, ArtcraftRouterError> {
  let response = omni_gen_mesh_generate(
    &client.api_host,
    Some(&client.credentials),
    request.clone(),
  )
    .await
    .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Storyteller(err)))?;

  Ok(GenerateMeshResponse::Artcraft(ArtcraftMeshResponsePayload {
    inference_job_token: response.inference_job_token,
    all_inference_job_tokens: response.all_job_tokens,
  }))
}

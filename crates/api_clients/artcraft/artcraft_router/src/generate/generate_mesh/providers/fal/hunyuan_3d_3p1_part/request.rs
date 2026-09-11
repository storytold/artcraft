use fal_client::requests::api::mesh::part::hunyuan_3d_3p1_part::api::Hunyuan3d3p1PartRequest;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::generate_mesh_response::GenerateMeshResponse;
use crate::generate::generate_mesh::providers::fal::hunyuan3d_3::request::send_fal_mesh_request;

#[derive(Clone, Debug)]
pub struct FalHunyuan3d3p1PartRequestState {
  /// Final materialized request; ready to fire.
  pub request: Hunyuan3d3p1PartRequest,
}

impl FalHunyuan3d3p1PartRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateMeshResponse, ArtcraftRouterError> {
    send_fal_mesh_request(&self.request, client).await
  }
}

#[cfg(test)]
mod tests {
  use crate::api::mesh_ref::MeshRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;
  use crate::generate::generate_mesh::mesh_generation_draft_or_request::MeshGenerationDraftOrRequest;
  use crate::test_helpers::get_fal_client;

  #[tokio::test]
  #[ignore] // requires real API key and a real FBX URL, incurs cost
  async fn send_part_split() {
    let client = get_fal_client();
    let builder = GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d3p1Part,
      provider: RouterProvider::Fal,
      input_mesh: Some(MeshRef::Url("https://example.com/model.fbx".to_string())),
      ..Default::default()
    };

    let draft_or_request = builder.build2().expect("build2 should succeed");
    let request = match draft_or_request {
      MeshGenerationDraftOrRequest::Request(r) => r,
      _ => panic!("expected Request variant (Fal mesh skips draft)"),
    };

    let response = request.send_request(&client).await.expect("send_request should succeed");
    println!("response: {:?}", response);
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
    assert_eq!(1, 2, "Inspect output above");
  }
}

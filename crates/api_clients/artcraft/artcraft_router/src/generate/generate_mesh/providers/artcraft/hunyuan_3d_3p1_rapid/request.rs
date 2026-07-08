use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_mesh_cost_and_generate_request::OmniGenMeshCostAndGenerateRequest;

use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::generate_mesh_response::GenerateMeshResponse;
use crate::generate::generate_mesh::providers::artcraft::request_common::send_artcraft_omni_mesh_request;

#[derive(Clone, Debug)]
pub struct ArtcraftHunyuan3d3p1RapidRequestState {
  pub request: OmniGenMeshCostAndGenerateRequest,
}

impl ArtcraftHunyuan3d3p1RapidRequestState {
  pub async fn send(&self, client: &RouterArtcraftClient) -> Result<GenerateMeshResponse, ArtcraftRouterError> {
    send_artcraft_omni_mesh_request(&self.request, client).await
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;
  use crate::generate::generate_mesh::generate_mesh_response::GenerateMeshResponse;
  use crate::generate::generate_mesh::mesh_generation_draft_or_request::MeshGenerationDraftOrRequest;
  use crate::test_helpers::get_artcraft_client;

  #[tokio::test]
  #[ignore] // sends a real generation to the Artcraft backend, incurs cost
  async fn text_to_mesh_teapot() {
    let response = run_pipeline(GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d3p1Rapid,
      provider: RouterProvider::Artcraft,
      prompt: Some("A red ceramic teapot with a curved spout.".to_string()),
      ..Default::default()
    }).await;
    assert!(matches!(response, GenerateMeshResponse::Artcraft(_)));
    assert_eq!(1, 2, "Inspect output above");
  }

  // ── Helpers ──

  async fn run_pipeline(builder: GenerateMeshRequestBuilder) -> GenerateMeshResponse {
    let client = get_artcraft_client();

    let draft_or_request = builder.build2().expect("build2 should succeed");
    let request = match draft_or_request {
      MeshGenerationDraftOrRequest::Request(r) => r,
      _ => panic!("expected Request variant (Artcraft skips draft)"),
    };

    let response = request.send_request(&client).await.expect("send_request should succeed");

    match &response {
      GenerateMeshResponse::Artcraft(p) => {
        println!("inference_job_token={:?}", p.inference_job_token);
        println!("all_inference_job_tokens={:?}", p.all_inference_job_tokens);
      }
      other => println!("response: {:?}", other),
    }

    response
  }
}

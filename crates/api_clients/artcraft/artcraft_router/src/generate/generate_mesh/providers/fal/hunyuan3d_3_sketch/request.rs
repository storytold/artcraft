use fal_client::requests::api::mesh::sketch::hunyuan3d_3_sketch_to_mesh::api::Hunyuan3d3SketchToMeshRequest;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::generate_mesh_response::GenerateMeshResponse;
use crate::generate::generate_mesh::providers::fal::hunyuan3d_3::request::send_fal_mesh_request;

#[derive(Clone, Debug)]
pub struct FalHunyuan3d3SketchRequestState {
  /// Final materialized request; ready to fire.
  pub request: Hunyuan3d3SketchToMeshRequest,
}

impl FalHunyuan3d3SketchRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateMeshResponse, ArtcraftRouterError> {
    send_fal_mesh_request(&self.request, client).await
  }
}

#[cfg(test)]
mod tests {
  use fal_client::creds::fal_api_key::FalApiKey;
  use test_data::web::image_urls::ERNEST_SCARED_STUPID_IMAGE_URL;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::router_client::RouterClient;
  use crate::client::router_fal_client::RouterFalClient;
  use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;
  use crate::generate::generate_mesh::mesh_generation_draft_or_request::MeshGenerationDraftOrRequest;

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_sketch_to_mesh() {
    let builder = GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d3Sketch,
      provider: RouterProvider::Fal,
      prompt: Some("A cartoon character, colorful, plastic material".to_string()),
      reference_images: Some(ImageListRef::Urls(vec![ERNEST_SCARED_STUPID_IMAGE_URL.to_string()])),
      ..Default::default()
    };

    let client = get_fal_client();
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

  // ── Helpers ──

  fn get_fal_client() -> RouterClient {
    let secret = std::fs::read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")
      .expect("Failed to read fal_api_key.txt");
    let api_key = FalApiKey::from_str(secret.trim());
    let webhook_url = "https://example.com/fal-webhook-test".to_string();
    RouterClient::Fal(RouterFalClient::new_with_webhook(api_key, webhook_url))
  }
}

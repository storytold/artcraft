use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::api::mesh::image::hunyuan3d_3_image_to_mesh::api::Hunyuan3d3ImageToMeshRequest;
use fal_client::requests::api::mesh::text::hunyuan3d_3_text_to_mesh::api::Hunyuan3d3TextToMeshRequest;
use fal_client::requests::traits::fal_endpoint_trait::FalEndpoint;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::generate_mesh_response::{
  FalMeshResponsePayload, GenerateMeshResponse,
};

#[derive(Clone, Debug)]
pub struct FalHunyuan3d3ImageRequestState {
  /// Final materialized request; ready to fire.
  pub request: Hunyuan3d3ImageToMeshRequest,
}

impl FalHunyuan3d3ImageRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateMeshResponse, ArtcraftRouterError> {
    send_fal_mesh_request(&self.request, client).await
  }
}

#[derive(Clone, Debug)]
pub struct FalHunyuan3d3TextRequestState {
  /// Final materialized request; ready to fire.
  pub request: Hunyuan3d3TextToMeshRequest,
}

impl FalHunyuan3d3TextRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateMeshResponse, ArtcraftRouterError> {
    send_fal_mesh_request(&self.request, client).await
  }
}

/// Send a mesh request to fal using the client's dispatch mode (webhook or
/// queue). Shared by all Fal mesh request states.
pub(crate) async fn send_fal_mesh_request<R>(
  request: &R,
  client: &RouterFalClient,
) -> Result<GenerateMeshResponse, ArtcraftRouterError>
where
  R: FalEndpoint + Clone + Debug + Send + Sync + 'static,
{
  let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());

  let payload = if let Some(webhook_url) = &client.webhook_url {
    let response = request.send_webhook_request(&client.api_key, webhook_url).await?;
    FalMeshResponsePayload {
      request_id: response.request_id,
      gateway_request_id: response.gateway_request_id,
      maybe_status_url: None,
      maybe_response_url: None,
      maybe_outbound_request: Some(outbound),
    }
  } else {
    let response = request.send_queue_request(&client.api_key).await?;
    FalMeshResponsePayload {
      request_id: Some(response.request_id),
      gateway_request_id: None,
      maybe_status_url: Some(response.status_url),
      maybe_response_url: Some(response.response_url),
      maybe_outbound_request: Some(outbound),
    }
  };

  Ok(GenerateMeshResponse::Fal(payload))
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
  use crate::generate::generate_mesh::generate_mesh_response::GenerateMeshResponse;
  use crate::generate::generate_mesh::mesh_generation_draft_or_request::MeshGenerationDraftOrRequest;

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_hunyuan3d_3_image_to_mesh() {
    let response = run_pipeline(GenerateMeshRequestBuilder {
      reference_images: Some(ImageListRef::Urls(vec![ERNEST_SCARED_STUPID_IMAGE_URL.to_string()])),
      ..hunyuan3d_3_builder()
    }).await;
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
    assert_eq!(1, 2, "Inspect output above");
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_hunyuan3d_3_text_to_mesh() {
    let response = run_pipeline(GenerateMeshRequestBuilder {
      prompt: Some("A velociraptor with an open mouth full of sharp teeth.".to_string()),
      ..hunyuan3d_3_builder()
    }).await;
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
    assert_eq!(1, 2, "Inspect output above");
  }

  // ── Helpers ──

  fn hunyuan3d_3_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d3,
      provider: RouterProvider::Fal,
      ..Default::default()
    }
  }

  pub(crate) fn get_fal_client() -> RouterClient {
    let secret = std::fs::read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")
      .expect("Failed to read fal_api_key.txt");
    let api_key = FalApiKey::from_str(secret.trim());
    let webhook_url = "https://example.com/fal-webhook-test".to_string();
    RouterClient::Fal(RouterFalClient::new_with_webhook(api_key, webhook_url))
  }

  pub(crate) async fn run_pipeline(builder: GenerateMeshRequestBuilder) -> GenerateMeshResponse {
    let client = get_fal_client();

    let draft_or_request = builder.build2().expect("build2 should succeed");
    let request = match draft_or_request {
      MeshGenerationDraftOrRequest::Request(r) => r,
      _ => panic!("expected Request variant (Fal mesh skips draft)"),
    };

    let response = request.send_request(&client).await.expect("send_request should succeed");
    println!("response: {:?}", response);
    response
  }
}

use fal_client::requests::api::mesh::image::hunyuan_3d_3p1_rapid_image_to_mesh::api::Hunyuan3d3p1RapidImageToMeshRequest;
use fal_client::requests::api::mesh::text::hunyuan_3d_3p1_rapid_text_to_mesh::api::Hunyuan3d3p1RapidTextToMeshRequest;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::generate_mesh_response::GenerateMeshResponse;
use crate::generate::generate_mesh::providers::fal::hunyuan3d_3::request::send_fal_mesh_request;

#[derive(Clone, Debug)]
pub struct FalHunyuan3d3p1RapidImageRequestState {
  /// Final materialized request; ready to fire.
  pub request: Hunyuan3d3p1RapidImageToMeshRequest,
}

impl FalHunyuan3d3p1RapidImageRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateMeshResponse, ArtcraftRouterError> {
    send_fal_mesh_request(&self.request, client).await
  }
}

#[derive(Clone, Debug)]
pub struct FalHunyuan3d3p1RapidTextRequestState {
  /// Final materialized request; ready to fire.
  pub request: Hunyuan3d3p1RapidTextToMeshRequest,
}

impl FalHunyuan3d3p1RapidTextRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateMeshResponse, ArtcraftRouterError> {
    send_fal_mesh_request(&self.request, client).await
  }
}

#[cfg(test)]
mod tests {
  use test_data::web::image_urls::ERNEST_SCARED_STUPID_IMAGE_URL;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;
  use crate::generate::generate_mesh::generate_mesh_response::GenerateMeshResponse;
  use crate::generate::generate_mesh::mesh_generation_draft_or_request::MeshGenerationDraftOrRequest;
  use crate::test_helpers::get_fal_client;

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_rapid_image_to_mesh() {
    let response = run_pipeline(GenerateMeshRequestBuilder {
      reference_images: Some(ImageListRef::Urls(vec![ERNEST_SCARED_STUPID_IMAGE_URL.to_string()])),
      ..rapid_builder()
    }).await;
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
    assert_eq!(1, 2, "Inspect output above");
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_rapid_text_to_mesh() {
    let response = run_pipeline(GenerateMeshRequestBuilder {
      prompt: Some("A velociraptor with an open mouth full of sharp teeth.".to_string()),
      ..rapid_builder()
    }).await;
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
    assert_eq!(1, 2, "Inspect output above");
  }

  // ── Helpers ──

  fn rapid_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d3p1Rapid,
      provider: RouterProvider::Fal,
      ..Default::default()
    }
  }

  async fn run_pipeline(builder: GenerateMeshRequestBuilder) -> GenerateMeshResponse {
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

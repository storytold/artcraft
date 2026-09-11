use crate::client::router_worldlabs_client::RouterWorldLabsClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::generate_splat_response::GenerateSplatResponse;
use crate::generate::generate_splat::providers::worldlabs::request_common::WorldLabsSplatRequest;

#[derive(Clone, Debug)]
pub struct WorldLabsMarble1p0DraftModelRequestState {
  /// Final materialized request; ready to fire. Media references (if any)
  /// have been uploaded as World Labs media assets by the draft phase.
  pub request: WorldLabsSplatRequest,
}

impl WorldLabsMarble1p0DraftModelRequestState {
  pub async fn send(&self, client: &RouterWorldLabsClient) -> Result<GenerateSplatResponse, ArtcraftRouterError> {
    self.request.send(client).await
  }
}

#[cfg(test)]
mod tests {
  use test_data::web::image_urls::MOUNTAIN_TREE_IMAGE_URL;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_splat_model::RouterSplatModel;
  use crate::client::router_client::RouterClient;
  use crate::client::router_worldlabs_client::RouterWorldLabsClient;
  use crate::generate::generate_splat::generate_splat_request_builder::GenerateSplatRequestBuilder;
  use crate::generate::generate_splat::generate_splat_response::GenerateSplatResponse;
  use crate::generate::generate_splat::splat_generation_draft_context::SplatGenerationDraftContext;
  use crate::generate::generate_splat::splat_generation_draft_or_request::SplatGenerationDraftOrRequest;

  const WORLDLABS_API_KEY_PATH: &str = "/Users/bt/Artcraft/credentials/world_labs_api_key.txt";

  #[tokio::test]
  #[ignore] // sends a real generation to World Labs, incurs cost
  async fn text_to_world() {
    let response = run_pipeline(GenerateSplatRequestBuilder {
      prompt: Some("A cozy cabin in the snowy mountains".to_string()),
      ..base_builder()
    }).await;
    let payload = response.get_worldlabs_payload().expect("expected WorldLabs payload");
    assert!(!payload.operation_id.is_empty());
    assert_eq!(1, 2, "Inspect output above");
  }

  #[tokio::test]
  #[ignore] // sends a real generation to World Labs, incurs cost; uploads media
  async fn image_to_world() {
    let response = run_pipeline(GenerateSplatRequestBuilder {
      prompt: Some("Mountain landscape with a tree".to_string()),
      reference_images: Some(ImageListRef::Urls(vec![MOUNTAIN_TREE_IMAGE_URL.to_string()])),
      ..base_builder()
    }).await;
    let payload = response.get_worldlabs_payload().expect("expected WorldLabs payload");
    assert!(!payload.operation_id.is_empty());
    assert_eq!(1, 2, "Inspect output above");
  }

  // ── Helpers ──

  fn base_builder() -> GenerateSplatRequestBuilder {
    GenerateSplatRequestBuilder {
      model: RouterSplatModel::Marble1p0Draft,
      provider: RouterProvider::WorldLabs,
      ..Default::default()
    }
  }

  fn get_worldlabs_client() -> RouterClient {
    let api_key = std::fs::read_to_string(WORLDLABS_API_KEY_PATH)
      .expect("Failed to read world_labs_api_key.txt");
    RouterClient::WorldLabs(RouterWorldLabsClient::new_from_raw_key(api_key.trim()))
  }

  async fn run_pipeline(builder: GenerateSplatRequestBuilder) -> GenerateSplatResponse {
    let client = get_worldlabs_client();

    let draft_or_request = builder.build2().expect("build2 should succeed");
    let request = match draft_or_request {
      SplatGenerationDraftOrRequest::Request(request) => request,
      SplatGenerationDraftOrRequest::Draft(draft) => {
        let draft_context = SplatGenerationDraftContext {
          client: Some(&client),
          ..Default::default()
        };
        draft.finalize(draft_context).await.expect("finalize should succeed")
      }
    };

    let response = request.send_request(&client).await.expect("send_request should succeed");

    match &response {
      GenerateSplatResponse::WorldLabs(p) => {
        println!("operation_id={}, done={}", p.operation_id, p.done);
      }
      other => println!("response: {:?}", other),
    }

    response
  }
}

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_splat_cost_and_generate_request::OmniGenSplatCostAndGenerateRequest;

use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::generate_splat_response::GenerateSplatResponse;
use crate::generate::generate_splat::providers::artcraft::request_common::send_artcraft_omni_splat_request;

#[derive(Clone, Debug)]
pub struct ArtcraftMarble1p0DraftRequestState {
  pub request: OmniGenSplatCostAndGenerateRequest,
}

impl ArtcraftMarble1p0DraftRequestState {
  pub async fn send(&self, client: &RouterArtcraftClient) -> Result<GenerateSplatResponse, ArtcraftRouterError> {
    send_artcraft_omni_splat_request(&self.request, client).await
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_splat_model::RouterSplatModel;
  use crate::generate::generate_splat::generate_splat_request_builder::GenerateSplatRequestBuilder;
  use crate::generate::generate_splat::generate_splat_response::GenerateSplatResponse;
  use crate::generate::generate_splat::splat_generation_draft_or_request::SplatGenerationDraftOrRequest;
  use crate::test_helpers::get_artcraft_client;

  #[tokio::test]
  #[ignore] // sends a real generation to the Artcraft backend, incurs cost
  async fn text_to_world() {
    let builder = GenerateSplatRequestBuilder {
      model: RouterSplatModel::Marble1p0Draft,
      provider: RouterProvider::Artcraft,
      prompt: Some("A cozy cabin in the snowy mountains".to_string()),
      ..Default::default()
    };

    let client = get_artcraft_client();
    let draft_or_request = builder.build2().expect("build2 should succeed");
    let request = match draft_or_request {
      SplatGenerationDraftOrRequest::Request(r) => r,
      _ => panic!("expected Request variant (Artcraft skips draft)"),
    };

    let response = request.send_request(&client).await.expect("send_request should succeed");

    match &response {
      GenerateSplatResponse::Artcraft(p) => {
        println!("inference_job_token={:?}", p.inference_job_token);
        println!("all_inference_job_tokens={:?}", p.all_inference_job_tokens);
      }
      other => println!("response: {:?}", other),
    }

    assert!(matches!(response, GenerateSplatResponse::Artcraft(_)));
    assert_eq!(1, 2, "Inspect output above");
  }
}

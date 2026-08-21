use fal_client::requests::api::splat::image::triposplat_image_to_splat::api::TripoSplatImageToSplatRequest;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::generate_splat_response::GenerateSplatResponse;
use crate::generate::generate_splat::providers::fal::request_common::send_fal_splat_request;

#[derive(Clone, Debug)]
pub struct FalTripoSplatRequestState {
  /// Final materialized request; ready to fire.
  pub request: TripoSplatImageToSplatRequest,
}

impl FalTripoSplatRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateSplatResponse, ArtcraftRouterError> {
    send_fal_splat_request(&self.request, client).await
  }
}

#[cfg(test)]
mod tests {
  use test_data::web::image_urls::ERNEST_SCARED_STUPID_IMAGE_URL;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_splat_model::RouterSplatModel;
  use crate::generate::generate_splat::generate_splat_request_builder::GenerateSplatRequestBuilder;
  use crate::generate::generate_splat::generate_splat_response::GenerateSplatResponse;
  use crate::generate::generate_splat::splat_generation_draft_or_request::SplatGenerationDraftOrRequest;
  use crate::test_helpers::get_fal_client;

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_triposplat_image_to_splat() {
    let client = get_fal_client();

    let builder = GenerateSplatRequestBuilder {
      model: RouterSplatModel::TripoSplat,
      provider: RouterProvider::Fal,
      reference_images: Some(ImageListRef::Urls(vec![
        ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      ])),
      ..Default::default()
    };

    let draft_or_request = builder.build2().expect("build2 should succeed");
    let request = match draft_or_request {
      SplatGenerationDraftOrRequest::Request(r) => r,
      _ => panic!("expected Request variant (Fal splat skips draft)"),
    };

    let response = request.send_request(&client).await.expect("send_request should succeed");
    println!("response: {:?}", response);

    let payload = match response {
      GenerateSplatResponse::Fal(p) => p,
      other => panic!("expected Fal payload, got {other:?}"),
    };
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
    assert_eq!(1, 2, "Inspect output above");
  }
}

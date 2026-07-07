use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_splat_cost_and_generate_request::OmniGenSplatCostAndGenerateRequest;

use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::generate_splat_response::GenerateSplatResponse;
use crate::generate::generate_splat::providers::artcraft::request_common::send_artcraft_omni_splat_request;

#[derive(Clone, Debug)]
pub struct ArtcraftMarble1p1RequestState {
  pub request: OmniGenSplatCostAndGenerateRequest,
}

impl ArtcraftMarble1p1RequestState {
  pub async fn send(&self, client: &RouterArtcraftClient) -> Result<GenerateSplatResponse, ArtcraftRouterError> {
    send_artcraft_omni_splat_request(&self.request, client).await
  }
}

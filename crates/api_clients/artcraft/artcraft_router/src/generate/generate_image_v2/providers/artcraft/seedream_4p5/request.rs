use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;

use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::generate_image_response::GenerateImageResponse;
use crate::generate::generate_image_v2::providers::artcraft::request_common::send_artcraft_omni_image_request;

#[derive(Clone, Debug)]
pub struct ArtcraftSeedream4p5RequestState {
  pub request: OmniGenImageCostAndGenerateRequest,
}

impl ArtcraftSeedream4p5RequestState {
  pub async fn send(&self, client: &RouterArtcraftClient) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    send_artcraft_omni_image_request(&self.request, client).await
  }
}

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;

use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
use crate::generate::generate_video::providers::artcraft::request_common::send_artcraft_omni_video_request;

#[derive(Clone, Debug)]
pub struct ArtcraftSeedance2p5RequestState {
  pub request: OmniGenVideoCostAndGenerateRequest,

  /// Calculation-only: total seconds of reference video input, billed on top
  /// of the output duration when reference videos are attached. Not part of
  /// the omni request wire shape.
  pub total_input_seconds: Option<u16>,
}

impl ArtcraftSeedance2p5RequestState {
  pub async fn send(&self, client: &RouterArtcraftClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    send_artcraft_omni_video_request(&self.request, client).await
  }
}

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;

use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
use crate::generate::generate_video_v2::providers::artcraft::request_common::send_artcraft_omni_video_request;

#[derive(Clone, Debug)]
pub struct ArtcraftKling3p0ProRequestState {
  pub request: OmniGenVideoCostAndGenerateRequest,
}

impl ArtcraftKling3p0ProRequestState {
  pub async fn send(&self, client: &RouterArtcraftClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    send_artcraft_omni_video_request(&self.request, client).await
  }
}

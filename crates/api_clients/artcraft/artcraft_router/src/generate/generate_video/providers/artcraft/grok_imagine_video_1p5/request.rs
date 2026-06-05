use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;

use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
use crate::generate::generate_video::providers::artcraft::request_common::send_artcraft_omni_video_request;

#[derive(Clone, Debug)]
pub struct ArtcraftGrokImagineVideo1p5RequestState {
  pub request: OmniGenVideoCostAndGenerateRequest,
}

impl ArtcraftGrokImagineVideo1p5RequestState {
  pub async fn send(&self, client: &RouterArtcraftClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    // Defense in depth: `build()` already enforces this. Bouncing here costs
    // nothing and avoids an upstream call we know will fail.
    if self.request.start_frame_image_media_token.is_none()
      && self.request.reference_image_media_tokens.as_ref().map_or(true, |v| v.is_empty())
    {
      return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "image_inputs",
        value: "text-to-video isn't supported by grok-imagine-video-1.5-preview; supply a start_frame or at least one reference image".to_string(),
      }));
    }

    send_artcraft_omni_video_request(&self.request, client).await
  }
}

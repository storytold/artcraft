use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::ready_request::KinoviSeedance2p0ReadyRequest;

#[derive(Clone, Debug)]
pub enum VideoGenerationRequest {
  KinoviSeedance2p0(KinoviSeedance2p0ReadyRequest),
}

impl VideoGenerationRequest {
  pub async fn send_request(&self, client: &RouterClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    match self {
      VideoGenerationRequest::KinoviSeedance2p0(request) => {
        let client_ref = client.get_seedance2pro_client_ref()?;
        request.send(client_ref).await
      },
    }
  }
}

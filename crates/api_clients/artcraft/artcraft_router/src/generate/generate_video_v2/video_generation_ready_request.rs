use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::ready_request::KinoviSeedance2p0ReadyRequest;

#[derive(Clone, Debug)]
pub enum VideoGenerationReadyRequest {
  KinoviSeedance2p0(KinoviSeedance2p0ReadyRequest),
}

impl VideoGenerationReadyRequest {
  pub async fn send_request(&self) -> Result<(), ArtcraftRouterError> {
    match self {
      VideoGenerationReadyRequest::KinoviSeedance2p0(request) => request.send().await,
    }
  }
}

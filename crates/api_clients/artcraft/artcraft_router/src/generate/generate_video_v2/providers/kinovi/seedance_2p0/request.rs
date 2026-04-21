use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{GenerateVideoResponse, Seedance2proVideoResponsePayload};
use seedance2pro_client::requests::generate_video::generate_video::{generate_video, GenerateVideoArgs, KinoviGenerateVideoRequest};

#[derive(Debug, Clone)]
pub struct KinoviSeedance2p0RequestState {
  /// Final materialized request; ready to fire.
  pub request: KinoviGenerateVideoRequest,
}

impl KinoviSeedance2p0RequestState {
  pub async fn send(&self, client: &RouterSeedance2ProClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let session = &client.session;

    let args = GenerateVideoArgs {
      session,
      host_override: None,
      request: self.request.clone(), // TODO: Yuck.
    };

    let response = generate_video(args)
        .await
        .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Seedance2Pro(err)))?;

    Ok(GenerateVideoResponse::Seedance2Pro(Seedance2proVideoResponsePayload {
      order_id: response.order_id,
      task_id: response.task_id,
    }))
  }
}

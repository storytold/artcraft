use kinovi_web_client::generate::video::generate_seedance_2p5::{
  generate_seedance_2p5, GenerateSeedance2p5Args, GenerateSeedance2p5Request,
};

use crate::client::router_kinovi_web_client::RouterKinoviWebClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{GenerateVideoResponse, KinoviWebVideoResponsePayload};

#[derive(Debug, Clone)]
pub struct KinoviSeedance2p5RequestState {
  /// Final materialized request; ready to fire.
  pub request: GenerateSeedance2p5Request,
}

impl KinoviSeedance2p5RequestState {
  pub async fn send(&self, client: &RouterKinoviWebClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let session = &client.session;

    let args = GenerateSeedance2p5Args {
      session,
      host_override: None,
      request: self.request.clone(),
    };

    let response = generate_seedance_2p5(args)
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::KinoviWeb(err)))?;

    Ok(GenerateVideoResponse::KinoviWeb(KinoviWebVideoResponsePayload {
      order_id: response.order_id,
      task_id: response.task_id,
      maybe_order_ids: response.order_ids,
      maybe_task_ids: response.task_ids,
    }))
  }
}

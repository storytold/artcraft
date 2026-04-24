use seedance2pro_client::generate::video::generate_happy_horse_1p0::{
  generate_happy_horse_1p0, GenerateHappyHorse1p0Args, GenerateHappyHorse1p0Request,
};

use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{GenerateVideoResponse, Seedance2proVideoResponsePayload};

#[derive(Debug, Clone)]
pub struct KinoviHappyHorse1p0RequestState {
  pub request: GenerateHappyHorse1p0Request,
}

impl KinoviHappyHorse1p0RequestState {
  pub async fn send(&self, client: &RouterSeedance2ProClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let session = &client.session;

    let args = GenerateHappyHorse1p0Args {
      session,
      host_override: None,
      request: self.request.clone(),
    };

    let response = generate_happy_horse_1p0(args)
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Seedance2Pro(err)))?;

    Ok(GenerateVideoResponse::Seedance2Pro(Seedance2proVideoResponsePayload {
      order_id: response.order_id,
      task_id: response.task_id,
      maybe_order_ids: response.order_ids,
      maybe_task_ids: response.task_ids,
    }))
  }
}

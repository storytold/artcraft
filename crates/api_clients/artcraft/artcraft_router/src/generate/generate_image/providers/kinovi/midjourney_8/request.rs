use seedance2pro_client::generate::image::generate_midjourney_v8::{
  generate_midjourney_v8, GenerateMidjourneyV8Args, GenerateMidjourneyV8Request,
};

use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  GenerateImageResponse, Seedance2proImageResponsePayload,
};

#[derive(Debug, Clone)]
pub struct KinoviMidjourney8RequestState {
  pub request: GenerateMidjourneyV8Request,
}

impl KinoviMidjourney8RequestState {
  pub async fn send(
    &self,
    client: &RouterSeedance2ProClient,
  ) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    let args = GenerateMidjourneyV8Args {
      session: &client.session,
      host_override: None,
      request: self.request.clone(),
    };

    let response = generate_midjourney_v8(args)
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Seedance2Pro(err)))?;

    Ok(GenerateImageResponse::Seedance2Pro(Seedance2proImageResponsePayload {
      order_id: response.order_id,
      task_id: response.task_id,
      maybe_order_ids: response.order_ids,
      maybe_task_ids: response.task_ids,
    }))
  }
}

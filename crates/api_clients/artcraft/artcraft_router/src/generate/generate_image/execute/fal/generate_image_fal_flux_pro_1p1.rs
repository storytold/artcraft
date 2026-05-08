use std::fmt::Debug;
use std::sync::Arc;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  FalImageResponsePayload, GenerateImageResponse,
};
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_flux_pro_1p1::PlanFalFluxPro11;
use fal_client::requests::webhook::image::text::enqueue_flux_pro_11_text_to_image_webhook::{
  enqueue_flux_pro_11_text_to_image_webhook, FluxPro11Args, FluxPro11Request,
};

pub async fn execute_fal_flux_pro_1p1(
  plan: &PlanFalFluxPro11,
  fal_client: &RouterFalClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let request = FluxPro11Request {
    prompt: plan.prompt.clone().unwrap_or_default(),
    aspect_ratio: plan.aspect_ratio,
    num_images: plan.num_images.to_fal(),
  };
  let outbound_request: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
  let args = FluxPro11Args {
    request,
    webhook_url: fal_client.webhook_url.as_str(),
    api_key: &fal_client.api_key,
  };

  let webhook_response = enqueue_flux_pro_11_text_to_image_webhook(args)
    .await
    .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

  Ok(GenerateImageResponse::Fal(FalImageResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
    maybe_outbound_request: Some(outbound_request),
  }))
}

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  FalImageResponsePayload, GenerateImageResponse,
};
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_flux_pro_1p1::PlanFalFluxPro11;
use fal_client::requests::webhook::image::text::enqueue_flux_pro_11_text_to_image_webhook::{
  enqueue_flux_pro_11_text_to_image_webhook, FluxPro11Args,
};

pub async fn execute_fal_flux_pro_1p1(
  plan: &PlanFalFluxPro11<'_>,
  fal_client: &RouterFalClient,
) -> Result<GenerateImageResponse, ArtcraftRouterError> {
  let args = FluxPro11Args {
    prompt: plan.prompt.unwrap_or(""),
    aspect_ratio: plan.aspect_ratio,
    num_images: plan.num_images.to_fal(),
    webhook_url: fal_client.webhook_url.as_str(),
    api_key: &fal_client.api_key,
  };

  let webhook_response = enqueue_flux_pro_11_text_to_image_webhook(args)
    .await
    .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

  Ok(GenerateImageResponse::Fal(FalImageResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
  }))
}

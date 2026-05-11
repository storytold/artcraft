use crate::api::provider::Provider;
use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::generate_image_response::GenerateImageResponse;
use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::nano_banana_2::cost::FalNanoBanana2CostState;
use crate::generate::generate_image_v2::providers::fal::nano_banana_2::request::FalNanoBanana2RequestState;
use crate::generate::generate_image_v2::providers::fal::nano_banana_pro::cost::FalNanoBananaProCostState;
use crate::generate::generate_image_v2::providers::fal::nano_banana_pro::request::FalNanoBananaProRequestState;

#[derive(Clone, Debug)]
pub enum ImageGenerationRequest {
  FalNanoBanana2(FalNanoBanana2RequestState),
  FalNanoBananaPro(FalNanoBananaProRequestState),
}

impl ImageGenerationRequest {
  pub fn get_provider(&self) -> Provider {
    match self {
      Self::FalNanoBanana2(_) => Provider::Fal,
      Self::FalNanoBananaPro(_) => Provider::Fal,
    }
  }

  pub fn estimate_cost(&self) -> Result<ImageGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      Self::FalNanoBanana2(request) => {
        Ok(FalNanoBanana2CostState::from_request(request).estimate_cost())
      }
      Self::FalNanoBananaPro(request) => {
        Ok(FalNanoBananaProCostState::from_request(request).estimate_cost())
      }
    }
  }

  pub async fn send_request(&self, client: &RouterClient) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    match self {
      Self::FalNanoBanana2(request) => {
        let fal_client = client.get_fal_webhook_optional_client_ref()?;
        request.send(fal_client).await
      }
      Self::FalNanoBananaPro(request) => {
        let fal_client = client.get_fal_webhook_optional_client_ref()?;
        request.send(fal_client).await
      }
    }
  }
}

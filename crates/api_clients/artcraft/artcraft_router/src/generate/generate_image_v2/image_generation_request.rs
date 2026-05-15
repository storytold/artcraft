use crate::api::provider::Provider;
use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::generate_image_response::GenerateImageResponse;
use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::flux_1_dev::cost::FalFlux1DevCostState;
use crate::generate::generate_image_v2::providers::fal::flux_1_dev::request::FalFlux1DevRequestState;
use crate::generate::generate_image_v2::providers::fal::flux_1_schnell::cost::FalFlux1SchnellCostState;
use crate::generate::generate_image_v2::providers::fal::flux_1_schnell::request::FalFlux1SchnellRequestState;
use crate::generate::generate_image_v2::providers::fal::gpt_image_1::cost::FalGptImage1CostState;
use crate::generate::generate_image_v2::providers::fal::gpt_image_1::request::FalGptImage1RequestState;
use crate::generate::generate_image_v2::providers::fal::gpt_image_1p5::cost::FalGptImage1p5CostState;
use crate::generate::generate_image_v2::providers::fal::gpt_image_1p5::request::FalGptImage1p5RequestState;
use crate::generate::generate_image_v2::providers::fal::gpt_image_2::cost::FalGptImage2CostState;
use crate::generate::generate_image_v2::providers::fal::gpt_image_2::request::FalGptImage2RequestState;
use crate::generate::generate_image_v2::providers::fal::nano_banana_2::cost::FalNanoBanana2CostState;
use crate::generate::generate_image_v2::providers::fal::nano_banana_2::request::FalNanoBanana2RequestState;
use crate::generate::generate_image_v2::providers::fal::nano_banana_pro::cost::FalNanoBananaProCostState;
use crate::generate::generate_image_v2::providers::fal::nano_banana_pro::request::FalNanoBananaProRequestState;

#[derive(Clone, Debug)]
pub enum ImageGenerationRequest {
  FalFlux1Dev(FalFlux1DevRequestState),
  FalFlux1Schnell(FalFlux1SchnellRequestState),
  FalGptImage1(FalGptImage1RequestState),
  FalGptImage1p5(FalGptImage1p5RequestState),
  FalGptImage2(FalGptImage2RequestState),
  FalNanoBanana2(FalNanoBanana2RequestState),
  FalNanoBananaPro(FalNanoBananaProRequestState),
}

impl ImageGenerationRequest {
  pub fn get_provider(&self) -> Provider {
    match self {
      Self::FalFlux1Dev(_) => Provider::Fal,
      Self::FalFlux1Schnell(_) => Provider::Fal,
      Self::FalGptImage1(_) => Provider::Fal,
      Self::FalGptImage1p5(_) => Provider::Fal,
      Self::FalGptImage2(_) => Provider::Fal,
      Self::FalNanoBanana2(_) => Provider::Fal,
      Self::FalNanoBananaPro(_) => Provider::Fal,
    }
  }

  pub fn estimate_cost(&self) -> Result<ImageGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      Self::FalFlux1Dev(request) => {
        Ok(FalFlux1DevCostState::from_request(request).estimate_cost())
      }
      Self::FalFlux1Schnell(request) => {
        Ok(FalFlux1SchnellCostState::from_request(request).estimate_cost())
      }
      Self::FalGptImage1(request) => {
        Ok(FalGptImage1CostState::from_request(request).estimate_cost())
      }
      Self::FalGptImage1p5(request) => {
        Ok(FalGptImage1p5CostState::from_request(request).estimate_cost())
      }
      Self::FalGptImage2(request) => {
        Ok(FalGptImage2CostState::from_request(request).estimate_cost())
      }
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
      Self::FalFlux1Dev(request) => {
        let fal_client = client.get_fal_webhook_optional_client_ref()?;
        request.send(fal_client).await
      }
      Self::FalFlux1Schnell(request) => {
        let fal_client = client.get_fal_webhook_optional_client_ref()?;
        request.send(fal_client).await
      }
      Self::FalGptImage1(request) => {
        let fal_client = client.get_fal_webhook_optional_client_ref()?;
        request.send(fal_client).await
      }
      Self::FalGptImage1p5(request) => {
        let fal_client = client.get_fal_webhook_optional_client_ref()?;
        request.send(fal_client).await
      }
      Self::FalGptImage2(request) => {
        let fal_client = client.get_fal_webhook_optional_client_ref()?;
        request.send(fal_client).await
      }
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

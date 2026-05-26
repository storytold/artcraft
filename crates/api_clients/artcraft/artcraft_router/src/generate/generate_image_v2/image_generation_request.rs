use crate::api::provider::Provider;
use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::generate_image_response::GenerateImageResponse;
use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::flux_1_dev::cost::FalFlux1DevCostState;
use crate::generate::generate_image_v2::providers::fal::flux_1_dev::request::FalFlux1DevRequestState;
use crate::generate::generate_image_v2::providers::fal::flux_1_schnell::cost::FalFlux1SchnellCostState;
use crate::generate::generate_image_v2::providers::fal::flux_1_schnell::request::FalFlux1SchnellRequestState;
use crate::generate::generate_image_v2::providers::fal::flux_pro_1p1::cost::FalFluxPro1p1CostState;
use crate::generate::generate_image_v2::providers::fal::flux_pro_1p1::request::FalFluxPro1p1RequestState;
use crate::generate::generate_image_v2::providers::fal::flux_pro_1p1_ultra::cost::FalFluxPro1p1UltraCostState;
use crate::generate::generate_image_v2::providers::fal::flux_pro_1p1_ultra::request::FalFluxPro1p1UltraRequestState;
use crate::generate::generate_image_v2::providers::fal::gpt_image_1::cost::FalGptImage1CostState;
use crate::generate::generate_image_v2::providers::fal::gpt_image_1::request::FalGptImage1RequestState;
use crate::generate::generate_image_v2::providers::fal::gpt_image_1p5::cost::FalGptImage1p5CostState;
use crate::generate::generate_image_v2::providers::fal::gpt_image_1p5::request::FalGptImage1p5RequestState;
use crate::generate::generate_image_v2::providers::fal::gpt_image_2::cost::FalGptImage2CostState;
use crate::generate::generate_image_v2::providers::fal::gpt_image_2::request::FalGptImage2RequestState;
use crate::generate::generate_image_v2::providers::fal::nano_banana::cost::FalNanoBananaCostState;
use crate::generate::generate_image_v2::providers::fal::nano_banana::request::FalNanoBananaRequestState;
use crate::generate::generate_image_v2::providers::fal::nano_banana_2::cost::FalNanoBanana2CostState;
use crate::generate::generate_image_v2::providers::fal::nano_banana_2::request::FalNanoBanana2RequestState;
use crate::generate::generate_image_v2::providers::fal::nano_banana_pro::cost::FalNanoBananaProCostState;
use crate::generate::generate_image_v2::providers::fal::nano_banana_pro::request::FalNanoBananaProRequestState;
use crate::generate::generate_image_v2::providers::fal::seedream_4::cost::FalSeedream4CostState;
use crate::generate::generate_image_v2::providers::fal::seedream_4::request::FalSeedream4RequestState;
use crate::generate::generate_image_v2::providers::fal::seedream_4p5::cost::FalSeedream4p5CostState;
use crate::generate::generate_image_v2::providers::fal::seedream_4p5::request::FalSeedream4p5RequestState;
use crate::generate::generate_image_v2::providers::fal::seedream_5_lite::cost::FalSeedream5LiteCostState;
use crate::generate::generate_image_v2::providers::fal::seedream_5_lite::request::FalSeedream5LiteRequestState;

#[derive(Clone, Debug)]
pub enum ImageGenerationRequest {
  FalFlux1Dev(FalFlux1DevRequestState),
  FalFlux1Schnell(FalFlux1SchnellRequestState),
  FalFluxPro1p1(FalFluxPro1p1RequestState),
  FalFluxPro1p1Ultra(FalFluxPro1p1UltraRequestState),
  FalGptImage1(FalGptImage1RequestState),
  FalGptImage1p5(FalGptImage1p5RequestState),
  FalGptImage2(FalGptImage2RequestState),
  FalNanoBanana(FalNanoBananaRequestState),
  FalNanoBanana2(FalNanoBanana2RequestState),
  FalNanoBananaPro(FalNanoBananaProRequestState),
  FalSeedream4(FalSeedream4RequestState),
  FalSeedream4p5(FalSeedream4p5RequestState),
  FalSeedream5Lite(FalSeedream5LiteRequestState),
}

impl ImageGenerationRequest {
  pub fn get_provider(&self) -> Provider {
    match self {
      Self::FalFlux1Dev(_) => Provider::Fal,
      Self::FalFlux1Schnell(_) => Provider::Fal,
      Self::FalFluxPro1p1(_) => Provider::Fal,
      Self::FalFluxPro1p1Ultra(_) => Provider::Fal,
      Self::FalGptImage1(_) => Provider::Fal,
      Self::FalGptImage1p5(_) => Provider::Fal,
      Self::FalGptImage2(_) => Provider::Fal,
      Self::FalNanoBanana(_) => Provider::Fal,
      Self::FalNanoBanana2(_) => Provider::Fal,
      Self::FalNanoBananaPro(_) => Provider::Fal,
      Self::FalSeedream4(_) => Provider::Fal,
      Self::FalSeedream4p5(_) => Provider::Fal,
      Self::FalSeedream5Lite(_) => Provider::Fal,
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
      Self::FalFluxPro1p1(request) => {
        Ok(FalFluxPro1p1CostState::from_request(request).estimate_cost())
      }
      Self::FalFluxPro1p1Ultra(request) => {
        Ok(FalFluxPro1p1UltraCostState::from_request(request).estimate_cost())
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
      Self::FalNanoBanana(request) => {
        Ok(FalNanoBananaCostState::from_request(request).estimate_cost())
      }
      Self::FalNanoBanana2(request) => {
        Ok(FalNanoBanana2CostState::from_request(request).estimate_cost())
      }
      Self::FalNanoBananaPro(request) => {
        Ok(FalNanoBananaProCostState::from_request(request).estimate_cost())
      }
      Self::FalSeedream4(request) => {
        Ok(FalSeedream4CostState::from_request(request).estimate_cost())
      }
      Self::FalSeedream4p5(request) => {
        Ok(FalSeedream4p5CostState::from_request(request).estimate_cost())
      }
      Self::FalSeedream5Lite(request) => {
        Ok(FalSeedream5LiteCostState::from_request(request).estimate_cost())
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
      Self::FalFluxPro1p1(request) => {
        // Flux Pro 1.1 is webhook-required — uses the webhook-only RouterFalClient.
        let fal_client = client.get_fal_client_ref()?;
        request.send(fal_client).await
      }
      Self::FalFluxPro1p1Ultra(request) => {
        let fal_client = client.get_fal_client_ref()?;
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
      Self::FalNanoBanana(request) => {
        // nano_banana (Gemini 2.5 Flash) is webhook-required.
        let fal_client = client.get_fal_client_ref()?;
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
      Self::FalSeedream4(request) => {
        // Seedream v4 is webhook-required.
        let fal_client = client.get_fal_client_ref()?;
        request.send(fal_client).await
      }
      Self::FalSeedream4p5(request) => {
        let fal_client = client.get_fal_client_ref()?;
        request.send(fal_client).await
      }
      Self::FalSeedream5Lite(request) => {
        let fal_client = client.get_fal_client_ref()?;
        request.send(fal_client).await
      }
    }
  }
}

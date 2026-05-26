use crate::api::provider::Provider;
use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::generate_image_response::GenerateImageResponse;
use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::artcraft::flux_1_dev::cost::ArtcraftFlux1DevCostState;
use crate::generate::generate_image_v2::providers::artcraft::flux_1_dev::request::ArtcraftFlux1DevRequestState;
use crate::generate::generate_image_v2::providers::artcraft::flux_1_schnell::cost::ArtcraftFlux1SchnellCostState;
use crate::generate::generate_image_v2::providers::artcraft::flux_1_schnell::request::ArtcraftFlux1SchnellRequestState;
use crate::generate::generate_image_v2::providers::artcraft::flux_2_lora_angles::cost::ArtcraftFlux2LoraAnglesCostState;
use crate::generate::generate_image_v2::providers::artcraft::flux_2_lora_angles::request::ArtcraftFlux2LoraAnglesRequestState;
use crate::generate::generate_image_v2::providers::artcraft::flux_pro_1p1::cost::ArtcraftFluxPro1p1CostState;
use crate::generate::generate_image_v2::providers::artcraft::flux_pro_1p1::request::ArtcraftFluxPro1p1RequestState;
use crate::generate::generate_image_v2::providers::artcraft::flux_pro_1p1_ultra::cost::ArtcraftFluxPro1p1UltraCostState;
use crate::generate::generate_image_v2::providers::artcraft::flux_pro_1p1_ultra::request::ArtcraftFluxPro1p1UltraRequestState;
use crate::generate::generate_image_v2::providers::artcraft::gpt_image_1::cost::ArtcraftGptImage1CostState;
use crate::generate::generate_image_v2::providers::artcraft::gpt_image_1::request::ArtcraftGptImage1RequestState;
use crate::generate::generate_image_v2::providers::artcraft::gpt_image_1p5::cost::ArtcraftGptImage1p5CostState;
use crate::generate::generate_image_v2::providers::artcraft::gpt_image_1p5::request::ArtcraftGptImage1p5RequestState;
use crate::generate::generate_image_v2::providers::artcraft::gpt_image_2::cost::ArtcraftGptImage2CostState;
use crate::generate::generate_image_v2::providers::artcraft::gpt_image_2::request::ArtcraftGptImage2RequestState;
use crate::generate::generate_image_v2::providers::artcraft::nano_banana::cost::ArtcraftNanoBananaCostState;
use crate::generate::generate_image_v2::providers::artcraft::nano_banana::request::ArtcraftNanoBananaRequestState;
use crate::generate::generate_image_v2::providers::artcraft::nano_banana_2::cost::ArtcraftNanoBanana2CostState;
use crate::generate::generate_image_v2::providers::artcraft::nano_banana_2::request::ArtcraftNanoBanana2RequestState;
use crate::generate::generate_image_v2::providers::artcraft::nano_banana_pro::cost::ArtcraftNanoBananaProCostState;
use crate::generate::generate_image_v2::providers::artcraft::nano_banana_pro::request::ArtcraftNanoBananaProRequestState;
use crate::generate::generate_image_v2::providers::artcraft::qwen_edit_2511_angles::cost::ArtcraftQwenEdit2511AnglesCostState;
use crate::generate::generate_image_v2::providers::artcraft::qwen_edit_2511_angles::request::ArtcraftQwenEdit2511AnglesRequestState;
use crate::generate::generate_image_v2::providers::artcraft::seedream_4::cost::ArtcraftSeedream4CostState;
use crate::generate::generate_image_v2::providers::artcraft::seedream_4::request::ArtcraftSeedream4RequestState;
use crate::generate::generate_image_v2::providers::artcraft::seedream_4p5::cost::ArtcraftSeedream4p5CostState;
use crate::generate::generate_image_v2::providers::artcraft::seedream_4p5::request::ArtcraftSeedream4p5RequestState;
use crate::generate::generate_image_v2::providers::artcraft::seedream_5_lite::cost::ArtcraftSeedream5LiteCostState;
use crate::generate::generate_image_v2::providers::artcraft::seedream_5_lite::request::ArtcraftSeedream5LiteRequestState;
use crate::generate::generate_image_v2::providers::fal::flux_1_dev::cost::FalFlux1DevCostState;
use crate::generate::generate_image_v2::providers::fal::flux_1_dev::request::FalFlux1DevRequestState;
use crate::generate::generate_image_v2::providers::fal::flux_1_schnell::cost::FalFlux1SchnellCostState;
use crate::generate::generate_image_v2::providers::fal::flux_1_schnell::request::FalFlux1SchnellRequestState;
use crate::generate::generate_image_v2::providers::fal::flux_2_lora_angles::cost::FalFlux2LoraAnglesCostState;
use crate::generate::generate_image_v2::providers::fal::flux_2_lora_angles::request::FalFlux2LoraAnglesRequestState;
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
use crate::generate::generate_image_v2::providers::fal::qwen_edit_2511_angles::cost::FalQwenEdit2511AnglesCostState;
use crate::generate::generate_image_v2::providers::fal::qwen_edit_2511_angles::request::FalQwenEdit2511AnglesRequestState;
use crate::generate::generate_image_v2::providers::fal::seedream_4::cost::FalSeedream4CostState;
use crate::generate::generate_image_v2::providers::fal::seedream_4::request::FalSeedream4RequestState;
use crate::generate::generate_image_v2::providers::fal::seedream_4p5::cost::FalSeedream4p5CostState;
use crate::generate::generate_image_v2::providers::fal::seedream_4p5::request::FalSeedream4p5RequestState;
use crate::generate::generate_image_v2::providers::fal::seedream_5_lite::cost::FalSeedream5LiteCostState;
use crate::generate::generate_image_v2::providers::fal::seedream_5_lite::request::FalSeedream5LiteRequestState;

#[derive(Clone, Debug)]
pub enum ImageGenerationRequest {
  // ── Artcraft provider (omni-gen image endpoint) ──
  ArtcraftFlux1Dev(ArtcraftFlux1DevRequestState),
  ArtcraftFlux1Schnell(ArtcraftFlux1SchnellRequestState),
  ArtcraftFluxPro1p1(ArtcraftFluxPro1p1RequestState),
  ArtcraftFluxPro1p1Ultra(ArtcraftFluxPro1p1UltraRequestState),
  ArtcraftGptImage1(ArtcraftGptImage1RequestState),
  ArtcraftGptImage1p5(ArtcraftGptImage1p5RequestState),
  ArtcraftGptImage2(ArtcraftGptImage2RequestState),
  ArtcraftNanoBanana(ArtcraftNanoBananaRequestState),
  ArtcraftNanoBanana2(ArtcraftNanoBanana2RequestState),
  ArtcraftNanoBananaPro(ArtcraftNanoBananaProRequestState),
  ArtcraftSeedream4(ArtcraftSeedream4RequestState),
  ArtcraftSeedream4p5(ArtcraftSeedream4p5RequestState),
  ArtcraftSeedream5Lite(ArtcraftSeedream5LiteRequestState),
  ArtcraftQwenEdit2511Angles(ArtcraftQwenEdit2511AnglesRequestState),
  ArtcraftFlux2LoraAngles(ArtcraftFlux2LoraAnglesRequestState),

  // ── Fal provider ──
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
  FalQwenEdit2511Angles(FalQwenEdit2511AnglesRequestState),
  FalFlux2LoraAngles(FalFlux2LoraAnglesRequestState),
}

impl ImageGenerationRequest {
  pub fn get_provider(&self) -> Provider {
    match self {
      Self::ArtcraftFlux1Dev(_) => Provider::Artcraft,
      Self::ArtcraftFlux1Schnell(_) => Provider::Artcraft,
      Self::ArtcraftFluxPro1p1(_) => Provider::Artcraft,
      Self::ArtcraftFluxPro1p1Ultra(_) => Provider::Artcraft,
      Self::ArtcraftGptImage1(_) => Provider::Artcraft,
      Self::ArtcraftGptImage1p5(_) => Provider::Artcraft,
      Self::ArtcraftGptImage2(_) => Provider::Artcraft,
      Self::ArtcraftNanoBanana(_) => Provider::Artcraft,
      Self::ArtcraftNanoBanana2(_) => Provider::Artcraft,
      Self::ArtcraftNanoBananaPro(_) => Provider::Artcraft,
      Self::ArtcraftSeedream4(_) => Provider::Artcraft,
      Self::ArtcraftSeedream4p5(_) => Provider::Artcraft,
      Self::ArtcraftSeedream5Lite(_) => Provider::Artcraft,
      Self::ArtcraftQwenEdit2511Angles(_) => Provider::Artcraft,
      Self::ArtcraftFlux2LoraAngles(_) => Provider::Artcraft,

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
      Self::FalQwenEdit2511Angles(_) => Provider::Fal,
      Self::FalFlux2LoraAngles(_) => Provider::Fal,
    }
  }

  pub fn estimate_cost(&self) -> Result<ImageGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      // ── Artcraft ──
      Self::ArtcraftFlux1Dev(request) => {
        Ok(ArtcraftFlux1DevCostState::from_request(request).estimate_cost())
      }
      Self::ArtcraftFlux1Schnell(request) => {
        Ok(ArtcraftFlux1SchnellCostState::from_request(request).estimate_cost())
      }
      Self::ArtcraftFluxPro1p1(request) => {
        Ok(ArtcraftFluxPro1p1CostState::from_request(request).estimate_cost())
      }
      Self::ArtcraftFluxPro1p1Ultra(request) => {
        Ok(ArtcraftFluxPro1p1UltraCostState::from_request(request).estimate_cost())
      }
      Self::ArtcraftGptImage1(request) => {
        Ok(ArtcraftGptImage1CostState::from_request(request).estimate_cost())
      }
      Self::ArtcraftGptImage1p5(request) => {
        Ok(ArtcraftGptImage1p5CostState::from_request(request).estimate_cost())
      }
      Self::ArtcraftGptImage2(request) => {
        Ok(ArtcraftGptImage2CostState::from_request(request).estimate_cost())
      }
      Self::ArtcraftNanoBanana(request) => {
        Ok(ArtcraftNanoBananaCostState::from_request(request).estimate_cost())
      }
      Self::ArtcraftNanoBanana2(request) => {
        Ok(ArtcraftNanoBanana2CostState::from_request(request).estimate_cost())
      }
      Self::ArtcraftNanoBananaPro(request) => {
        Ok(ArtcraftNanoBananaProCostState::from_request(request).estimate_cost())
      }
      Self::ArtcraftSeedream4(request) => {
        Ok(ArtcraftSeedream4CostState::from_request(request).estimate_cost())
      }
      Self::ArtcraftSeedream4p5(request) => {
        Ok(ArtcraftSeedream4p5CostState::from_request(request).estimate_cost())
      }
      Self::ArtcraftSeedream5Lite(request) => {
        Ok(ArtcraftSeedream5LiteCostState::from_request(request).estimate_cost())
      }
      Self::ArtcraftQwenEdit2511Angles(request) => {
        Ok(ArtcraftQwenEdit2511AnglesCostState::from_request(request).estimate_cost())
      }
      Self::ArtcraftFlux2LoraAngles(request) => {
        Ok(ArtcraftFlux2LoraAnglesCostState::from_request(request).estimate_cost())
      }

      // ── Fal ──
      Self::FalFlux1Dev(request) => Ok(FalFlux1DevCostState::from_request(request).estimate_cost()),
      Self::FalFlux1Schnell(request) => Ok(FalFlux1SchnellCostState::from_request(request).estimate_cost()),
      Self::FalFluxPro1p1(request) => Ok(FalFluxPro1p1CostState::from_request(request).estimate_cost()),
      Self::FalFluxPro1p1Ultra(request) => Ok(FalFluxPro1p1UltraCostState::from_request(request).estimate_cost()),
      Self::FalGptImage1(request) => Ok(FalGptImage1CostState::from_request(request).estimate_cost()),
      Self::FalGptImage1p5(request) => Ok(FalGptImage1p5CostState::from_request(request).estimate_cost()),
      Self::FalGptImage2(request) => Ok(FalGptImage2CostState::from_request(request).estimate_cost()),
      Self::FalNanoBanana(request) => Ok(FalNanoBananaCostState::from_request(request).estimate_cost()),
      Self::FalNanoBanana2(request) => Ok(FalNanoBanana2CostState::from_request(request).estimate_cost()),
      Self::FalNanoBananaPro(request) => Ok(FalNanoBananaProCostState::from_request(request).estimate_cost()),
      Self::FalSeedream4(request) => Ok(FalSeedream4CostState::from_request(request).estimate_cost()),
      Self::FalSeedream4p5(request) => Ok(FalSeedream4p5CostState::from_request(request).estimate_cost()),
      Self::FalSeedream5Lite(request) => Ok(FalSeedream5LiteCostState::from_request(request).estimate_cost()),
      Self::FalQwenEdit2511Angles(request) => Ok(FalQwenEdit2511AnglesCostState::from_request(request).estimate_cost()),
      Self::FalFlux2LoraAngles(request) => Ok(FalFlux2LoraAnglesCostState::from_request(request).estimate_cost()),
    }
  }

  pub async fn send_request(&self, client: &RouterClient) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    match self {
      // ── Artcraft (omni-gen image endpoint) ──
      Self::ArtcraftFlux1Dev(request) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        request.send(artcraft_client).await
      }
      Self::ArtcraftFlux1Schnell(request) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        request.send(artcraft_client).await
      }
      Self::ArtcraftFluxPro1p1(request) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        request.send(artcraft_client).await
      }
      Self::ArtcraftFluxPro1p1Ultra(request) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        request.send(artcraft_client).await
      }
      Self::ArtcraftGptImage1(request) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        request.send(artcraft_client).await
      }
      Self::ArtcraftGptImage1p5(request) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        request.send(artcraft_client).await
      }
      Self::ArtcraftGptImage2(request) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        request.send(artcraft_client).await
      }
      Self::ArtcraftNanoBanana(request) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        request.send(artcraft_client).await
      }
      Self::ArtcraftNanoBanana2(request) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        request.send(artcraft_client).await
      }
      Self::ArtcraftNanoBananaPro(request) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        request.send(artcraft_client).await
      }
      Self::ArtcraftSeedream4(request) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        request.send(artcraft_client).await
      }
      Self::ArtcraftSeedream4p5(request) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        request.send(artcraft_client).await
      }
      Self::ArtcraftSeedream5Lite(request) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        request.send(artcraft_client).await
      }
      Self::ArtcraftQwenEdit2511Angles(request) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        request.send(artcraft_client).await
      }
      Self::ArtcraftFlux2LoraAngles(request) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        request.send(artcraft_client).await
      }

      // ── Fal ──
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
      Self::FalQwenEdit2511Angles(request) => {
        // Webhook-required endpoint.
        let fal_client = client.get_fal_client_ref()?;
        request.send(fal_client).await
      }
      Self::FalFlux2LoraAngles(request) => {
        // Webhook-required endpoint.
        let fal_client = client.get_fal_client_ref()?;
        request.send(fal_client).await
      }
    }
  }
}

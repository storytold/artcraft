use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_flux_1_dev::estimate_image_cost_artcraft_flux_1_dev;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_flux_1_schnell::estimate_image_cost_artcraft_flux_1_schnell;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_flux_pro_1p1::estimate_image_cost_artcraft_flux_pro_1p1;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_flux_pro_1p1_ultra::estimate_image_cost_artcraft_flux_pro_1p1_ultra;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_gpt_image_1::estimate_image_cost_artcraft_gpt_image_1;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_gpt_image_1p5::estimate_image_cost_artcraft_gpt_image_1p5;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_gpt_image_2::estimate_image_cost_artcraft_gpt_image_2;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_nano_banana::estimate_image_cost_artcraft_nano_banana;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_nano_banana_2::estimate_image_cost_artcraft_nano_banana_2;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_nano_banana_pro::estimate_image_cost_artcraft_nano_banana_pro;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_seedream_4::estimate_image_cost_artcraft_seedream_4;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_seedream_4p5::estimate_image_cost_artcraft_seedream_4p5;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_seedream_5_lite::estimate_image_cost_artcraft_seedream_5_lite;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_qwen_edit_2511_angles::estimate_image_cost_artcraft_qwen_edit_2511_angles;
use crate::generate::generate_image::cost::artcraft::estimate_image_cost_artcraft_flux_2_lora_angles::estimate_image_cost_artcraft_flux_2_lora_angles;
use crate::generate::generate_image::cost::fal::estimate_image_cost_fal_flux_1_dev::estimate_image_cost_fal_flux_1_dev;
use crate::generate::generate_image::cost::fal::estimate_image_cost_fal_flux_1_schnell::estimate_image_cost_fal_flux_1_schnell;
use crate::generate::generate_image::cost::fal::estimate_image_cost_fal_flux_pro_1p1::estimate_image_cost_fal_flux_pro_1p1;
use crate::generate::generate_image::cost::fal::estimate_image_cost_fal_flux_pro_1p1_ultra::estimate_image_cost_fal_flux_pro_1p1_ultra;
use crate::generate::generate_image::cost::fal::estimate_image_cost_fal_gpt_image_1::estimate_image_cost_fal_gpt_image_1;
use crate::generate::generate_image::cost::fal::estimate_image_cost_fal_gpt_image_1p5::estimate_image_cost_fal_gpt_image_1p5;
use crate::generate::generate_image::cost::fal::estimate_image_cost_fal_gpt_image_2::estimate_image_cost_fal_gpt_image_2;
use crate::generate::generate_image::cost::fal::estimate_image_cost_fal_seedream_4::estimate_image_cost_fal_seedream_4;
use crate::generate::generate_image::cost::fal::estimate_image_cost_fal_seedream_4p5::estimate_image_cost_fal_seedream_4p5;
use crate::generate::generate_image::cost::fal::estimate_image_cost_fal_seedream_5_lite::estimate_image_cost_fal_seedream_5_lite;
use crate::generate::generate_image::cost::fal::estimate_image_cost_fal_nano_banana::estimate_image_cost_fal_nano_banana;
use crate::generate::generate_image::cost::fal::estimate_image_cost_fal_nano_banana_2::estimate_image_cost_fal_nano_banana_2;
use crate::generate::generate_image::cost::fal::estimate_image_cost_fal_nano_banana_pro::estimate_image_cost_fal_nano_banana_pro;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_flux_1_dev::execute_artcraft_flux_1_dev;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_flux_1_schnell::execute_artcraft_flux_1_schnell;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_flux_pro_1p1::execute_artcraft_flux_pro_1p1;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_flux_pro_1p1_ultra::execute_artcraft_flux_pro_1p1_ultra;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_gpt_image_1::execute_artcraft_gpt_image_1;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_gpt_image_1p5::execute_artcraft_gpt_image_1p5;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_gpt_image_2::execute_artcraft_gpt_image_2;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_nano_banana::execute_artcraft_nano_banana;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_nano_banana_2::execute_artcraft_nano_banana_2;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_nano_banana_pro::execute_artcraft_nano_banana_pro;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_seedream_4::execute_artcraft_seedream_4;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_seedream_4p5::execute_artcraft_seedream_4p5;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_seedream_5_lite::execute_artcraft_seedream_5_lite;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_qwen_edit_2511_angles::execute_artcraft_qwen_edit_2511_angles;
use crate::generate::generate_image::execute::artcraft::generate_image_artcraft_flux_2_lora_angles::execute_artcraft_flux_2_lora_angles;
use crate::generate::generate_image::execute::fal::generate_image_fal_flux_1_dev::execute_fal_flux_1_dev;
use crate::generate::generate_image::execute::fal::generate_image_fal_flux_1_schnell::execute_fal_flux_1_schnell;
use crate::generate::generate_image::execute::fal::generate_image_fal_flux_pro_1p1::execute_fal_flux_pro_1p1;
use crate::generate::generate_image::execute::fal::generate_image_fal_flux_pro_1p1_ultra::execute_fal_flux_pro_1p1_ultra;
use crate::generate::generate_image::execute::fal::generate_image_fal_gpt_image_1::execute_fal_gpt_image_1;
use crate::generate::generate_image::execute::fal::generate_image_fal_gpt_image_1p5::execute_fal_gpt_image_1p5;
use crate::generate::generate_image::execute::fal::generate_image_fal_gpt_image_2::execute_fal_gpt_image_2;
use crate::generate::generate_image::execute::fal::generate_image_fal_seedream_4::execute_fal_seedream_4;
use crate::generate::generate_image::execute::fal::generate_image_fal_seedream_4p5::execute_fal_seedream_4p5;
use crate::generate::generate_image::execute::fal::generate_image_fal_seedream_5_lite::execute_fal_seedream_5_lite;
use crate::generate::generate_image::execute::fal::generate_image_fal_nano_banana::execute_fal_nano_banana;
use crate::generate::generate_image::execute::fal::generate_image_fal_nano_banana_2::execute_fal_nano_banana_2;
use crate::generate::generate_image::execute::fal::generate_image_fal_nano_banana_pro::execute_fal_nano_banana_pro;
use crate::generate::generate_image::generate_image_response::GenerateImageResponse;
use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_flux_1_dev::PlanArtcraftFlux1Dev;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_flux_1_schnell::PlanArtcraftFlux1Schnell;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_flux_pro_1p1::PlanArtcraftFluxPro11;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_flux_pro_1p1_ultra::PlanArtcraftFluxPro11Ultra;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_gpt_image_1::PlanArtcraftGptImage1;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_gpt_image_1p5::PlanArtcraftGptImage1p5;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_gpt_image_2::PlanArtcraftGptImage2;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_nano_banana::PlanArtcraftNanaBanana;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_nano_banana_2::PlanArtcraftNanaBanana2;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_nano_banana_pro::PlanArtcraftNanaBananaPro;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_seedream_4::PlanArtcraftSeedream4;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_seedream_4p5::PlanArtcraftSeedream4p5;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_seedream_5_lite::PlanArtcraftSeedream5Lite;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_qwen_edit_2511_angles::PlanArtcraftQwenEdit2511Angles;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_flux_2_lora_angles::PlanArtcraftFlux2LoraAngles;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_flux_1_dev::PlanFalFlux1Dev;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_flux_1_schnell::PlanFalFlux1Schnell;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_flux_pro_1p1::PlanFalFluxPro11;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_flux_pro_1p1_ultra::PlanFalFluxPro11Ultra;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_gpt_image_1::PlanFalGptImage1;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_gpt_image_1p5::PlanFalGptImage1p5;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_gpt_image_2::PlanFalGptImage2;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_seedream_4::PlanFalSeedream4;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_seedream_4p5::PlanFalSeedream4p5;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_seedream_5_lite::PlanFalSeedream5Lite;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_nano_banana::PlanFalNanoBanana;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_nano_banana_2::PlanFalNanaBanana2;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_nano_banana_pro::PlanFalNanaBananaPro;

#[derive(Debug)]
pub enum ImageGenerationPlan {
  ArtcraftFlux1Dev(PlanArtcraftFlux1Dev),
  ArtcraftFlux1Schnell(PlanArtcraftFlux1Schnell),
  ArtcraftFluxPro11(PlanArtcraftFluxPro11),
  ArtcraftFluxPro11Ultra(PlanArtcraftFluxPro11Ultra),
  ArtcraftGptImage1(PlanArtcraftGptImage1),
  ArtcraftGptImage1p5(PlanArtcraftGptImage1p5),
  ArtcraftGptImage2(PlanArtcraftGptImage2),
  ArtcraftNanaBanana(PlanArtcraftNanaBanana),
  ArtcraftNanaBanana2(PlanArtcraftNanaBanana2),
  ArtcraftNanaBananaPro(PlanArtcraftNanaBananaPro),
  ArtcraftSeedream4(PlanArtcraftSeedream4),
  ArtcraftSeedream4p5(PlanArtcraftSeedream4p5),
  ArtcraftSeedream5Lite(PlanArtcraftSeedream5Lite),
  ArtcraftQwenEdit2511Angles(PlanArtcraftQwenEdit2511Angles),
  ArtcraftFlux2LoraAngles(PlanArtcraftFlux2LoraAngles),
  FalFlux1Dev(PlanFalFlux1Dev),
  FalFlux1Schnell(PlanFalFlux1Schnell),
  FalFluxPro11(PlanFalFluxPro11),
  FalFluxPro11Ultra(PlanFalFluxPro11Ultra),
  FalGptImage1(PlanFalGptImage1),
  FalGptImage1p5(PlanFalGptImage1p5),
  FalGptImage2(PlanFalGptImage2),
  FalSeedream4(PlanFalSeedream4),
  FalSeedream4p5(PlanFalSeedream4p5),
  FalSeedream5Lite(PlanFalSeedream5Lite),
  FalNanoBanana(PlanFalNanoBanana),
  FalNanaBanana2(PlanFalNanaBanana2),
  FalNanaBananaPro(PlanFalNanaBananaPro),
}

impl ImageGenerationPlan {
  pub async fn generate_image(
    &self,
    client: &RouterClient,
  ) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    match self {
      ImageGenerationPlan::ArtcraftFlux1Dev(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_flux_1_dev(plan, artcraft_client).await
      }
      ImageGenerationPlan::ArtcraftFlux1Schnell(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_flux_1_schnell(plan, artcraft_client).await
      }
      ImageGenerationPlan::ArtcraftFluxPro11(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_flux_pro_1p1(plan, artcraft_client).await
      }
      ImageGenerationPlan::ArtcraftFluxPro11Ultra(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_flux_pro_1p1_ultra(plan, artcraft_client).await
      }
      ImageGenerationPlan::ArtcraftGptImage1(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_gpt_image_1(plan, artcraft_client).await
      }
      ImageGenerationPlan::ArtcraftGptImage1p5(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_gpt_image_1p5(plan, artcraft_client).await
      }
      ImageGenerationPlan::ArtcraftGptImage2(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_gpt_image_2(plan, artcraft_client).await
      }
      ImageGenerationPlan::ArtcraftNanaBanana(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_nano_banana(plan, artcraft_client).await
      }
      ImageGenerationPlan::ArtcraftNanaBanana2(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_nano_banana_2(plan, artcraft_client).await
      }
      ImageGenerationPlan::ArtcraftNanaBananaPro(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_nano_banana_pro(plan, artcraft_client).await
      }
      ImageGenerationPlan::ArtcraftSeedream4(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_seedream_4(plan, artcraft_client).await
      }
      ImageGenerationPlan::ArtcraftSeedream4p5(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_seedream_4p5(plan, artcraft_client).await
      }
      ImageGenerationPlan::ArtcraftSeedream5Lite(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_seedream_5_lite(plan, artcraft_client).await
      }
      ImageGenerationPlan::ArtcraftQwenEdit2511Angles(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_qwen_edit_2511_angles(plan, artcraft_client).await
      }
      ImageGenerationPlan::ArtcraftFlux2LoraAngles(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_flux_2_lora_angles(plan, artcraft_client).await
      }
      ImageGenerationPlan::FalFlux1Dev(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_flux_1_dev(plan, fal_client).await
      }
      ImageGenerationPlan::FalFlux1Schnell(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_flux_1_schnell(plan, fal_client).await
      }
      ImageGenerationPlan::FalFluxPro11(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_flux_pro_1p1(plan, fal_client).await
      }
      ImageGenerationPlan::FalFluxPro11Ultra(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_flux_pro_1p1_ultra(plan, fal_client).await
      }
      ImageGenerationPlan::FalGptImage1(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_gpt_image_1(plan, fal_client).await
      }
      ImageGenerationPlan::FalGptImage1p5(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_gpt_image_1p5(plan, fal_client).await
      }
      ImageGenerationPlan::FalGptImage2(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_gpt_image_2(plan, fal_client).await
      }
      ImageGenerationPlan::FalSeedream4(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_seedream_4(plan, fal_client).await
      }
      ImageGenerationPlan::FalSeedream4p5(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_seedream_4p5(plan, fal_client).await
      }
      ImageGenerationPlan::FalSeedream5Lite(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_seedream_5_lite(plan, fal_client).await
      }
      ImageGenerationPlan::FalNanoBanana(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_nano_banana(plan, fal_client).await
      }
      ImageGenerationPlan::FalNanaBanana2(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_nano_banana_2(plan, fal_client).await
      }
      ImageGenerationPlan::FalNanaBananaPro(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_nano_banana_pro(plan, fal_client).await
      }
    }
  }

  pub fn estimate_costs(&self) -> ImageGenerationCostEstimate {
    match self {
      ImageGenerationPlan::ArtcraftFlux1Dev(plan) => {
        estimate_image_cost_artcraft_flux_1_dev(plan)
      }
      ImageGenerationPlan::ArtcraftFlux1Schnell(plan) => {
        estimate_image_cost_artcraft_flux_1_schnell(plan)
      }
      ImageGenerationPlan::ArtcraftFluxPro11(plan) => {
        estimate_image_cost_artcraft_flux_pro_1p1(plan)
      }
      ImageGenerationPlan::ArtcraftFluxPro11Ultra(plan) => {
        estimate_image_cost_artcraft_flux_pro_1p1_ultra(plan)
      }
      ImageGenerationPlan::ArtcraftGptImage1(plan) => {
        estimate_image_cost_artcraft_gpt_image_1(plan)
      }
      ImageGenerationPlan::ArtcraftGptImage1p5(plan) => {
        estimate_image_cost_artcraft_gpt_image_1p5(plan)
      }
      ImageGenerationPlan::ArtcraftGptImage2(plan) => {
        estimate_image_cost_artcraft_gpt_image_2(plan)
      }
      ImageGenerationPlan::ArtcraftNanaBanana(plan) => {
        estimate_image_cost_artcraft_nano_banana(plan)
      }
      ImageGenerationPlan::ArtcraftNanaBanana2(plan) => {
        estimate_image_cost_artcraft_nano_banana_2(plan)
      }
      ImageGenerationPlan::ArtcraftNanaBananaPro(plan) => {
        estimate_image_cost_artcraft_nano_banana_pro(plan)
      }
      ImageGenerationPlan::ArtcraftSeedream4(plan) => {
        estimate_image_cost_artcraft_seedream_4(plan)
      }
      ImageGenerationPlan::ArtcraftSeedream4p5(plan) => {
        estimate_image_cost_artcraft_seedream_4p5(plan)
      }
      ImageGenerationPlan::ArtcraftSeedream5Lite(plan) => {
        estimate_image_cost_artcraft_seedream_5_lite(plan)
      }
      ImageGenerationPlan::ArtcraftQwenEdit2511Angles(plan) => {
        estimate_image_cost_artcraft_qwen_edit_2511_angles(plan)
      }
      ImageGenerationPlan::ArtcraftFlux2LoraAngles(plan) => {
        estimate_image_cost_artcraft_flux_2_lora_angles(plan)
      }
      ImageGenerationPlan::FalFlux1Dev(plan) => {
        estimate_image_cost_fal_flux_1_dev(plan)
      }
      ImageGenerationPlan::FalFlux1Schnell(plan) => {
        estimate_image_cost_fal_flux_1_schnell(plan)
      }
      ImageGenerationPlan::FalFluxPro11(plan) => {
        estimate_image_cost_fal_flux_pro_1p1(plan)
      }
      ImageGenerationPlan::FalFluxPro11Ultra(plan) => {
        estimate_image_cost_fal_flux_pro_1p1_ultra(plan)
      }
      ImageGenerationPlan::FalGptImage1(plan) => {
        estimate_image_cost_fal_gpt_image_1(plan)
      }
      ImageGenerationPlan::FalGptImage1p5(plan) => {
        estimate_image_cost_fal_gpt_image_1p5(plan)
      }
      ImageGenerationPlan::FalGptImage2(plan) => {
        estimate_image_cost_fal_gpt_image_2(plan)
      }
      ImageGenerationPlan::FalSeedream4(plan) => {
        estimate_image_cost_fal_seedream_4(plan)
      }
      ImageGenerationPlan::FalSeedream4p5(plan) => {
        estimate_image_cost_fal_seedream_4p5(plan)
      }
      ImageGenerationPlan::FalSeedream5Lite(plan) => {
        estimate_image_cost_fal_seedream_5_lite(plan)
      }
      ImageGenerationPlan::FalNanoBanana(plan) => {
        estimate_image_cost_fal_nano_banana(plan)
      }
      ImageGenerationPlan::FalNanaBanana2(plan) => {
        estimate_image_cost_fal_nano_banana_2(plan)
      }
      ImageGenerationPlan::FalNanaBananaPro(plan) => {
        estimate_image_cost_fal_nano_banana_pro(plan)
      }
    }
  }
}

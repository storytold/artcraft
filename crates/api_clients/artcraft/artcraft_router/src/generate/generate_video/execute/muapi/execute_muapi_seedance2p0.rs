use crate::client::router_muapi_client::RouterMuapiClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  GenerateVideoResponse, MuapiVideoResponsePayload,
};
use crate::generate::generate_video::plan::muapi::plan_generate_video_muapi_seedance2p0::{
  MuapiSeedance2p0Mode, PlanMuapiSeedance2p0,
};
use muapi_client::requests::seedance_2p0_image_to_video::seedance_2p0_image_to_video::{
  Seedance2p0ImageToVideoArgs, seedance_2p0_image_to_video,
};
use muapi_client::requests::seedance_2p0_text_to_video::seedance_2p0_text_to_video::{
  Seedance2p0TextToVideoArgs, seedance_2p0_text_to_video,
};

pub async fn execute_muapi_seedance2p0(
  plan: &PlanMuapiSeedance2p0,
  muapi_client: &RouterMuapiClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let session = &muapi_client.session;

  let request_id = match &plan.mode {
    MuapiSeedance2p0Mode::TextToVideo { aspect_ratio, duration, quality } => {
      let args = Seedance2p0TextToVideoArgs {
        session,
        prompt: plan.prompt.clone(),
        aspect_ratio: *aspect_ratio,
        duration: *duration,
        quality: *quality,
      };
      let response = seedance_2p0_text_to_video(args)
        .await
        .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Muapi(err)))?;
      response.request_id
    }
    MuapiSeedance2p0Mode::ImageToVideo { image_urls, aspect_ratio, duration, quality } => {
      let args = Seedance2p0ImageToVideoArgs {
        session,
        prompt: plan.prompt.clone(),
        image_urls: image_urls.clone(),
        aspect_ratio: *aspect_ratio,
        duration: *duration,
        quality: *quality,
      };
      let response = seedance_2p0_image_to_video(args)
        .await
        .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Muapi(err)))?;
      response.request_id
    }
  };

  Ok(GenerateVideoResponse::Muapi(MuapiVideoResponsePayload {
    request_id,
  }))
}

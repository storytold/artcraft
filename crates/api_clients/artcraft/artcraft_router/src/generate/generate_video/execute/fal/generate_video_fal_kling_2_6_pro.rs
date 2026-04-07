use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_2_6_pro::{
  FalKling2p6ProAspectRatio, FalKling2p6ProDuration, FalKling2p6ProMode, PlanFalKling2p6Pro,
};
use fal_client::requests::webhook::video::image::enqueue_kling_v2p6_pro_image_to_video_webhook::{
  enqueue_kling_v2p6_pro_image_to_video_webhook, EnqueueKlingV2p6ProImageToVideoArgs,
  EnqueueKlingV2p6ProImageToVideoDurationSeconds,
};
use fal_client::requests::webhook::video::text::enqueue_kling_v2p6_pro_text_to_video_webhook::{
  enqueue_kling_v2p6_pro_text_to_video_webhook, EnqueueKlingV2p6ProTextToVideoArgs,
  EnqueueKlingV2p6ProTextToVideoAspectRatio, EnqueueKlingV2p6ProTextToVideoDurationSeconds,
};

pub async fn execute_fal_kling_2_6_pro(
  plan: &PlanFalKling2p6Pro,
  fal_client: &RouterFalClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let webhook_response = match &plan.mode {
    FalKling2p6ProMode::TextToVideo => {
      let args = EnqueueKlingV2p6ProTextToVideoArgs {
        prompt: plan.prompt.clone(),
        generate_audio: plan.generate_audio,
        negative_prompt: plan.negative_prompt.clone(),
        duration: plan.duration.map(to_t2v_duration),
        aspect_ratio: plan.aspect_ratio.map(to_t2v_aspect_ratio),
        webhook_url: fal_client.webhook_url.as_str(),
        api_key: &fal_client.api_key,
      };
      enqueue_kling_v2p6_pro_text_to_video_webhook(args).await
    }
    FalKling2p6ProMode::ImageToVideo { image_url } => {
      let args = EnqueueKlingV2p6ProImageToVideoArgs {
        prompt: plan.prompt.clone(),
        image_url: image_url.clone(),
        generate_audio: plan.generate_audio,
        negative_prompt: plan.negative_prompt.clone(),
        duration: plan.duration.map(to_i2v_duration),
        webhook_url: fal_client.webhook_url.as_str(),
        api_key: &fal_client.api_key,
      };
      enqueue_kling_v2p6_pro_image_to_video_webhook(args).await
    }
  };

  let webhook_response = webhook_response
    .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

  Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
  }))
}

fn to_t2v_duration(d: FalKling2p6ProDuration) -> EnqueueKlingV2p6ProTextToVideoDurationSeconds {
  match d {
    FalKling2p6ProDuration::Five => EnqueueKlingV2p6ProTextToVideoDurationSeconds::Five,
    FalKling2p6ProDuration::Ten => EnqueueKlingV2p6ProTextToVideoDurationSeconds::Ten,
  }
}

fn to_t2v_aspect_ratio(a: FalKling2p6ProAspectRatio) -> EnqueueKlingV2p6ProTextToVideoAspectRatio {
  match a {
    FalKling2p6ProAspectRatio::Square => EnqueueKlingV2p6ProTextToVideoAspectRatio::Square,
    FalKling2p6ProAspectRatio::SixteenByNine => EnqueueKlingV2p6ProTextToVideoAspectRatio::SixteenByNine,
    FalKling2p6ProAspectRatio::NineBySixteen => EnqueueKlingV2p6ProTextToVideoAspectRatio::NineBySixteen,
  }
}

fn to_i2v_duration(d: FalKling2p6ProDuration) -> EnqueueKlingV2p6ProImageToVideoDurationSeconds {
  match d {
    FalKling2p6ProDuration::Five => EnqueueKlingV2p6ProImageToVideoDurationSeconds::Five,
    FalKling2p6ProDuration::Ten => EnqueueKlingV2p6ProImageToVideoDurationSeconds::Ten,
  }
}

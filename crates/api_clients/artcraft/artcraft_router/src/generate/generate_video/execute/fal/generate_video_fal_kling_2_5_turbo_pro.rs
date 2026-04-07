use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_2_5_turbo_pro::{
  FalKling2p5TurboProAspectRatio, FalKling2p5TurboProDuration, FalKling2p5TurboProMode,
  PlanFalKling2p5TurboPro,
};
use fal_client::requests::webhook::video::image::enqueue_kling_v2p5_turbo_pro_image_to_video_webhook::{
  enqueue_kling_v2p5_turbo_pro_image_to_video_webhook, EnqueueKlingV2p5TurboProImageToVideoArgs,
  EnqueueKlingV2p5TurboProImageToVideoDurationSeconds,
};
use fal_client::requests::webhook::video::text::enqueue_kling_v2p5_turbo_pro_text_to_video_webhook::{
  enqueue_kling_v2p5_turbo_pro_text_to_video_webhook, EnqueueKlingV2p5TurboProTextToVideoArgs,
  EnqueueKlingV2p5TurboProTextToVideoAspectRatio, EnqueueKlingV2p5TurboProTextToVideoDurationSeconds,
};

pub async fn execute_fal_kling_2_5_turbo_pro(
  plan: &PlanFalKling2p5TurboPro,
  fal_client: &RouterFalClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let webhook_response = match &plan.mode {
    FalKling2p5TurboProMode::TextToVideo => {
      let args = EnqueueKlingV2p5TurboProTextToVideoArgs {
        prompt: plan.prompt.clone(),
        negative_prompt: plan.negative_prompt.clone(),
        duration: plan.duration.map(to_t2v_duration),
        aspect_ratio: plan.aspect_ratio.map(to_t2v_aspect_ratio),
        webhook_url: fal_client.webhook_url.as_str(),
        api_key: &fal_client.api_key,
      };
      enqueue_kling_v2p5_turbo_pro_text_to_video_webhook(args).await
    }
    FalKling2p5TurboProMode::ImageToVideo { image_url, end_image_url } => {
      let args = EnqueueKlingV2p5TurboProImageToVideoArgs {
        prompt: plan.prompt.clone(),
        image_url: image_url.clone(),
        tail_image_url: end_image_url.clone(),
        negative_prompt: plan.negative_prompt.clone(),
        duration: plan.duration.map(to_i2v_duration),
        webhook_url: fal_client.webhook_url.as_str(),
        api_key: &fal_client.api_key,
      };
      enqueue_kling_v2p5_turbo_pro_image_to_video_webhook(args).await
    }
  };

  let webhook_response = webhook_response
    .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

  Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
  }))
}

fn to_t2v_duration(d: FalKling2p5TurboProDuration) -> EnqueueKlingV2p5TurboProTextToVideoDurationSeconds {
  match d {
    FalKling2p5TurboProDuration::Five => EnqueueKlingV2p5TurboProTextToVideoDurationSeconds::Five,
    FalKling2p5TurboProDuration::Ten => EnqueueKlingV2p5TurboProTextToVideoDurationSeconds::Ten,
  }
}

fn to_t2v_aspect_ratio(a: FalKling2p5TurboProAspectRatio) -> EnqueueKlingV2p5TurboProTextToVideoAspectRatio {
  match a {
    FalKling2p5TurboProAspectRatio::Square => EnqueueKlingV2p5TurboProTextToVideoAspectRatio::Square,
    FalKling2p5TurboProAspectRatio::SixteenByNine => EnqueueKlingV2p5TurboProTextToVideoAspectRatio::SixteenByNine,
    FalKling2p5TurboProAspectRatio::NineBySixteen => EnqueueKlingV2p5TurboProTextToVideoAspectRatio::NineBySixteen,
  }
}

fn to_i2v_duration(d: FalKling2p5TurboProDuration) -> EnqueueKlingV2p5TurboProImageToVideoDurationSeconds {
  match d {
    FalKling2p5TurboProDuration::Five => EnqueueKlingV2p5TurboProImageToVideoDurationSeconds::Five,
    FalKling2p5TurboProDuration::Ten => EnqueueKlingV2p5TurboProImageToVideoDurationSeconds::Ten,
  }
}

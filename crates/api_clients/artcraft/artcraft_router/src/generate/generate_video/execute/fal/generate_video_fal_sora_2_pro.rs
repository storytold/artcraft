use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_sora_2_pro::{
  FalSora2ProAspectRatio, FalSora2ProDuration, FalSora2ProMode, FalSora2ProResolution,
  PlanFalSora2Pro,
};
use fal_client::requests::webhook::video::image::enqueue_sora_2_pro_image_to_video_webhook::{
  enqueue_sora_2_pro_image_to_video_webhook, EnqueueSora2ProImageToVideoArgs,
  EnqueueSora2ProImageToVideoAspectRatio, EnqueueSora2ProImageToVideoDurationSeconds,
  EnqueueSora2ProImageToVideoResolution,
};
use fal_client::requests::webhook::video::text::enqueue_sora_2_pro_text_to_video_webhook::{
  enqueue_sora_2_pro_text_to_video_webhook, EnqueueSora2ProTextToVideoArgs,
  EnqueueSora2ProTextToVideoAspectRatio, EnqueueSora2ProTextToVideoDurationSeconds,
  EnqueueSora2ProTextToVideoResolution,
};

pub async fn execute_fal_sora_2_pro(
  plan: &PlanFalSora2Pro,
  fal_client: &RouterFalClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let webhook_response = match &plan.mode {
    FalSora2ProMode::TextToVideo => {
      // Text-to-video does not support Auto aspect ratio or Auto resolution.
      let args = EnqueueSora2ProTextToVideoArgs {
        prompt: plan.prompt.clone(),
        resolution: plan.resolution.and_then(to_t2v_resolution),
        duration: plan.duration.map(to_t2v_duration),
        aspect_ratio: plan.aspect_ratio.and_then(to_t2v_aspect_ratio),
        webhook_url: fal_client.webhook_url.as_str(),
        api_key: &fal_client.api_key,
      };
      enqueue_sora_2_pro_text_to_video_webhook(args).await
    }
    FalSora2ProMode::ImageToVideo { image_url } => {
      let args = EnqueueSora2ProImageToVideoArgs {
        prompt: plan.prompt.clone(),
        image_url: image_url.clone(),
        duration: plan.duration.map(to_i2v_duration),
        resolution: plan.resolution.map(to_i2v_resolution),
        aspect_ratio: plan.aspect_ratio.map(to_i2v_aspect_ratio),
        webhook_url: fal_client.webhook_url.as_str(),
        api_key: &fal_client.api_key,
      };
      enqueue_sora_2_pro_image_to_video_webhook(args).await
    }
  };

  let webhook_response = webhook_response
    .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

  Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
  }))
}

fn to_t2v_duration(d: FalSora2ProDuration) -> EnqueueSora2ProTextToVideoDurationSeconds {
  match d {
    FalSora2ProDuration::Four => EnqueueSora2ProTextToVideoDurationSeconds::Four,
    FalSora2ProDuration::Eight => EnqueueSora2ProTextToVideoDurationSeconds::Eight,
    FalSora2ProDuration::Twelve => EnqueueSora2ProTextToVideoDurationSeconds::Twelve,
  }
}

fn to_t2v_resolution(r: FalSora2ProResolution) -> Option<EnqueueSora2ProTextToVideoResolution> {
  match r {
    FalSora2ProResolution::SevenTwentyP => Some(EnqueueSora2ProTextToVideoResolution::SevenTwentyP),
    FalSora2ProResolution::TenEightyP => Some(EnqueueSora2ProTextToVideoResolution::TenEightyP),
    FalSora2ProResolution::Auto => None,
  }
}

fn to_t2v_aspect_ratio(a: FalSora2ProAspectRatio) -> Option<EnqueueSora2ProTextToVideoAspectRatio> {
  match a {
    FalSora2ProAspectRatio::SixteenByNine => Some(EnqueueSora2ProTextToVideoAspectRatio::SixteenByNine),
    FalSora2ProAspectRatio::NineBySixteen => Some(EnqueueSora2ProTextToVideoAspectRatio::NineBySixteen),
    FalSora2ProAspectRatio::Auto => None,
  }
}

fn to_i2v_duration(d: FalSora2ProDuration) -> EnqueueSora2ProImageToVideoDurationSeconds {
  match d {
    FalSora2ProDuration::Four => EnqueueSora2ProImageToVideoDurationSeconds::Four,
    FalSora2ProDuration::Eight => EnqueueSora2ProImageToVideoDurationSeconds::Eight,
    FalSora2ProDuration::Twelve => EnqueueSora2ProImageToVideoDurationSeconds::Twelve,
  }
}

fn to_i2v_resolution(r: FalSora2ProResolution) -> EnqueueSora2ProImageToVideoResolution {
  match r {
    FalSora2ProResolution::Auto => EnqueueSora2ProImageToVideoResolution::Auto,
    FalSora2ProResolution::SevenTwentyP => EnqueueSora2ProImageToVideoResolution::SevenTwentyP,
    FalSora2ProResolution::TenEightyP => EnqueueSora2ProImageToVideoResolution::TenEightyP,
  }
}

fn to_i2v_aspect_ratio(a: FalSora2ProAspectRatio) -> EnqueueSora2ProImageToVideoAspectRatio {
  match a {
    FalSora2ProAspectRatio::Auto => EnqueueSora2ProImageToVideoAspectRatio::Auto,
    FalSora2ProAspectRatio::SixteenByNine => EnqueueSora2ProImageToVideoAspectRatio::SixteenByNine,
    FalSora2ProAspectRatio::NineBySixteen => EnqueueSora2ProImageToVideoAspectRatio::NineBySixteen,
  }
}

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_sora_2::{
  FalSora2AspectRatio, FalSora2Duration, FalSora2Mode, FalSora2Resolution, PlanFalSora2,
};
use fal_client::requests::webhook::video::image::enqueue_sora_2_image_to_video_webhook::{
  enqueue_sora_2_image_to_video_webhook, EnqueueSora2ImageToVideoArgs,
  EnqueueSora2ImageToVideoAspectRatio, EnqueueSora2ImageToVideoDurationSeconds,
  EnqueueSora2ImageToVideoResolution,
};
use fal_client::requests::webhook::video::text::enqueue_sora_2_text_to_video_webhook::{
  enqueue_sora_2_text_to_video_webhook, EnqueueSora2TextToVideoArgs,
  EnqueueSora2TextToVideoAspectRatio, EnqueueSora2TextToVideoDurationSeconds,
  EnqueueSora2TextToVideoResolution,
};

pub async fn execute_fal_sora_2(
  plan: &PlanFalSora2,
  fal_client: &RouterFalClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let webhook_response = match &plan.mode {
    FalSora2Mode::TextToVideo => {
      // Text-to-video does not support Auto aspect ratio or Auto resolution.
      let args = EnqueueSora2TextToVideoArgs {
        prompt: plan.prompt.clone(),
        resolution: plan.resolution.and_then(to_t2v_resolution),
        duration: plan.duration.map(to_t2v_duration),
        aspect_ratio: plan.aspect_ratio.and_then(to_t2v_aspect_ratio),
        webhook_url: fal_client.webhook_url.as_str(),
        api_key: &fal_client.api_key,
      };
      enqueue_sora_2_text_to_video_webhook(args).await
    }
    FalSora2Mode::ImageToVideo { image_url } => {
      let args = EnqueueSora2ImageToVideoArgs {
        prompt: plan.prompt.clone(),
        image_url: image_url.clone(),
        duration: plan.duration.map(to_i2v_duration),
        resolution: plan.resolution.map(to_i2v_resolution),
        aspect_ratio: plan.aspect_ratio.map(to_i2v_aspect_ratio),
        webhook_url: fal_client.webhook_url.as_str(),
        api_key: &fal_client.api_key,
      };
      enqueue_sora_2_image_to_video_webhook(args).await
    }
  };

  let webhook_response = webhook_response
    .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

  Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
  }))
}

fn to_t2v_duration(d: FalSora2Duration) -> EnqueueSora2TextToVideoDurationSeconds {
  match d {
    FalSora2Duration::Four => EnqueueSora2TextToVideoDurationSeconds::Four,
    FalSora2Duration::Eight => EnqueueSora2TextToVideoDurationSeconds::Eight,
    FalSora2Duration::Twelve => EnqueueSora2TextToVideoDurationSeconds::Twelve,
  }
}

fn to_t2v_resolution(r: FalSora2Resolution) -> Option<EnqueueSora2TextToVideoResolution> {
  match r {
    FalSora2Resolution::SevenTwentyP => Some(EnqueueSora2TextToVideoResolution::SevenTwentyP),
    FalSora2Resolution::Auto => None,
  }
}

fn to_t2v_aspect_ratio(a: FalSora2AspectRatio) -> Option<EnqueueSora2TextToVideoAspectRatio> {
  match a {
    FalSora2AspectRatio::SixteenByNine => Some(EnqueueSora2TextToVideoAspectRatio::SixteenByNine),
    FalSora2AspectRatio::NineBySixteen => Some(EnqueueSora2TextToVideoAspectRatio::NineBySixteen),
    FalSora2AspectRatio::Auto => None,
  }
}

fn to_i2v_duration(d: FalSora2Duration) -> EnqueueSora2ImageToVideoDurationSeconds {
  match d {
    FalSora2Duration::Four => EnqueueSora2ImageToVideoDurationSeconds::Four,
    FalSora2Duration::Eight => EnqueueSora2ImageToVideoDurationSeconds::Eight,
    FalSora2Duration::Twelve => EnqueueSora2ImageToVideoDurationSeconds::Twelve,
  }
}

fn to_i2v_resolution(r: FalSora2Resolution) -> EnqueueSora2ImageToVideoResolution {
  match r {
    FalSora2Resolution::SevenTwentyP => EnqueueSora2ImageToVideoResolution::SevenTwentyP,
    FalSora2Resolution::Auto => EnqueueSora2ImageToVideoResolution::Auto,
  }
}

fn to_i2v_aspect_ratio(a: FalSora2AspectRatio) -> EnqueueSora2ImageToVideoAspectRatio {
  match a {
    FalSora2AspectRatio::SixteenByNine => EnqueueSora2ImageToVideoAspectRatio::SixteenByNine,
    FalSora2AspectRatio::NineBySixteen => EnqueueSora2ImageToVideoAspectRatio::NineBySixteen,
    FalSora2AspectRatio::Auto => EnqueueSora2ImageToVideoAspectRatio::Auto,
  }
}

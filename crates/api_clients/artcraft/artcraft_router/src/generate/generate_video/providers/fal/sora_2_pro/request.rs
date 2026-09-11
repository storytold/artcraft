use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests_old::webhook::video::image::enqueue_sora_2_pro_image_to_video_webhook::{
  enqueue_sora_2_pro_image_to_video_webhook, EnqueueSora2ProImageToVideoArgs,
  EnqueueSora2ProImageToVideoAspectRatio, EnqueueSora2ProImageToVideoDurationSeconds,
  EnqueueSora2ProImageToVideoRequest, EnqueueSora2ProImageToVideoResolution,
};
use fal_client::requests_old::webhook::video::text::enqueue_sora_2_pro_text_to_video_webhook::{
  enqueue_sora_2_pro_text_to_video_webhook, EnqueueSora2ProTextToVideoArgs,
  EnqueueSora2ProTextToVideoAspectRatio, EnqueueSora2ProTextToVideoDurationSeconds,
  EnqueueSora2ProTextToVideoRequest, EnqueueSora2ProTextToVideoResolution,
};

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Debug, Clone, Copy)]
pub enum FalSora2ProAspectRatio {
  Auto,
  SixteenByNine,
  NineBySixteen,
}

#[derive(Debug, Clone, Copy)]
pub enum FalSora2ProResolution {
  Auto,
  SevenTwentyP,
  TenEightyP,
}

#[derive(Debug, Clone, Copy)]
pub enum FalSora2ProDuration {
  Four,
  Eight,
  Twelve,
}

#[derive(Debug, Clone)]
pub enum FalSora2ProMode {
  TextToVideo,
  ImageToVideo { image_url: String },
}

#[derive(Debug, Clone)]
pub struct FalSora2ProRequestState {
  pub prompt: String,
  pub mode: FalSora2ProMode,
  pub aspect_ratio: Option<FalSora2ProAspectRatio>,
  pub resolution: Option<FalSora2ProResolution>,
  pub duration: Option<FalSora2ProDuration>,
}

impl FalSora2ProRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let webhook_url = client.webhook_url.as_deref()
      .ok_or(ArtcraftRouterError::Client(ClientError::WebhookUrlRequired))?;
    let (webhook_response, outbound_request): (_, Arc<dyn Debug + Send + Sync>) = match &self.mode {
      FalSora2ProMode::TextToVideo => {
        // Text-to-video does not support Auto aspect ratio or Auto resolution.
        let request = EnqueueSora2ProTextToVideoRequest {
          prompt: self.prompt.clone(),
          resolution: self.resolution.and_then(to_t2v_resolution),
          duration: self.duration.map(to_t2v_duration),
          aspect_ratio: self.aspect_ratio.and_then(to_t2v_aspect_ratio),
        };
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueSora2ProTextToVideoArgs {
          request,
          webhook_url,
          api_key: &client.api_key,
        };
        (enqueue_sora_2_pro_text_to_video_webhook(args).await, outbound)
      }
      FalSora2ProMode::ImageToVideo { image_url } => {
        let request = EnqueueSora2ProImageToVideoRequest {
          prompt: self.prompt.clone(),
          image_url: image_url.clone(),
          duration: self.duration.map(to_i2v_duration),
          resolution: self.resolution.map(to_i2v_resolution),
          aspect_ratio: self.aspect_ratio.map(to_i2v_aspect_ratio),
        };
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueSora2ProImageToVideoArgs {
          request,
          webhook_url,
          api_key: &client.api_key,
        };
        (enqueue_sora_2_pro_image_to_video_webhook(args).await, outbound)
      }
    };

    let webhook_response = webhook_response
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

    Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
      request_id: webhook_response.request_id,
      gateway_request_id: webhook_response.gateway_request_id,
      maybe_status_url: None,
      maybe_response_url: None,
      maybe_outbound_request: Some(outbound_request),
    }))
  }
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

use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::webhook::video::image::enqueue_sora_2_image_to_video_webhook::{
  enqueue_sora_2_image_to_video_webhook, EnqueueSora2ImageToVideoArgs,
  EnqueueSora2ImageToVideoAspectRatio, EnqueueSora2ImageToVideoDurationSeconds,
  EnqueueSora2ImageToVideoRequest, EnqueueSora2ImageToVideoResolution,
};
use fal_client::requests::webhook::video::text::enqueue_sora_2_text_to_video_webhook::{
  enqueue_sora_2_text_to_video_webhook, EnqueueSora2TextToVideoArgs,
  EnqueueSora2TextToVideoAspectRatio, EnqueueSora2TextToVideoDurationSeconds,
  EnqueueSora2TextToVideoRequest, EnqueueSora2TextToVideoResolution,
};

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};

/// Router-level aspect ratio retained so the cost calculator and request
/// builder both see the same source of truth — fal_client's text-to-video
/// types do not represent `Auto`, so we must preserve it here.
#[derive(Debug, Clone, Copy)]
pub enum FalSora2AspectRatio {
  Auto,
  SixteenByNine,
  NineBySixteen,
}

/// Sora 2 supports 720p (and `auto` on image-to-video).
#[derive(Debug, Clone, Copy)]
pub enum FalSora2Resolution {
  Auto,
  SevenTwentyP,
}

#[derive(Debug, Clone, Copy)]
pub enum FalSora2Duration {
  Four,
  Eight,
  Twelve,
}

#[derive(Debug, Clone)]
pub enum FalSora2Mode {
  TextToVideo,
  ImageToVideo { image_url: String },
}

#[derive(Debug, Clone)]
pub struct FalSora2RequestState {
  pub prompt: String,
  pub mode: FalSora2Mode,
  pub aspect_ratio: Option<FalSora2AspectRatio>,
  pub resolution: Option<FalSora2Resolution>,
  pub duration: Option<FalSora2Duration>,
}

impl FalSora2RequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let webhook_url = client.webhook_url.as_deref()
      .ok_or(ArtcraftRouterError::Client(ClientError::WebhookUrlRequired))?;
    let (webhook_response, outbound_request): (_, Arc<dyn Debug + Send + Sync>) = match &self.mode {
      FalSora2Mode::TextToVideo => {
        // Text-to-video does not support Auto aspect ratio or Auto resolution.
        let request = EnqueueSora2TextToVideoRequest {
          prompt: self.prompt.clone(),
          resolution: self.resolution.and_then(to_t2v_resolution),
          duration: self.duration.map(to_t2v_duration),
          aspect_ratio: self.aspect_ratio.and_then(to_t2v_aspect_ratio),
        };
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueSora2TextToVideoArgs {
          request,
          webhook_url,
          api_key: &client.api_key,
        };
        (enqueue_sora_2_text_to_video_webhook(args).await, outbound)
      }
      FalSora2Mode::ImageToVideo { image_url } => {
        let request = EnqueueSora2ImageToVideoRequest {
          prompt: self.prompt.clone(),
          image_url: image_url.clone(),
          duration: self.duration.map(to_i2v_duration),
          resolution: self.resolution.map(to_i2v_resolution),
          aspect_ratio: self.aspect_ratio.map(to_i2v_aspect_ratio),
        };
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueSora2ImageToVideoArgs {
          request,
          webhook_url,
          api_key: &client.api_key,
        };
        (enqueue_sora_2_image_to_video_webhook(args).await, outbound)
      }
    };

    let webhook_response = webhook_response
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

    Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
      request_id: webhook_response.request_id,
      gateway_request_id: webhook_response.gateway_request_id,
      maybe_outbound_request: Some(outbound_request),
    }))
  }
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

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_veo_3::{
  FalVeo3Duration, FalVeo3I2vAspectRatio, FalVeo3Mode, FalVeo3Resolution,
  FalVeo3T2vAspectRatio, PlanFalVeo3,
};
use fal_client::requests::webhook::video::image::enqueue_veo_3_image_to_video_webhook::{
  enqueue_veo_3_image_to_video_webhook, Veo3Args, Veo3I2vAspectRatio, Veo3I2vDuration,
  Veo3I2vResolution,
};
use fal_client::requests::webhook::video::text::enqueue_veo_3_text_to_video_webhook::{
  enqueue_veo_3_text_to_video_webhook, Veo3T2vAspectRatio, Veo3T2vDuration, Veo3T2vResolution,
  Veo3TextToVideoArgs,
};

fn to_i2v_duration(d: FalVeo3Duration) -> Veo3I2vDuration {
  match d {
    FalVeo3Duration::Default => Veo3I2vDuration::Default,
    FalVeo3Duration::FourSeconds => Veo3I2vDuration::FourSeconds,
    FalVeo3Duration::SixSeconds => Veo3I2vDuration::SixSeconds,
    FalVeo3Duration::EightSeconds => Veo3I2vDuration::EightSeconds,
  }
}

fn to_t2v_duration(d: FalVeo3Duration) -> Veo3T2vDuration {
  match d {
    FalVeo3Duration::Default => Veo3T2vDuration::Default,
    FalVeo3Duration::FourSeconds => Veo3T2vDuration::FourSeconds,
    FalVeo3Duration::SixSeconds => Veo3T2vDuration::SixSeconds,
    FalVeo3Duration::EightSeconds => Veo3T2vDuration::EightSeconds,
  }
}

fn to_i2v_resolution(r: FalVeo3Resolution) -> Veo3I2vResolution {
  match r {
    FalVeo3Resolution::Default => Veo3I2vResolution::Default,
    FalVeo3Resolution::SevenTwentyP => Veo3I2vResolution::SevenTwentyP,
    FalVeo3Resolution::TenEightyP => Veo3I2vResolution::TenEightyP,
  }
}

fn to_t2v_resolution(r: FalVeo3Resolution) -> Veo3T2vResolution {
  match r {
    FalVeo3Resolution::Default => Veo3T2vResolution::Default,
    FalVeo3Resolution::SevenTwentyP => Veo3T2vResolution::SevenTwentyP,
    FalVeo3Resolution::TenEightyP => Veo3T2vResolution::TenEightyP,
  }
}

fn to_t2v_aspect_ratio(ar: FalVeo3T2vAspectRatio) -> Veo3T2vAspectRatio {
  match ar {
    FalVeo3T2vAspectRatio::Default => Veo3T2vAspectRatio::Default,
    FalVeo3T2vAspectRatio::WideSixteenNine => Veo3T2vAspectRatio::WideSixteenNine,
    FalVeo3T2vAspectRatio::TallNineSixteen => Veo3T2vAspectRatio::TallNineSixteen,
  }
}

fn to_i2v_aspect_ratio(ar: FalVeo3I2vAspectRatio) -> Veo3I2vAspectRatio {
  match ar {
    FalVeo3I2vAspectRatio::Auto => Veo3I2vAspectRatio::Auto,
    FalVeo3I2vAspectRatio::WideSixteenNine => Veo3I2vAspectRatio::WideSixteenNine,
    FalVeo3I2vAspectRatio::TallNineSixteen => Veo3I2vAspectRatio::TallNineSixteen,
  }
}

pub async fn execute_fal_veo_3(
  plan: &PlanFalVeo3,
  fal_client: &RouterFalClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let webhook_response = match &plan.mode {
    FalVeo3Mode::TextToVideo => {
      let args = Veo3TextToVideoArgs {
        prompt: plan.prompt.as_str(),
        negative_prompt: plan.negative_prompt.as_deref(),
        api_key: &fal_client.api_key,
        duration: to_t2v_duration(plan.duration),
        aspect_ratio: plan.t2v_aspect_ratio.map(to_t2v_aspect_ratio).unwrap_or(Veo3T2vAspectRatio::Default),
        resolution: to_t2v_resolution(plan.resolution),
        generate_audio: plan.generate_audio,
        webhook_url: fal_client.webhook_url.as_str(),
      };
      enqueue_veo_3_text_to_video_webhook(args)
        .await
        .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?
    }
    FalVeo3Mode::ImageToVideo { image_url } => {
      let args = Veo3Args {
        image_url: image_url.as_str(),
        prompt: plan.prompt.as_str(),
        duration: to_i2v_duration(plan.duration),
        aspect_ratio: plan.i2v_aspect_ratio.map(to_i2v_aspect_ratio).unwrap_or(Veo3I2vAspectRatio::Auto),
        resolution: to_i2v_resolution(plan.resolution),
        generate_audio: plan.generate_audio,
        api_key: &fal_client.api_key,
        webhook_url: fal_client.webhook_url.as_str(),
      };
      enqueue_veo_3_image_to_video_webhook(args)
        .await
        .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?
    }
  };

  Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
  }))
}

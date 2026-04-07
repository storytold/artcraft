use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_veo_3p1::{
  FalVeo3p1AspectRatio, FalVeo3p1Duration, FalVeo3p1Mode, FalVeo3p1Resolution, PlanFalVeo3p1,
};
use fal_client::requests::webhook::video::image::enqueue_veo_3p1_first_last_frame_image_to_video_webhook::{
  enqueue_veo_3p1_first_last_frame_image_to_video_webhook,
  EnqueueVeo3p1FirstLastFrameImageToVideoArgs,
  EnqueueVeo3p1FirstLastFrameImageToVideoAspectRatio,
  EnqueueVeo3p1FirstLastFrameImageToVideoDurationSeconds,
  EnqueueVeo3p1FirstLastFrameImageToVideoResolution,
};
use fal_client::requests::webhook::video::image::enqueue_veo_3p1_image_to_video_webhook::{
  enqueue_veo_3p1_image_to_video_webhook, EnqueueVeo3p1ImageToVideoArgs,
  EnqueueVeo3p1ImageToVideoAspectRatio, EnqueueVeo3p1ImageToVideoDurationSeconds,
  EnqueueVeo3p1ImageToVideoResolution,
};
use fal_client::requests::webhook::video::text::enqueue_veo_3p1_text_to_video_webhook::{
  enqueue_veo_3p1_text_to_video_webhook, EnqueueVeo3p1TextToVideoArgs,
  EnqueueVeo3p1TextToVideoAspectRatio, EnqueueVeo3p1TextToVideoDurationSeconds,
  EnqueueVeo3p1TextToVideoResolution,
};

pub async fn execute_fal_veo_3p1(
  plan: &PlanFalVeo3p1,
  fal_client: &RouterFalClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let webhook_response = match &plan.mode {
    FalVeo3p1Mode::TextToVideo => {
      let args = EnqueueVeo3p1TextToVideoArgs {
        prompt: plan.prompt.clone(),
        duration: plan.duration.map(to_t2v_duration),
        aspect_ratio: plan.aspect_ratio.map(to_t2v_aspect_ratio),
        resolution: plan.resolution.map(to_t2v_resolution),
        generate_audio: plan.generate_audio,
        enhance_prompt: None,
        negative_prompt: plan.negative_prompt.clone(),
        seed: None,
        auto_fix: None,
        webhook_url: fal_client.webhook_url.as_str(),
        api_key: &fal_client.api_key,
      };
      enqueue_veo_3p1_text_to_video_webhook(args).await
    }
    FalVeo3p1Mode::ImageToVideo { start_frame_url } => {
      let args = EnqueueVeo3p1ImageToVideoArgs {
        prompt: plan.prompt.clone(),
        image_url: start_frame_url.clone(),
        duration: plan.duration.map(to_i2v_duration),
        aspect_ratio: plan.aspect_ratio.map(to_i2v_aspect_ratio),
        resolution: plan.resolution.map(to_i2v_resolution),
        generate_audio: plan.generate_audio,
        webhook_url: fal_client.webhook_url.as_str(),
        api_key: &fal_client.api_key,
      };
      enqueue_veo_3p1_image_to_video_webhook(args).await
    }
    FalVeo3p1Mode::FirstLastFrame { first_frame_url, last_frame_url } => {
      let args = EnqueueVeo3p1FirstLastFrameImageToVideoArgs {
        prompt: plan.prompt.clone(),
        first_frame_url: first_frame_url.clone(),
        last_frame_url: last_frame_url.clone(),
        duration: plan.duration.map(to_flf_duration),
        aspect_ratio: plan.aspect_ratio.map(to_flf_aspect_ratio),
        resolution: plan.resolution.map(to_flf_resolution),
        generate_audio: plan.generate_audio,
        webhook_url: fal_client.webhook_url.as_str(),
        api_key: &fal_client.api_key,
      };
      enqueue_veo_3p1_first_last_frame_image_to_video_webhook(args).await
    }
  };

  let webhook_response = webhook_response
    .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

  Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
  }))
}

fn to_t2v_duration(d: FalVeo3p1Duration) -> EnqueueVeo3p1TextToVideoDurationSeconds {
  match d {
    FalVeo3p1Duration::Four => EnqueueVeo3p1TextToVideoDurationSeconds::Four,
    FalVeo3p1Duration::Six => EnqueueVeo3p1TextToVideoDurationSeconds::Six,
    FalVeo3p1Duration::Eight => EnqueueVeo3p1TextToVideoDurationSeconds::Eight,
  }
}

fn to_t2v_aspect_ratio(a: FalVeo3p1AspectRatio) -> EnqueueVeo3p1TextToVideoAspectRatio {
  match a {
    FalVeo3p1AspectRatio::Auto => EnqueueVeo3p1TextToVideoAspectRatio::Auto,
    FalVeo3p1AspectRatio::SixteenByNine => EnqueueVeo3p1TextToVideoAspectRatio::SixteenByNine,
    FalVeo3p1AspectRatio::NineBySixteen => EnqueueVeo3p1TextToVideoAspectRatio::NineBySixteen,
  }
}

fn to_t2v_resolution(r: FalVeo3p1Resolution) -> EnqueueVeo3p1TextToVideoResolution {
  match r {
    FalVeo3p1Resolution::SevenTwentyP => EnqueueVeo3p1TextToVideoResolution::SevenTwentyP,
    FalVeo3p1Resolution::TenEightyP => EnqueueVeo3p1TextToVideoResolution::TenEightyP,
  }
}

fn to_i2v_duration(d: FalVeo3p1Duration) -> EnqueueVeo3p1ImageToVideoDurationSeconds {
  match d {
    FalVeo3p1Duration::Four => EnqueueVeo3p1ImageToVideoDurationSeconds::Four,
    FalVeo3p1Duration::Six => EnqueueVeo3p1ImageToVideoDurationSeconds::Six,
    FalVeo3p1Duration::Eight => EnqueueVeo3p1ImageToVideoDurationSeconds::Eight,
  }
}

fn to_i2v_aspect_ratio(a: FalVeo3p1AspectRatio) -> EnqueueVeo3p1ImageToVideoAspectRatio {
  match a {
    FalVeo3p1AspectRatio::Auto => EnqueueVeo3p1ImageToVideoAspectRatio::Auto,
    FalVeo3p1AspectRatio::SixteenByNine => EnqueueVeo3p1ImageToVideoAspectRatio::SixteenByNine,
    FalVeo3p1AspectRatio::NineBySixteen => EnqueueVeo3p1ImageToVideoAspectRatio::NineBySixteen,
  }
}

fn to_i2v_resolution(r: FalVeo3p1Resolution) -> EnqueueVeo3p1ImageToVideoResolution {
  match r {
    FalVeo3p1Resolution::SevenTwentyP => EnqueueVeo3p1ImageToVideoResolution::SevenTwentyP,
    FalVeo3p1Resolution::TenEightyP => EnqueueVeo3p1ImageToVideoResolution::TenEightyP,
  }
}

fn to_flf_duration(d: FalVeo3p1Duration) -> EnqueueVeo3p1FirstLastFrameImageToVideoDurationSeconds {
  match d {
    FalVeo3p1Duration::Four => EnqueueVeo3p1FirstLastFrameImageToVideoDurationSeconds::Four,
    FalVeo3p1Duration::Six => EnqueueVeo3p1FirstLastFrameImageToVideoDurationSeconds::Six,
    FalVeo3p1Duration::Eight => EnqueueVeo3p1FirstLastFrameImageToVideoDurationSeconds::Eight,
  }
}

fn to_flf_aspect_ratio(a: FalVeo3p1AspectRatio) -> EnqueueVeo3p1FirstLastFrameImageToVideoAspectRatio {
  match a {
    FalVeo3p1AspectRatio::Auto => EnqueueVeo3p1FirstLastFrameImageToVideoAspectRatio::Auto,
    FalVeo3p1AspectRatio::SixteenByNine => EnqueueVeo3p1FirstLastFrameImageToVideoAspectRatio::SixteenByNine,
    FalVeo3p1AspectRatio::NineBySixteen => EnqueueVeo3p1FirstLastFrameImageToVideoAspectRatio::NineBySixteen,
  }
}

fn to_flf_resolution(r: FalVeo3p1Resolution) -> EnqueueVeo3p1FirstLastFrameImageToVideoResolution {
  match r {
    FalVeo3p1Resolution::SevenTwentyP => EnqueueVeo3p1FirstLastFrameImageToVideoResolution::SevenTwentyP,
    FalVeo3p1Resolution::TenEightyP => EnqueueVeo3p1FirstLastFrameImageToVideoResolution::TenEightyP,
  }
}

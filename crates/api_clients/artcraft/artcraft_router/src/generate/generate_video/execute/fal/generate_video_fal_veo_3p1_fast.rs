use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_veo_3p1::{
  FalVeo3p1AspectRatio, FalVeo3p1Duration, FalVeo3p1Mode, FalVeo3p1Resolution,
};
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_veo_3p1_fast::PlanFalVeo3p1Fast;
use fal_client::requests::webhook::video::image::enqueue_veo_3p1_fast_first_last_frame_image_to_video_webhook::{
  enqueue_veo_3p1_fast_first_last_frame_image_to_video_webhook,
  EnqueueVeo3p1FastFirstLastFrameImageToVideoArgs,
  EnqueueVeo3p1FastFirstLastFrameImageToVideoAspectRatio,
  EnqueueVeo3p1FastFirstLastFrameImageToVideoDurationSeconds,
  EnqueueVeo3p1FastFirstLastFrameImageToVideoResolution,
};
use fal_client::requests::webhook::video::image::enqueue_veo_3p1_fast_image_to_video_webhook::{
  enqueue_veo_3p1_fast_image_to_video_webhook, EnqueueVeo3p1FastImageToVideoArgs,
  EnqueueVeo3p1FastImageToVideoAspectRatio, EnqueueVeo3p1FastImageToVideoDurationSeconds,
  EnqueueVeo3p1FastImageToVideoResolution,
};
use fal_client::requests::webhook::video::text::enqueue_veo_3p1_fast_text_to_video_webhook::{
  enqueue_veo_3p1_fast_text_to_video_webhook, EnqueueVeo3p1FastTextToVideoArgs,
  EnqueueVeo3p1FastTextToVideoAspectRatio, EnqueueVeo3p1FastTextToVideoDurationSeconds,
  EnqueueVeo3p1FastTextToVideoResolution,
};

pub async fn execute_fal_veo_3p1_fast(
  plan: &PlanFalVeo3p1Fast,
  fal_client: &RouterFalClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let inner = &plan.inner;

  let webhook_response = match &inner.mode {
    FalVeo3p1Mode::TextToVideo => {
      let args = EnqueueVeo3p1FastTextToVideoArgs {
        prompt: inner.prompt.clone(),
        duration: inner.duration.map(to_t2v_duration),
        aspect_ratio: inner.aspect_ratio.map(to_t2v_aspect_ratio),
        resolution: inner.resolution.map(to_t2v_resolution),
        generate_audio: inner.generate_audio,
        enhance_prompt: None,
        negative_prompt: inner.negative_prompt.clone(),
        seed: None,
        auto_fix: None,
        webhook_url: fal_client.webhook_url.as_str(),
        api_key: &fal_client.api_key,
      };
      enqueue_veo_3p1_fast_text_to_video_webhook(args).await
    }
    FalVeo3p1Mode::ImageToVideo { start_frame_url } => {
      let args = EnqueueVeo3p1FastImageToVideoArgs {
        prompt: inner.prompt.clone(),
        image_url: start_frame_url.clone(),
        duration: inner.duration.map(to_i2v_duration),
        aspect_ratio: inner.aspect_ratio.map(to_i2v_aspect_ratio),
        resolution: inner.resolution.map(to_i2v_resolution),
        generate_audio: inner.generate_audio,
        webhook_url: fal_client.webhook_url.as_str(),
        api_key: &fal_client.api_key,
      };
      enqueue_veo_3p1_fast_image_to_video_webhook(args).await
    }
    FalVeo3p1Mode::FirstLastFrame { first_frame_url, last_frame_url } => {
      let args = EnqueueVeo3p1FastFirstLastFrameImageToVideoArgs {
        prompt: inner.prompt.clone(),
        first_frame_url: first_frame_url.clone(),
        last_frame_url: last_frame_url.clone(),
        duration: inner.duration.map(to_flf_duration),
        aspect_ratio: inner.aspect_ratio.map(to_flf_aspect_ratio),
        resolution: inner.resolution.map(to_flf_resolution),
        generate_audio: inner.generate_audio,
        webhook_url: fal_client.webhook_url.as_str(),
        api_key: &fal_client.api_key,
      };
      enqueue_veo_3p1_fast_first_last_frame_image_to_video_webhook(args).await
    }
  };

  let webhook_response = webhook_response
    .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

  Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
  }))
}

fn to_t2v_duration(d: FalVeo3p1Duration) -> EnqueueVeo3p1FastTextToVideoDurationSeconds {
  match d {
    FalVeo3p1Duration::Four => EnqueueVeo3p1FastTextToVideoDurationSeconds::Four,
    FalVeo3p1Duration::Six => EnqueueVeo3p1FastTextToVideoDurationSeconds::Six,
    FalVeo3p1Duration::Eight => EnqueueVeo3p1FastTextToVideoDurationSeconds::Eight,
  }
}

fn to_t2v_aspect_ratio(a: FalVeo3p1AspectRatio) -> EnqueueVeo3p1FastTextToVideoAspectRatio {
  match a {
    FalVeo3p1AspectRatio::Auto => EnqueueVeo3p1FastTextToVideoAspectRatio::Auto,
    FalVeo3p1AspectRatio::SixteenByNine => EnqueueVeo3p1FastTextToVideoAspectRatio::SixteenByNine,
    FalVeo3p1AspectRatio::NineBySixteen => EnqueueVeo3p1FastTextToVideoAspectRatio::NineBySixteen,
  }
}

fn to_t2v_resolution(r: FalVeo3p1Resolution) -> EnqueueVeo3p1FastTextToVideoResolution {
  match r {
    FalVeo3p1Resolution::SevenTwentyP => EnqueueVeo3p1FastTextToVideoResolution::SevenTwentyP,
    FalVeo3p1Resolution::TenEightyP => EnqueueVeo3p1FastTextToVideoResolution::TenEightyP,
  }
}

fn to_i2v_duration(d: FalVeo3p1Duration) -> EnqueueVeo3p1FastImageToVideoDurationSeconds {
  match d {
    FalVeo3p1Duration::Four => EnqueueVeo3p1FastImageToVideoDurationSeconds::Four,
    FalVeo3p1Duration::Six => EnqueueVeo3p1FastImageToVideoDurationSeconds::Six,
    FalVeo3p1Duration::Eight => EnqueueVeo3p1FastImageToVideoDurationSeconds::Eight,
  }
}

fn to_i2v_aspect_ratio(a: FalVeo3p1AspectRatio) -> EnqueueVeo3p1FastImageToVideoAspectRatio {
  match a {
    FalVeo3p1AspectRatio::Auto => EnqueueVeo3p1FastImageToVideoAspectRatio::Auto,
    FalVeo3p1AspectRatio::SixteenByNine => EnqueueVeo3p1FastImageToVideoAspectRatio::SixteenByNine,
    FalVeo3p1AspectRatio::NineBySixteen => EnqueueVeo3p1FastImageToVideoAspectRatio::NineBySixteen,
  }
}

fn to_i2v_resolution(r: FalVeo3p1Resolution) -> EnqueueVeo3p1FastImageToVideoResolution {
  match r {
    FalVeo3p1Resolution::SevenTwentyP => EnqueueVeo3p1FastImageToVideoResolution::SevenTwentyP,
    FalVeo3p1Resolution::TenEightyP => EnqueueVeo3p1FastImageToVideoResolution::TenEightyP,
  }
}

fn to_flf_duration(d: FalVeo3p1Duration) -> EnqueueVeo3p1FastFirstLastFrameImageToVideoDurationSeconds {
  match d {
    FalVeo3p1Duration::Four => EnqueueVeo3p1FastFirstLastFrameImageToVideoDurationSeconds::Four,
    FalVeo3p1Duration::Six => EnqueueVeo3p1FastFirstLastFrameImageToVideoDurationSeconds::Six,
    FalVeo3p1Duration::Eight => EnqueueVeo3p1FastFirstLastFrameImageToVideoDurationSeconds::Eight,
  }
}

fn to_flf_aspect_ratio(a: FalVeo3p1AspectRatio) -> EnqueueVeo3p1FastFirstLastFrameImageToVideoAspectRatio {
  match a {
    FalVeo3p1AspectRatio::Auto => EnqueueVeo3p1FastFirstLastFrameImageToVideoAspectRatio::Auto,
    FalVeo3p1AspectRatio::SixteenByNine => EnqueueVeo3p1FastFirstLastFrameImageToVideoAspectRatio::SixteenByNine,
    FalVeo3p1AspectRatio::NineBySixteen => EnqueueVeo3p1FastFirstLastFrameImageToVideoAspectRatio::NineBySixteen,
  }
}

fn to_flf_resolution(r: FalVeo3p1Resolution) -> EnqueueVeo3p1FastFirstLastFrameImageToVideoResolution {
  match r {
    FalVeo3p1Resolution::SevenTwentyP => EnqueueVeo3p1FastFirstLastFrameImageToVideoResolution::SevenTwentyP,
    FalVeo3p1Resolution::TenEightyP => EnqueueVeo3p1FastFirstLastFrameImageToVideoResolution::TenEightyP,
  }
}

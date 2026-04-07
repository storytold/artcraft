use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_3p0_pro::{
  FalKling3p0AspectRatio, FalKling3p0Duration, FalKling3p0Mode,
};
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_3p0_standard::PlanFalKling3p0Standard;
use fal_client::requests::webhook::video::image::enqueue_kling_3p0_standard_image_to_video_webhook::{
  enqueue_kling_3p0_standard_image_to_video_webhook, EnqueueKling3p0StandardImageToVideoArgs,
  EnqueueKling3p0StandardImageToVideoAspectRatio, EnqueueKling3p0StandardImageToVideoDuration,
};
use fal_client::requests::webhook::video::text::enqueue_kling_3p0_standard_text_to_video_webhook::{
  enqueue_kling_3p0_standard_text_to_video_webhook, EnqueueKling3p0StandardTextToVideoArgs,
  EnqueueKling3p0StandardTextToVideoAspectRatio, EnqueueKling3p0StandardTextToVideoDuration,
};

pub async fn execute_fal_kling_3p0_standard(
  plan: &PlanFalKling3p0Standard,
  fal_client: &RouterFalClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let webhook_response = match &plan.mode {
    FalKling3p0Mode::TextToVideo => {
      let args = EnqueueKling3p0StandardTextToVideoArgs {
        prompt: plan.prompt.clone(),
        generate_audio: plan.generate_audio,
        negative_prompt: plan.negative_prompt.clone(),
        duration: plan.duration.map(to_t2v_duration),
        aspect_ratio: plan.aspect_ratio.map(to_t2v_aspect_ratio),
        shot_type: None,
        webhook_url: fal_client.webhook_url.as_str(),
        api_key: &fal_client.api_key,
      };
      enqueue_kling_3p0_standard_text_to_video_webhook(args).await
    }
    FalKling3p0Mode::ImageToVideo { image_url, end_image_url } => {
      let args = EnqueueKling3p0StandardImageToVideoArgs {
        prompt: plan.prompt.clone(),
        image_url: image_url.clone(),
        end_image_url: end_image_url.clone(),
        generate_audio: plan.generate_audio,
        negative_prompt: plan.negative_prompt.clone(),
        duration: plan.duration.map(to_i2v_duration),
        aspect_ratio: plan.aspect_ratio.map(to_i2v_aspect_ratio),
        shot_type: None,
        webhook_url: fal_client.webhook_url.as_str(),
        api_key: &fal_client.api_key,
      };
      enqueue_kling_3p0_standard_image_to_video_webhook(args).await
    }
  };

  let webhook_response = webhook_response
    .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

  Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
  }))
}

fn to_t2v_duration(d: FalKling3p0Duration) -> EnqueueKling3p0StandardTextToVideoDuration {
  use EnqueueKling3p0StandardTextToVideoDuration as D;
  match d.0 {
    3 => D::ThreeSeconds,
    4 => D::FourSeconds,
    5 => D::FiveSeconds,
    6 => D::SixSeconds,
    7 => D::SevenSeconds,
    8 => D::EightSeconds,
    9 => D::NineSeconds,
    10 => D::TenSeconds,
    11 => D::ElevenSeconds,
    12 => D::TwelveSeconds,
    13 => D::ThirteenSeconds,
    14 => D::FourteenSeconds,
    _ => D::FifteenSeconds,
  }
}

fn to_i2v_duration(d: FalKling3p0Duration) -> EnqueueKling3p0StandardImageToVideoDuration {
  use EnqueueKling3p0StandardImageToVideoDuration as D;
  match d.0 {
    3 => D::ThreeSeconds,
    4 => D::FourSeconds,
    5 => D::FiveSeconds,
    6 => D::SixSeconds,
    7 => D::SevenSeconds,
    8 => D::EightSeconds,
    9 => D::NineSeconds,
    10 => D::TenSeconds,
    11 => D::ElevenSeconds,
    12 => D::TwelveSeconds,
    13 => D::ThirteenSeconds,
    14 => D::FourteenSeconds,
    _ => D::FifteenSeconds,
  }
}

fn to_t2v_aspect_ratio(a: FalKling3p0AspectRatio) -> EnqueueKling3p0StandardTextToVideoAspectRatio {
  match a {
    FalKling3p0AspectRatio::Square => EnqueueKling3p0StandardTextToVideoAspectRatio::Square,
    FalKling3p0AspectRatio::SixteenByNine => EnqueueKling3p0StandardTextToVideoAspectRatio::SixteenByNine,
    FalKling3p0AspectRatio::NineBySixteen => EnqueueKling3p0StandardTextToVideoAspectRatio::NineBySixteen,
  }
}

fn to_i2v_aspect_ratio(a: FalKling3p0AspectRatio) -> EnqueueKling3p0StandardImageToVideoAspectRatio {
  match a {
    FalKling3p0AspectRatio::Square => EnqueueKling3p0StandardImageToVideoAspectRatio::Square,
    FalKling3p0AspectRatio::SixteenByNine => EnqueueKling3p0StandardImageToVideoAspectRatio::SixteenByNine,
    FalKling3p0AspectRatio::NineBySixteen => EnqueueKling3p0StandardImageToVideoAspectRatio::NineBySixteen,
  }
}

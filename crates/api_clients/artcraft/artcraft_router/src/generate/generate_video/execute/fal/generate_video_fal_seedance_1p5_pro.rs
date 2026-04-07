use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_seedance_1p5_pro::{
  FalSeedance1p5ProAspectRatio, FalSeedance1p5ProDuration, FalSeedance1p5ProMode,
  FalSeedance1p5ProResolution, PlanFalSeedance1p5Pro,
};
use fal_client::requests::webhook::video::image::enqueue_seedance_1p5_pro_image_to_video_webhook::{
  enqueue_seedance_1p5_pro_image_to_video_webhook, EnqueueSeedance1p5ProImageToVideoArgs,
  EnqueueSeedance1p5ProImageToVideoAspectRatio, EnqueueSeedance1p5ProImageToVideoDuration,
  EnqueueSeedance1p5ProImageToVideoResolution,
};
use fal_client::requests::webhook::video::text::enqueue_seedance_1p5_pro_text_to_video_webhook::{
  enqueue_seedance_1p5_pro_text_to_video_webhook, EnqueueSeedance1p5ProTextToVideoArgs,
  EnqueueSeedance1p5ProTextToVideoAspectRatio, EnqueueSeedance1p5ProTextToVideoDuration,
  EnqueueSeedance1p5ProTextToVideoResolution,
};

pub async fn execute_fal_seedance_1p5_pro(
  plan: &PlanFalSeedance1p5Pro,
  fal_client: &RouterFalClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let webhook_response = match &plan.mode {
    FalSeedance1p5ProMode::TextToVideo => {
      let args = EnqueueSeedance1p5ProTextToVideoArgs {
        prompt: plan.prompt.clone(),
        resolution: plan.resolution.map(to_t2v_resolution),
        duration: plan.duration.map(to_t2v_duration),
        aspect_ratio: plan.aspect_ratio.map(to_t2v_aspect_ratio),
        generate_audio: plan.generate_audio,
        webhook_url: fal_client.webhook_url.as_str(),
        api_key: &fal_client.api_key,
      };
      enqueue_seedance_1p5_pro_text_to_video_webhook(args).await
    }
    FalSeedance1p5ProMode::ImageToVideo { image_url, end_image_url } => {
      let args = EnqueueSeedance1p5ProImageToVideoArgs {
        prompt: plan.prompt.clone(),
        image_url: image_url.clone(),
        end_image_url: end_image_url.clone(),
        resolution: plan.resolution.map(to_i2v_resolution),
        duration: plan.duration.map(to_i2v_duration),
        aspect_ratio: plan.aspect_ratio.map(to_i2v_aspect_ratio),
        generate_audio: plan.generate_audio,
        webhook_url: fal_client.webhook_url.as_str(),
        api_key: &fal_client.api_key,
      };
      enqueue_seedance_1p5_pro_image_to_video_webhook(args).await
    }
  };

  let webhook_response = webhook_response
    .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

  Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
  }))
}

fn to_t2v_resolution(r: FalSeedance1p5ProResolution) -> EnqueueSeedance1p5ProTextToVideoResolution {
  match r {
    FalSeedance1p5ProResolution::FourEightyP => EnqueueSeedance1p5ProTextToVideoResolution::FourEightyP,
    FalSeedance1p5ProResolution::SevenTwentyP => EnqueueSeedance1p5ProTextToVideoResolution::SevenTwentyP,
    FalSeedance1p5ProResolution::TenEightyP => EnqueueSeedance1p5ProTextToVideoResolution::TenEightyP,
  }
}

fn to_t2v_duration(d: FalSeedance1p5ProDuration) -> EnqueueSeedance1p5ProTextToVideoDuration {
  use EnqueueSeedance1p5ProTextToVideoDuration as T;
  match d {
    FalSeedance1p5ProDuration::Four => T::FourSeconds,
    FalSeedance1p5ProDuration::Five => T::FiveSeconds,
    FalSeedance1p5ProDuration::Six => T::SixSeconds,
    FalSeedance1p5ProDuration::Seven => T::SevenSeconds,
    FalSeedance1p5ProDuration::Eight => T::EightSeconds,
    FalSeedance1p5ProDuration::Nine => T::NineSeconds,
    FalSeedance1p5ProDuration::Ten => T::TenSeconds,
    FalSeedance1p5ProDuration::Eleven => T::ElevenSeconds,
    FalSeedance1p5ProDuration::Twelve => T::TwelveSeconds,
  }
}

fn to_t2v_aspect_ratio(a: FalSeedance1p5ProAspectRatio) -> EnqueueSeedance1p5ProTextToVideoAspectRatio {
  use EnqueueSeedance1p5ProTextToVideoAspectRatio as T;
  match a {
    FalSeedance1p5ProAspectRatio::Auto => T::Auto,
    FalSeedance1p5ProAspectRatio::TwentyOneByNine => T::TwentyOneByNine,
    FalSeedance1p5ProAspectRatio::SixteenByNine => T::SixteenByNine,
    FalSeedance1p5ProAspectRatio::FourByThree => T::FourByThree,
    FalSeedance1p5ProAspectRatio::Square => T::Square,
    FalSeedance1p5ProAspectRatio::ThreeByFour => T::ThreeByFour,
    FalSeedance1p5ProAspectRatio::NineBySixteen => T::NineBySixteen,
  }
}

fn to_i2v_resolution(r: FalSeedance1p5ProResolution) -> EnqueueSeedance1p5ProImageToVideoResolution {
  match r {
    FalSeedance1p5ProResolution::FourEightyP => EnqueueSeedance1p5ProImageToVideoResolution::FourEightyP,
    FalSeedance1p5ProResolution::SevenTwentyP => EnqueueSeedance1p5ProImageToVideoResolution::SevenTwentyP,
    FalSeedance1p5ProResolution::TenEightyP => EnqueueSeedance1p5ProImageToVideoResolution::TenEightyP,
  }
}

fn to_i2v_duration(d: FalSeedance1p5ProDuration) -> EnqueueSeedance1p5ProImageToVideoDuration {
  use EnqueueSeedance1p5ProImageToVideoDuration as T;
  match d {
    FalSeedance1p5ProDuration::Four => T::FourSeconds,
    FalSeedance1p5ProDuration::Five => T::FiveSeconds,
    FalSeedance1p5ProDuration::Six => T::SixSeconds,
    FalSeedance1p5ProDuration::Seven => T::SevenSeconds,
    FalSeedance1p5ProDuration::Eight => T::EightSeconds,
    FalSeedance1p5ProDuration::Nine => T::NineSeconds,
    FalSeedance1p5ProDuration::Ten => T::TenSeconds,
    FalSeedance1p5ProDuration::Eleven => T::ElevenSeconds,
    FalSeedance1p5ProDuration::Twelve => T::TwelveSeconds,
  }
}

fn to_i2v_aspect_ratio(a: FalSeedance1p5ProAspectRatio) -> EnqueueSeedance1p5ProImageToVideoAspectRatio {
  use EnqueueSeedance1p5ProImageToVideoAspectRatio as T;
  match a {
    FalSeedance1p5ProAspectRatio::Auto => T::Auto,
    FalSeedance1p5ProAspectRatio::TwentyOneByNine => T::TwentyOneByNine,
    FalSeedance1p5ProAspectRatio::SixteenByNine => T::SixteenByNine,
    FalSeedance1p5ProAspectRatio::FourByThree => T::FourByThree,
    FalSeedance1p5ProAspectRatio::Square => T::Square,
    FalSeedance1p5ProAspectRatio::ThreeByFour => T::ThreeByFour,
    FalSeedance1p5ProAspectRatio::NineBySixteen => T::NineBySixteen,
  }
}

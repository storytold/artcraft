use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::video::image::http_veo_3_fast_image_to_video::{veo_3_fast_image_to_video, Veo3FastImageToVideoInput};
use crate::requests::core_api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct Veo3FastArgs<'a, R: IntoUrl> {
  pub request: Veo3FastRequest,
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Clone, Debug)]
pub struct Veo3FastRequest {
  pub prompt: String,
  pub image_url: String,
  pub aspect_ratio: Veo3FastAspectRatio,
  pub duration: Veo3FastDuration,
  pub resolution: Veo3FastResolution,
  pub generate_audio: bool,
}

#[derive(Copy, Clone, Debug)]
pub enum Veo3FastDuration {
  Default, // NB: Defaults to 8 seconds.
  FourSeconds,
  SixSeconds,
  EightSeconds,
}

#[derive(Copy, Clone, Debug)]
pub enum Veo3FastAspectRatio {
  Auto,
  WideSixteenNine, // 16:9
  TallNineSixteen, // 9:16
}

#[derive(Copy, Clone, Debug)]
pub enum Veo3FastResolution {
  Default,
  SevenTwentyP,
  TenEightyP,
}

impl FalRequestCostCalculator for Veo3FastRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "For every second of video you generated, you will be charged
    // $0.10 (audio off) or $0.15 (audio on).
    // For example, a 5s video with audio on will cost $0.75."
    match (self.duration, self.generate_audio) {
      (Veo3FastDuration::FourSeconds, false) => 40,
      (Veo3FastDuration::SixSeconds, false) => 60,
      (Veo3FastDuration::EightSeconds, false) => 80,
      (Veo3FastDuration::Default, false) => 80, // NB: Default is 8 seconds
      (Veo3FastDuration::FourSeconds, true) => 60,
      (Veo3FastDuration::SixSeconds, true) => 90,
      (Veo3FastDuration::EightSeconds, true) => 120,
      (Veo3FastDuration::Default, true) => 120, // NB: Default is 8 seconds
    }
  }
}


/// Veo 3 Fast Image-to-Video
/// https://fal.ai/models/fal-ai/veo3/fast/image-to-video
pub async fn enqueue_veo_3_fast_image_to_video_webhook<R: IntoUrl>(
  args: Veo3FastArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {
  let req = args.request;

  let duration = match req.duration {
    Veo3FastDuration::Default => None, // NB: Defaults to 8.
    Veo3FastDuration::FourSeconds => Some("4s".to_string()),
    Veo3FastDuration::SixSeconds => Some("6s".to_string()),
    Veo3FastDuration::EightSeconds => Some("8s".to_string()),
  };

  let aspect_ratio = match req.aspect_ratio {
    Veo3FastAspectRatio::Auto => Some("auto".to_string()),
    Veo3FastAspectRatio::WideSixteenNine => Some("16:9".to_string()),
    Veo3FastAspectRatio::TallNineSixteen => Some("9:16".to_string()),
  };

  let resolution = match req.resolution {
    Veo3FastResolution::Default => None,
    Veo3FastResolution::SevenTwentyP => Some("720p".to_string()),
    Veo3FastResolution::TenEightyP => Some("1080p".to_string()),
  };

  let request = Veo3FastImageToVideoInput {
    image_url: req.image_url,
    prompt: req.prompt,
    aspect_ratio,
    resolution,
    duration,
    generate_audio: Some(req.generate_audio),
  };

  let result = veo_3_fast_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}


#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::image::enqueue_veo_3_fast_image_to_video_webhook::{enqueue_veo_3_fast_image_to_video_webhook, Veo3FastArgs, Veo3FastAspectRatio, Veo3FastDuration, Veo3FastRequest, Veo3FastResolution};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::ERNEST_GHOST_TREX_IMAGE_URL;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    let image_url = ERNEST_GHOST_TREX_IMAGE_URL;

    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Veo3FastArgs {
      request: Veo3FastRequest {
        image_url: image_url.to_string(),
        prompt: "man is standing next to a ghost and t-rex, they begin to chase him as the camera pulls back to show the wider scene".to_string(),
        aspect_ratio: Veo3FastAspectRatio::WideSixteenNine,
        duration: Veo3FastDuration::EightSeconds,
        generate_audio: true,
        resolution: Veo3FastResolution::TenEightyP,
      },
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_veo_3_fast_image_to_video_webhook(args).await?;

    Ok(())
  }
}

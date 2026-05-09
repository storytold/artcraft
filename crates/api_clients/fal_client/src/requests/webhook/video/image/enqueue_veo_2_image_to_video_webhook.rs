use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::core_api::webhook_response::WebhookResponse;
use crate::requests::http::video::image::http_veo_2_image_to_video::{veo_2_image_to_video, Veo2ImageToVideoInput};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use reqwest::IntoUrl;

pub struct Veo2Args<'a, R: IntoUrl> {
  pub request: Veo2Request,
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

/// Args for Veo 2 image-to-video. Note: image-to-video does NOT support
/// aspect_ratio — the output inherits the source image's aspect ratio.
#[derive(Clone, Debug)]
pub struct Veo2Request {
  pub image_url: String,
  pub prompt: String,
  pub duration: Veo2Duration,
}

#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum Veo2Duration {
  Default, // NB: Default is 5 seconds
  FiveSeconds,
  SixSeconds,
  SevenSeconds,
  EightSeconds,
}

/// Aspect ratio enum — used by the text-to-video endpoint only.
/// Kept here because it's the canonical location that the text-to-video
/// webhook and the router plan both re-export from.
#[derive(Copy, Clone, Debug)]
pub enum Veo2AspectRatio {
  Auto,
  AutoPreferPortrait,
  WideSixteenNine, // 16:9
  TallNineSixteen, // 9:16
}

impl FalRequestCostCalculator for Veo2Request {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "For 5s video your request will cost $2.50.
    // For every aditional second you will be charged $0.50."
    match self.duration {
      Veo2Duration::Default => 250,
      Veo2Duration::FiveSeconds => 250,
      Veo2Duration::SixSeconds => 300,
      Veo2Duration::SevenSeconds => 350,
      Veo2Duration::EightSeconds => 400,
    }
  }
}


/// Veo 2 Image-to-Video
/// https://fal.ai/models/fal-ai/veo2/image-to-video
pub async fn enqueue_veo_2_image_to_video_webhook<R: IntoUrl>(
  args: Veo2Args<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {
  let req = args.request;

  let duration = match req.duration {
    Veo2Duration::Default => None, // NB: Default is 5 seconds.
    Veo2Duration::FiveSeconds => Some("5s".to_string()),
    Veo2Duration::SixSeconds => Some("6s".to_string()),
    Veo2Duration::SevenSeconds => Some("7s".to_string()),
    Veo2Duration::EightSeconds => Some("8s".to_string()),
  };

  let request = Veo2ImageToVideoInput {
    image_url: req.image_url,
    prompt: req.prompt,
    duration,
  };

  let result = veo_2_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}


#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::image::enqueue_veo_2_image_to_video_webhook::{enqueue_veo_2_image_to_video_webhook, Veo2Args, Veo2Duration, Veo2Request};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::MOUNTAIN_TREE_IMAGE_URL;

  #[tokio::test]
  #[ignore]
  async fn test_veo_2_image_to_video() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Veo2Args {
      request: Veo2Request {
        image_url: MOUNTAIN_TREE_IMAGE_URL.to_string(),
        prompt: "a shot of the mountains as the sun sets and reveals the moon and stars".to_string(),
        duration: Veo2Duration::Default,
      },
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_veo_2_image_to_video_webhook(args).await?;

    Ok(())
  }
}

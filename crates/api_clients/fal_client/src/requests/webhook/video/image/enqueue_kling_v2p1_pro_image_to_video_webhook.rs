use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::video::image::http_kling_v2p1_pro_image_to_video::{kling_v2p1_pro_image_to_video, KlingV2p1ProImageToVideoInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct Kling2p1ProArgs<'a, U: IntoUrl, T: IntoUrl, V: IntoUrl> {
  pub image_url: U,
  pub end_frame_image_url: Option<T>,
  pub webhook_url: V,
  pub prompt: &'a str,
  pub api_key: &'a FalApiKey,
  pub duration: Kling2p1ProDuration,
  pub aspect_ratio: Kling2p1ProAspectRatio,
}

#[derive(Copy, Clone, Debug)]
pub enum Kling2p1ProDuration {
  Default,
  FiveSeconds,
  TenSeconds,
}

#[derive(Copy, Clone, Debug)]
pub enum Kling2p1ProAspectRatio {
  Square, // 1:1
  WideSixteenNine, // 16:9
  TallNineSixteen, // 9:16
}

impl <U: IntoUrl, T: IntoUrl, V: IntoUrl> FalRequestCostCalculator for Kling2p1ProArgs<'_, U, T, V> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "For 5s video your request will cost $0.45.
    //  For every additional second you will be charged $0.09."
    match self.duration {
      Kling2p1ProDuration::Default => 45, // $0.45
      Kling2p1ProDuration::FiveSeconds => 45, // $0.45
      Kling2p1ProDuration::TenSeconds => 90, // $0.45 + (5 * 0.09) = $0.90
    }
  }
}

/// Kling 2.1 Pro Image-to-Video
/// https://fal.ai/models/fal-ai/kling-video/v2.1/pro/image-to-video
pub async fn enqueue_kling_v2p1_pro_image_to_video_webhook<U: IntoUrl, T: IntoUrl, V: IntoUrl>(
  args: Kling2p1ProArgs<'_, U, T, V>
) -> Result<WebhookResponse, FalErrorPlus> {
  let duration = match args.duration {
    Kling2p1ProDuration::Default => None, // Defaults to 5 seconds
    Kling2p1ProDuration::FiveSeconds => Some("5".to_string()), // Gross...
    Kling2p1ProDuration::TenSeconds => Some("10".to_string()),
  };
  
  let aspect_ratio = match args.aspect_ratio {
    Kling2p1ProAspectRatio::Square => Some("1:1".to_string()),
    Kling2p1ProAspectRatio::WideSixteenNine => Some("16:9".to_string()),
    Kling2p1ProAspectRatio::TallNineSixteen => Some("9:16".to_string()),
  };

  let image_url = args.image_url.as_str().to_string();

  let tail_image_url = args.end_frame_image_url
      .map(|url| url.as_str().to_string());

  let request = KlingV2p1ProImageToVideoInput {
    image_url,
    prompt: args.prompt.to_string(),
    tail_image_url,
    aspect_ratio,
    duration,
    // Maybe expose these later
    cfg_scale: None,
    negative_prompt: None,
  };

  let result = kling_v2p1_pro_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::image::enqueue_kling_v2p1_pro_image_to_video_webhook::{enqueue_kling_v2p1_pro_image_to_video_webhook, Kling2p1ProArgs, Kling2p1ProAspectRatio, Kling2p1ProDuration};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{JUNO_AT_LAKE_IMAGE_URL, SUPER_WIDE_FALL_MOUNTAINS_IMAGE_URL};

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Kling2p1ProArgs {
      image_url: SUPER_WIDE_FALL_MOUNTAINS_IMAGE_URL,
      end_frame_image_url: Some(JUNO_AT_LAKE_IMAGE_URL.to_string()),
      prompt: "a shot of the mountains, the camera pulls back to show a corgi waiting to jump into the lake",
      api_key: &api_key,
      duration: Kling2p1ProDuration::Default,
      aspect_ratio: Kling2p1ProAspectRatio::WideSixteenNine,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_kling_v2p1_pro_image_to_video_webhook(args).await?;

    Ok(())
  }
}

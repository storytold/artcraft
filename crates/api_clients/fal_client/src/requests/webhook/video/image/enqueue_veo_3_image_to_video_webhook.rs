use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::video::image::http_veo_3_image_to_video::{veo_3_image_to_video, Veo3ImageToVideoInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct Veo3Args<'a, U: IntoUrl, V: IntoUrl> {
  pub image_url: U,
  pub prompt: &'a str,
  pub duration: Veo3I2vDuration,
  pub aspect_ratio: Veo3I2vAspectRatio,
  pub resolution: Veo3I2vResolution,
  pub generate_audio: bool,
  pub api_key: &'a FalApiKey,
  pub webhook_url: V,
}

/// Duration for Veo 3 image-to-video. Default is 8 seconds.
#[derive(Copy, Clone, Debug)]
pub enum Veo3I2vDuration {
  Default, // Default is 8 seconds
  FourSeconds,
  SixSeconds,
  EightSeconds,
}

/// Aspect ratio for Veo 3 image-to-video.
/// Supports Auto (inherit source), 16:9, and 9:16. No Square.
#[derive(Copy, Clone, Debug)]
pub enum Veo3I2vAspectRatio {
  Auto,
  WideSixteenNine, // 16:9
  TallNineSixteen, // 9:16
}

/// Resolution for Veo 3 image-to-video.
#[derive(Copy, Clone, Debug)]
pub enum Veo3I2vResolution {
  Default,
  SevenTwentyP,
  TenEightyP,
}

impl <U: IntoUrl, V: IntoUrl> FalRequestCostCalculator for Veo3Args<'_, U, V> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "For every second of video you generated, you will be charged
    //  $0.20 (audio off) or
    //  $0.40 (audio on).
    //  For example, a 5s video with audio on will cost $2."

    match (self.duration, self.generate_audio) {
      (Veo3I2vDuration::FourSeconds, false) => 80,
      (Veo3I2vDuration::SixSeconds, false) => 120,
      (Veo3I2vDuration::EightSeconds, false) => 160,
      (Veo3I2vDuration::Default, false) => 160,
      (Veo3I2vDuration::FourSeconds, true) => 160,
      (Veo3I2vDuration::SixSeconds, true) => 240,
      (Veo3I2vDuration::EightSeconds, true) => 320,
      (Veo3I2vDuration::Default, true) => 320,
    }
  }
}


/// Veo 3 Image-to-Video
/// https://fal.ai/models/fal-ai/veo3/image-to-video
pub async fn enqueue_veo_3_image_to_video_webhook<U: IntoUrl, V: IntoUrl>(
  args: Veo3Args<'_, U, V>
) -> Result<WebhookResponse, FalErrorPlus> {
  let duration = match args.duration {
    Veo3I2vDuration::Default => None,
    Veo3I2vDuration::FourSeconds => Some("4s".to_string()),
    Veo3I2vDuration::SixSeconds => Some("6s".to_string()),
    Veo3I2vDuration::EightSeconds => Some("8s".to_string()),
  };

  let aspect_ratio = match args.aspect_ratio {
    Veo3I2vAspectRatio::Auto => Some("auto".to_string()),
    Veo3I2vAspectRatio::WideSixteenNine => Some("16:9".to_string()),
    Veo3I2vAspectRatio::TallNineSixteen => Some("9:16".to_string()),
  };

  let resolution = match args.resolution {
    Veo3I2vResolution::Default => None,
    Veo3I2vResolution::SevenTwentyP => Some("720p".to_string()),
    Veo3I2vResolution::TenEightyP => Some("1080p".to_string()),
  };

  let image_url = args.image_url.as_str().to_string();

  let request = Veo3ImageToVideoInput {
    image_url,
    prompt: args.prompt.to_string(),
    aspect_ratio,
    resolution,
    duration,
    generate_audio: Some(args.generate_audio),
  };

  let result = veo_3_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}


#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::image::enqueue_veo_3_image_to_video_webhook::{
    enqueue_veo_3_image_to_video_webhook, Veo3Args, Veo3I2vAspectRatio, Veo3I2vDuration,
    Veo3I2vResolution,
  };
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::TREX_SKELETON_IMAGE_URL;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = Veo3Args {
      image_url: TREX_SKELETON_IMAGE_URL,
      prompt: "the t-rex skeleton starts walking towards the camera and roars",
      api_key: &api_key,
      duration: Veo3I2vDuration::EightSeconds,
      aspect_ratio: Veo3I2vAspectRatio::WideSixteenNine,
      resolution: Veo3I2vResolution::TenEightyP,
      generate_audio: true,
      webhook_url: "https://example.com/webhook",
    };

    let _result = enqueue_veo_3_image_to_video_webhook(args).await?;
    Ok(())
  }
}

use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::veo3::image_to_video_fast::{image_to_video_fast, ImageToVideoFastInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct Veo3FastArgs<'a, U: IntoUrl, V: IntoUrl> {
  pub prompt: &'a str,
  pub image_url: U,
  pub duration: Veo3FastDuration,
  pub api_key: &'a FalApiKey,
  pub resolution: Veo3FastResolution,
  pub generate_audio: bool,
  pub webhook_url: V,
}

#[derive(Copy, Clone, Debug)]
pub enum Veo3FastDuration {
  Default,
  EightSeconds,
}

#[derive(Copy, Clone, Debug)]
pub enum Veo3FastResolution {
  Default,
  SevenTwentyP,
  TenEightyP,
}

pub async fn enqueue_veo_3_fast_image_to_video_webhook<U: IntoUrl, V: IntoUrl>(
  args: Veo3FastArgs<'_, U, V>
) -> Result<WebhookResponse, FalErrorPlus> {
  let duration = match args.duration {
    Veo3FastDuration::Default => None,
    Veo3FastDuration::EightSeconds => Some("8s".to_string()),
  };
  
  let resolution= match args.resolution {
    Veo3FastResolution::Default => None,
    Veo3FastResolution::SevenTwentyP => Some("720p".to_string()),
    Veo3FastResolution::TenEightyP => Some("1080p".to_string()),
  };

  let image_url = args.image_url.as_str().to_string();

  let request = ImageToVideoFastInput {
    image_url,
    prompt: args.prompt.to_string(),
    resolution,
    duration,
    generate_audio: Some(args.generate_audio),
  };

  let result = image_to_video_fast(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}


#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::enqueue_veo_3_fast_image_to_video_webhook::{enqueue_veo_3_fast_image_to_video_webhook, Veo3FastArgs, Veo3FastDuration, Veo3FastResolution};
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
      image_url: image_url,
      prompt: "man is standing next to a ghost and t-rex, they begin to chase him as the camera pulls back to show the wider scene",
      api_key: &api_key,
      duration: Veo3FastDuration::EightSeconds,
      generate_audio: true,
      resolution: Veo3FastResolution::TenEightyP,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_veo_3_fast_image_to_video_webhook(args).await?;

    Ok(())
  }
}

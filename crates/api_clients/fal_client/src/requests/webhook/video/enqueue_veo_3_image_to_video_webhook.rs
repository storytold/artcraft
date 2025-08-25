use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::veo3::image_to_video::{image_to_video, ImageToVideoInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct Veo3Args<'a, U: IntoUrl, V: IntoUrl> {
  pub prompt: &'a str,
  pub image_url: U,
  pub duration: Veo3Duration,
  pub api_key: &'a FalApiKey,
  pub resolution: Veo3Resolution,
  pub generate_audio: bool,
  pub webhook_url: V,
}

#[derive(Copy, Clone, Debug)]
pub enum Veo3Duration {
  Default,
  EightSeconds,
}

#[derive(Copy, Clone, Debug)]
pub enum Veo3Resolution {
  Default,
  SevenTwentyP,
  TenEightyP,
}

pub async fn enqueue_veo_3_image_to_video_webhook<U: IntoUrl, V: IntoUrl>(
  args: Veo3Args<'_, U, V>
) -> Result<WebhookResponse, FalErrorPlus> {
  let duration = match args.duration {
    Veo3Duration::Default => None,
    Veo3Duration::EightSeconds => Some("8s".to_string()),
  };
  
  let resolution= match args.resolution {
    Veo3Resolution::Default => None,
    Veo3Resolution::SevenTwentyP => Some("720p".to_string()),
    Veo3Resolution::TenEightyP => Some("1080p".to_string()),
  };

  let image_url = args.image_url.as_str().to_string();

  let request = ImageToVideoInput {
    image_url,
    prompt: args.prompt.to_string(),
    resolution,
    duration,
    generate_audio: Some(args.generate_audio),
  };

  let result = image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}


#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::enqueue_veo_3_image_to_video_webhook::{enqueue_veo_3_image_to_video_webhook, Veo3Args, Veo3Duration, Veo3Resolution};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    let image_url = JUNO_AT_LAKE_IMAGE_URL;

    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Veo3Args {
      image_url: image_url,
      prompt: "corgi at the lake. the corgi barks. camera pulls back to show a wider shot of the lake as the corgi jumps into the water. there are sounds of barking and splashing. cinematic, 8k, ultra wide shot",
      api_key: &api_key,
      duration: Veo3Duration::EightSeconds,
      generate_audio: true,
      resolution: Veo3Resolution::TenEightyP,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_veo_3_image_to_video_webhook(args).await?;

    Ok(())
  }
}

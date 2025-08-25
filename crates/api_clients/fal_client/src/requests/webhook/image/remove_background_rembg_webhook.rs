use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::imageutils::rembg::{rembg, RemoveBackgroundInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct RemoveBackgroundRembgWebhookArgs<'a, U: IntoUrl, V: IntoUrl> {
  pub image_url: U, 
  pub webhook_url: V,
  pub api_key: &'a FalApiKey
}

pub async fn remove_background_rembg_webhook<U: IntoUrl, V: IntoUrl>(
  args: RemoveBackgroundRembgWebhookArgs<'_, U, V>
) -> Result<WebhookResponse, FalErrorPlus> {

  let image_url = args.image_url.into_url()?;
  
  let request = RemoveBackgroundInput {
    image_url: image_url.to_string(),
    crop_to_bbox: None,
    sync_mode: None
  };

  let result = rembg(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::remove_background_rembg_webhook::remove_background_rembg_webhook;
  use crate::requests::webhook::image::remove_background_rembg_webhook::RemoveBackgroundRembgWebhookArgs;
  use std::fs::read_to_string;
  use test_data::web::image_urls::ERNEST_SCARED_STUPID_IMAGE_URL;

  #[tokio::test]
  #[ignore] // NB: Manually test, don't run in CI!
  async fn test() -> anyhow::Result<()> {
    // XXX: Don't commit secrets!
    let api_key = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&api_key);
    
    let args = RemoveBackgroundRembgWebhookArgs {
      image_url: ERNEST_SCARED_STUPID_IMAGE_URL,
      webhook_url: "https://api.storyteller.ai/webhook",
      api_key: &api_key,
    };
    
    let response = remove_background_rembg_webhook(args).await?;

    println!("{:?}", response);

    Ok(())
  }
}

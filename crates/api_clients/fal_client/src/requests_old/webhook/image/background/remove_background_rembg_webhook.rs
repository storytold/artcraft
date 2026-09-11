use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests_old::http::image::background::http_rembg_remove_background::{rembg_remove_background, RembgRemoveBackgroundInput};
use crate::requests::core_api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct RemoveBackgroundRembgWebhookArgs<'a, V: IntoUrl> {
  pub request: RemoveBackgroundRembgWebhookRequest,
  pub webhook_url: V,
  pub api_key: &'a FalApiKey
}

#[derive(Clone, Debug)]
pub struct RemoveBackgroundRembgWebhookRequest {
  pub image_url: String,
}

pub async fn remove_background_rembg_webhook<V: IntoUrl>(
  args: RemoveBackgroundRembgWebhookArgs<'_, V>
) -> Result<WebhookResponse, FalErrorPlus> {

  let req = args.request;

  let request = RembgRemoveBackgroundInput {
    image_url: req.image_url,
    crop_to_bbox: None,
    sync_mode: None
  };

  let result = rembg_remove_background(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests_old::webhook::image::background::remove_background_rembg_webhook::remove_background_rembg_webhook;
  use crate::requests_old::webhook::image::background::remove_background_rembg_webhook::{RemoveBackgroundRembgWebhookArgs, RemoveBackgroundRembgWebhookRequest};
  use std::fs::read_to_string;
  use test_data::web::image_urls::ERNEST_SCARED_STUPID_IMAGE_URL;

  #[tokio::test]
  #[ignore] // NB: Manually test, don't run in CI!
  async fn test() -> anyhow::Result<()> {
    // XXX: Don't commit secrets!
    let api_key = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&api_key);

    let args = RemoveBackgroundRembgWebhookArgs {
      request: RemoveBackgroundRembgWebhookRequest {
        image_url: ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      },
      webhook_url: "https://api.storyteller.ai/webhook",
      api_key: &api_key,
    };

    let response = remove_background_rembg_webhook(args).await?;

    println!("{:?}", response);

    Ok(())
  }
}

use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::bytedance::seededit::edit_image_v3::seededit_v3_edit;
use fal::endpoints::fal_ai::bytedance::seededit::edit_image_v3::SeedEditV3Input;
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct SeedEditV3EditArgs<'a, U: IntoUrl, R: IntoUrl> {
  // Request required
  pub prompt: &'a str,
  pub image_url: U,
  
  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

pub async fn enqueue_seededit_v3_edit_webhook<U: IntoUrl, R: IntoUrl>(
  args: SeedEditV3EditArgs<'_, U, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let request = SeedEditV3Input {
    prompt: args.prompt.to_string(),
    image_url: args.image_url.as_str().to_string(),

    // Constants
    guidance_scale: None,
    enable_safety_checker: None,
  };

  let result = seededit_v3_edit(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::edit::enqueue_seededit_v3_edit_webhook::{enqueue_seededit_v3_edit_webhook, SeedEditV3EditArgs};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::MOUNTAIN_TREE_IMAGE_URL;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = SeedEditV3EditArgs {
      image_url: MOUNTAIN_TREE_IMAGE_URL,
      prompt: "put christmas lights on the tree, add snow to the mountains",
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_seededit_v3_edit_webhook(args).await?;

    Ok(())
  }
}

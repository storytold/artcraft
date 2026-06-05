use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests_old::http::image::edit::http_seededit_v3_edit::{seededit_v3_edit, SeedEditV3EditInput};
use crate::requests::core_api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct SeedEditV3EditArgs<'a, R: IntoUrl> {
  pub request: SeedEditV3EditRequest,
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Clone, Debug)]
pub struct SeedEditV3EditRequest {
  pub prompt: String,
  pub image_url: String,
}

pub async fn enqueue_seededit_v3_edit_webhook<R: IntoUrl>(
  args: SeedEditV3EditArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {
  let req = args.request;

  let request = SeedEditV3EditInput {
    prompt: req.prompt,
    image_url: req.image_url,

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
  use crate::requests_old::webhook::image::edit::enqueue_seededit_v3_edit_webhook::{enqueue_seededit_v3_edit_webhook, SeedEditV3EditArgs, SeedEditV3EditRequest};
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
      request: SeedEditV3EditRequest {
        prompt: "put christmas lights on the tree, add snow to the mountains".to_string(),
        image_url: MOUNTAIN_TREE_IMAGE_URL.to_string(),
      },
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_seededit_v3_edit_webhook(args).await?;

    Ok(())
  }
}

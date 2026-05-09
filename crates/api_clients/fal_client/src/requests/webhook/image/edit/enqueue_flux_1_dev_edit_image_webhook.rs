use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::image::edit::http_flux_1_dev_edit_image::{flux_1_dev_edit_image, Flux1DevEditImageInput};
use crate::requests::core_api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct Flux1DevEditImageArgs<'a, U: IntoUrl> {
  pub request: Flux1DevEditImageRequest,
  pub webhook_url: U,
  pub api_key: &'a FalApiKey,
}

#[derive(Clone, Debug)]
pub struct Flux1DevEditImageRequest {
  pub prompt: String,
  pub image_url: String,
  pub num_images: Flux1DevEditImageNumImages,
}

#[derive(Copy, Clone, Debug)]
pub enum Flux1DevEditImageNumImages {
  One,
  Two,
  Three,
  Four,
}

pub async fn enqueue_flux_1_dev_edit_image_webhook<U: IntoUrl>(
  args: Flux1DevEditImageArgs<'_, U>
) -> Result<WebhookResponse, FalErrorPlus> {
  let req = args.request;

  let num_images = match req.num_images {
    Flux1DevEditImageNumImages::One => 1,
    Flux1DevEditImageNumImages::Two => 2,
    Flux1DevEditImageNumImages::Three => 3,
    Flux1DevEditImageNumImages::Four => 4,
  };

  let request = Flux1DevEditImageInput {
    prompt: req.prompt,
    image_url: req.image_url,
    num_images: Some(num_images),
    enable_safety_checker: Some(false),
    output_format: Some("png".to_string()),
    ..Default::default()
  };

  let result = flux_1_dev_edit_image(request)
    .with_api_key(&args.api_key.0)
    .queue_webhook(args.webhook_url)
    .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::edit::enqueue_flux_1_dev_edit_image_webhook::{
    enqueue_flux_1_dev_edit_image_webhook, Flux1DevEditImageArgs, Flux1DevEditImageNumImages,
    Flux1DevEditImageRequest,
  };
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::GHOST_IMAGE_URL;

  #[tokio::test]
  #[ignore] // manually run — fires a real Fal API request
  async fn test_single_image() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = Flux1DevEditImageArgs {
      request: Flux1DevEditImageRequest {
        prompt: "make this image look like a watercolor painting".to_string(),
        image_url: GHOST_IMAGE_URL.to_string(),
        num_images: Flux1DevEditImageNumImages::One,
      },
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_flux_1_dev_edit_image_webhook(args).await?;
    assert!(result.request_id.is_some());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real Fal API request
  async fn test_batch_two() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = Flux1DevEditImageArgs {
      request: Flux1DevEditImageRequest {
        prompt: "turn this into a cyberpunk scene with neon lights".to_string(),
        image_url: GHOST_IMAGE_URL.to_string(),
        num_images: Flux1DevEditImageNumImages::Two,
      },
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_flux_1_dev_edit_image_webhook(args).await?;
    assert!(result.request_id.is_some());
    Ok(())
  }
}

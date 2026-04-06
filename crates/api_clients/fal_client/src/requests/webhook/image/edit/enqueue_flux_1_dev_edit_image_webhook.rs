use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::image::edit::http_flux_1_dev_edit_image::{flux_1_dev_edit_image, Flux1DevEditImageInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct Flux1DevEditImageArgs<'a, U: IntoUrl> {
  pub prompt: &'a str,
  pub image_url: String,
  pub num_images: Flux1DevEditImageNumImages,

  // Fulfillment
  pub webhook_url: U,
  pub api_key: &'a FalApiKey,
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
  let num_images = match args.num_images {
    Flux1DevEditImageNumImages::One => 1,
    Flux1DevEditImageNumImages::Two => 2,
    Flux1DevEditImageNumImages::Three => 3,
    Flux1DevEditImageNumImages::Four => 4,
  };

  let request = Flux1DevEditImageInput {
    prompt: args.prompt.to_string(),
    image_url: args.image_url,
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

use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::image::edit::http_flux_pro_kontext_max_edit::{flux_pro_kontext_max_edit, FluxProKontextMaxEditInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct FluxProKontextMaxArgs<'a, U: IntoUrl, R: IntoUrl> {
  // Request
  pub prompt: &'a str,
  pub image_url: U,
  pub num_images: FluxProKontextMaxNumImages,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum FluxProKontextMaxNumImages {
  One, // Default
  Two,
  Three,
  Four,
}

pub async fn enqueue_flux_pro_kontext_max_edit_webhook<U: IntoUrl, R: IntoUrl>(
  args: FluxProKontextMaxArgs<'_, U, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = match args.num_images {
    FluxProKontextMaxNumImages::One => 1,
    FluxProKontextMaxNumImages::Two => 2,
    FluxProKontextMaxNumImages::Three => 3,
    FluxProKontextMaxNumImages::Four => 4,
  };

  let request = FluxProKontextMaxEditInput {
    prompt: args.prompt.to_string(),
    image_url: args.image_url.as_str().to_string(),
    num_images: Some(num_images),

    // Maybe expose
    aspect_ratio: None,
    safety_tolerance: Some("5".to_string()), // NB: 5 is most tolerant
    output_format: Some("png".to_string()), // png or jpeg
    seed: None,

    // Constants
    sync_mode: None, // Synchronous / slow
  };

  let result = flux_pro_kontext_max_edit(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::edit::enqueue_flux_pro_kontext_max_edit_webhook::{enqueue_flux_pro_kontext_max_edit_webhook, FluxProKontextMaxArgs, FluxProKontextMaxNumImages};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::TALL_MOCHI_WITH_GLASSES_IMAGE_URL;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = FluxProKontextMaxArgs {
      image_url: TALL_MOCHI_WITH_GLASSES_IMAGE_URL,
      prompt: "turn the glasses into sunglasses, make them sleek sunglasses with black rims, square shaped",
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
      num_images: FluxProKontextMaxNumImages::One,
    };

    let result = enqueue_flux_pro_kontext_max_edit_webhook(args).await?;

    Ok(())
  }
}

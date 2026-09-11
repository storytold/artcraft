use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests_old::http::image::edit::http_flux_pro_kontext_max_edit::{flux_pro_kontext_max_edit, FluxProKontextMaxEditInput};
use crate::requests::core_api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct FluxProKontextMaxArgs<'a, R: IntoUrl> {
  pub request: FluxProKontextMaxRequest,
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Clone, Debug)]
pub struct FluxProKontextMaxRequest {
  pub prompt: String,
  pub image_url: String,
  pub num_images: FluxProKontextMaxNumImages,
}

#[derive(Copy, Clone, Debug)]
pub enum FluxProKontextMaxNumImages {
  One, // Default
  Two,
  Three,
  Four,
}

pub async fn enqueue_flux_pro_kontext_max_edit_webhook<R: IntoUrl>(
  args: FluxProKontextMaxArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {
  let req = args.request;

  let num_images = match req.num_images {
    FluxProKontextMaxNumImages::One => 1,
    FluxProKontextMaxNumImages::Two => 2,
    FluxProKontextMaxNumImages::Three => 3,
    FluxProKontextMaxNumImages::Four => 4,
  };

  let request = FluxProKontextMaxEditInput {
    prompt: req.prompt,
    image_url: req.image_url,
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
  use crate::requests_old::webhook::image::edit::enqueue_flux_pro_kontext_max_edit_webhook::{enqueue_flux_pro_kontext_max_edit_webhook, FluxProKontextMaxArgs, FluxProKontextMaxNumImages, FluxProKontextMaxRequest};
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
      request: FluxProKontextMaxRequest {
        prompt: "turn the glasses into sunglasses, make them sleek sunglasses with black rims, square shaped".to_string(),
        image_url: TALL_MOCHI_WITH_GLASSES_IMAGE_URL.to_string(),
        num_images: FluxProKontextMaxNumImages::One,
      },
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_flux_pro_kontext_max_edit_webhook(args).await?;

    Ok(())
  }
}

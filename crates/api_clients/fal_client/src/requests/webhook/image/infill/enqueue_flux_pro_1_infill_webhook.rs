use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::image::infill::http_flux_pro_1_infill::{flux_pro_1_infill, FluxPro1InfillInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct FluxPro1InfillArgs<'a, U: IntoUrl, R: IntoUrl, L: IntoUrl> {
  // Request
  pub prompt: &'a str,
  pub image_url: U,
  pub mask_url: R,
  pub num_images: FluxPro1InfillNumImages,

  // Fulfillment
  pub webhook_url: L,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum FluxPro1InfillNumImages {
  One, // Default
  Two,
  Three,
  Four,
}

pub async fn enqueue_flux_pro_1_infill_webhook<U: IntoUrl, R: IntoUrl, L: IntoUrl>(
  args: FluxPro1InfillArgs<'_, U, R, L>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = match args.num_images {
    FluxPro1InfillNumImages::One => 1,
    FluxPro1InfillNumImages::Two => 2,
    FluxPro1InfillNumImages::Three => 3,
    FluxPro1InfillNumImages::Four => 4,
  };

  let request = FluxPro1InfillInput {
    prompt: args.prompt.to_string(),
    image_url: args.image_url.as_str().to_string(),
    mask_url: args.mask_url.as_str().to_string(),
    num_images: Some(num_images),

    // Maybe expose
    safety_tolerance: Some("5".to_string()), // NB: 5 is most tolerant
    output_format: Some("png".to_string()), // png or jpeg
    seed: None,

    // Constants
    sync_mode: None, // Synchronous / slow
  };

  let result = flux_pro_1_infill(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::infill::enqueue_flux_pro_1_infill_webhook::{enqueue_flux_pro_1_infill_webhook, FluxPro1InfillArgs, FluxPro1InfillNumImages};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{TALL_MOCHI_WITH_GLASSES_GLASSES_MASK_IMAGE_URL, TALL_MOCHI_WITH_GLASSES_IMAGE_URL};

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = FluxPro1InfillArgs {
      image_url: TALL_MOCHI_WITH_GLASSES_IMAGE_URL,
      mask_url: TALL_MOCHI_WITH_GLASSES_GLASSES_MASK_IMAGE_URL,
      prompt: "slick sunglasses, cool glasses, reflection in glasses lenses",
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
      num_images: FluxPro1InfillNumImages::One,
    };

    let result = enqueue_flux_pro_1_infill_webhook(args).await?;

    Ok(())
  }
}

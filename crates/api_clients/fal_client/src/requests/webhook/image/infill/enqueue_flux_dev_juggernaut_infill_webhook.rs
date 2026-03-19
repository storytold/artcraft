use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::image::infill::http_flux_dev_juggernaut_infill::{flux_dev_juggernaut_infill, FluxDevJuggernautInfillInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct FluxDevJuggernautInfillArgs<'a, U: IntoUrl, R: IntoUrl, L: IntoUrl> {
  // Request
  pub prompt: &'a str,
  pub image_url: U,
  pub mask_url: R,
  pub num_images: FluxDevJuggernautInfillNumImages,

  // Fulfillment
  pub webhook_url: L,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum FluxDevJuggernautInfillNumImages {
  One, // Default
  Two,
  Three,
  Four,
}

pub async fn enqueue_flux_dev_juggernaut_infill_webhook<U: IntoUrl, R: IntoUrl, L: IntoUrl>(
  args: FluxDevJuggernautInfillArgs<'_, U, R, L>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = match args.num_images {
    FluxDevJuggernautInfillNumImages::One => 1,
    FluxDevJuggernautInfillNumImages::Two => 2,
    FluxDevJuggernautInfillNumImages::Three => 3,
    FluxDevJuggernautInfillNumImages::Four => 4,
  };

  let request = FluxDevJuggernautInfillInput {
    prompt: args.prompt.to_string(),
    image_url: args.image_url.as_str().to_string(),
    mask_url: args.mask_url.as_str().to_string(),
    num_images: Some(num_images),

    // Maybe expose
    output_format: Some("png".to_string()), // png or jpeg
    seed: None,
    strength: None,
    num_inference_steps: None,
    image_size: None,
    enable_safety_checker: None,
    guidance_scale: None,

    // Constants
    sync_mode: None, // Synchronous / slow
  };

  let result = flux_dev_juggernaut_infill(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::infill::enqueue_flux_dev_juggernaut_infill_webhook::{enqueue_flux_dev_juggernaut_infill_webhook, FluxDevJuggernautInfillArgs, FluxDevJuggernautInfillNumImages};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{TALL_MOCHI_WITH_GLASSES_GLASSES_MASK_IMAGE_URL, TALL_MOCHI_WITH_GLASSES_IMAGE_URL};

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = FluxDevJuggernautInfillArgs {
      image_url: TALL_MOCHI_WITH_GLASSES_IMAGE_URL,
      mask_url: TALL_MOCHI_WITH_GLASSES_GLASSES_MASK_IMAGE_URL,
      prompt: "slick sunglasses, cool glasses, reflection in glasses lenses",
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
      num_images: FluxDevJuggernautInfillNumImages::Two,
    };

    let result = enqueue_flux_dev_juggernaut_infill_webhook(args).await?;

    Ok(())
  }
}

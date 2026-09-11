use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests_old::http::image::text::http_flux_1_schnell_text_to_image::{flux_1_schnell_text_to_image, Flux1SchnellTextToImageInput};
use crate::requests::core_api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct Flux1SchnellArgs<'a, U: IntoUrl> {
  pub request: Flux1SchnellRequest,
  pub webhook_url: U,
  pub api_key: &'a FalApiKey,
}

#[derive(Clone, Debug)]
pub struct Flux1SchnellRequest {
  pub prompt: String,
  pub aspect_ratio: Flux1SchnellAspectRatio,
  pub num_images: Flux1SchnellNumImages,
}

#[derive(Copy, Clone, Debug)]
pub enum Flux1SchnellAspectRatio {
  Square, // 1:1
  SquareHd, // 1:1
  LandscapeFourByThree, // 4:3
  LandscapeSixteenByNine, // 16:9
  PortraitThreeByFour, // 3:4
  PortraitNineBySixteen, // 9:16
  //Custom { width: u32, height: u32 }, // TODO
}

#[derive(Copy, Clone, Debug)]
pub enum Flux1SchnellNumImages {
  One, // Default
  Two,
  Three,
  Four,
}

pub async fn enqueue_flux_1_schnell_text_to_image_webhook<U: IntoUrl>(
  args: Flux1SchnellArgs<'_, U>
) -> Result<WebhookResponse, FalErrorPlus> {

  let req = args.request;

  let num_images = match req.num_images {
    Flux1SchnellNumImages::One => 1,
    Flux1SchnellNumImages::Two => 2,
    Flux1SchnellNumImages::Three => 3,
    Flux1SchnellNumImages::Four => 4,
  };

  let image_size = match req.aspect_ratio {
    Flux1SchnellAspectRatio::Square => "square",
    Flux1SchnellAspectRatio::SquareHd => "square_hd",
    Flux1SchnellAspectRatio::LandscapeFourByThree => "landscape_4_3",
    Flux1SchnellAspectRatio::LandscapeSixteenByNine => "landscape_16_9",
    Flux1SchnellAspectRatio::PortraitThreeByFour => "portrait_4_3",
    Flux1SchnellAspectRatio::PortraitNineBySixteen => "portrait_16_9",
  };

  let request = Flux1SchnellTextToImageInput {
    prompt: req.prompt,
    num_images: Some(num_images),
    image_size: Some(image_size.to_string()),
    // Maybe abstract
    enable_safety_checker: Some(false),
    // Maybe expose
    seed: None,
    num_inference_steps: None,
    // Constants
    sync_mode: None, // Synchronous / slow
  };

  let result = flux_1_schnell_text_to_image(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests_old::webhook::image::text::enqueue_flux_1_schnell_text_to_image_webhook::{enqueue_flux_1_schnell_text_to_image_webhook, Flux1SchnellArgs, Flux1SchnellAspectRatio, Flux1SchnellNumImages, Flux1SchnellRequest};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Flux1SchnellArgs {
      request: Flux1SchnellRequest {
        prompt: "a giant robot fighting a dragon in a futuristic city".to_string(),
        num_images: Flux1SchnellNumImages::One,
        aspect_ratio: Flux1SchnellAspectRatio::LandscapeSixteenByNine,
      },
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_flux_1_schnell_text_to_image_webhook(args).await?;

    Ok(())
  }
}

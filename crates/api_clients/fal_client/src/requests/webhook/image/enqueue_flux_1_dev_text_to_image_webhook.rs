use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::flux::dev::dev;
use fal::endpoints::fal_ai::flux::dev::DevTextToImageInput;
use fal::prelude::fal_ai::flux::dev::ImageSizeProperty;
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct Flux1DevArgs<'a, U: IntoUrl> {
  pub prompt: &'a str,
  pub webhook_url: U,
  pub api_key: &'a FalApiKey,
  pub aspect_ratio: Flux1DevAspectRatio,
  pub num_images: Flux1DevNumImages,
}

#[derive(Copy, Clone, Debug)]
pub enum Flux1DevAspectRatio {
  Square, // 1:1
  SquareHd, // 1:1
  LandscapeFourByThree, // 4:3
  LandscapeSixteenByNine, // 16:9
  PortraitThreeByFour, // 3:4
  PortraitNineBySixteen, // 9:16
  //Custom { width: u32, height: u32 }, // TODO
}

#[derive(Copy, Clone, Debug)]
pub enum Flux1DevNumImages {
  One, // Default
  Two,
  Three,
  Four,
}

pub async fn enqueue_flux_1_dev_text_to_image_webhook<U: IntoUrl>(
  args: Flux1DevArgs<'_, U>
) -> Result<WebhookResponse, FalErrorPlus> {
  
  let num_images = match args.num_images {
    Flux1DevNumImages::One => 1,
    Flux1DevNumImages::Two => 2,
    Flux1DevNumImages::Three => 3,
    Flux1DevNumImages::Four => 4,
  };
  
  let image_size = match args.aspect_ratio {
    Flux1DevAspectRatio::Square => ImageSizeProperty::Square,
    Flux1DevAspectRatio::SquareHd => ImageSizeProperty::SquareHd,
    Flux1DevAspectRatio::LandscapeFourByThree => ImageSizeProperty::Landscape43,
    Flux1DevAspectRatio::LandscapeSixteenByNine => ImageSizeProperty::Landscape169,
    Flux1DevAspectRatio::PortraitThreeByFour => ImageSizeProperty::Portrait43,
    Flux1DevAspectRatio::PortraitNineBySixteen => ImageSizeProperty::Portrait169,
  };
  
  let request = DevTextToImageInput {
    prompt: args.prompt.to_string(),
    num_images: Some(num_images),
    image_size: Some(image_size),
    // Maybe abstract
    enable_safety_checker: Some(false),
    // Maybe expose
    seed: None,
    guidance_scale: None,
    num_inference_steps: None,
    // Constants
    sync_mode: None, // Synchronous / slow
  };
  
  let result = dev(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::enqueue_flux_1_dev_text_to_image_webhook::{enqueue_flux_1_dev_text_to_image_webhook, Flux1DevArgs, Flux1DevAspectRatio, Flux1DevNumImages};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Flux1DevArgs {
      prompt: "a giant robot fighting a dragon in a futuristic city",
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
      num_images: Flux1DevNumImages::One,
      aspect_ratio: Flux1DevAspectRatio::LandscapeFourByThree
    };

    let result = enqueue_flux_1_dev_text_to_image_webhook(args).await?;

    Ok(())
  }
}

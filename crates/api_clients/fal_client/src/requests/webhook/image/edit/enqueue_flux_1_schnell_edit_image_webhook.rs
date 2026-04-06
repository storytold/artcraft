use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::image::edit::http_flux_1_schnell_edit_image::{flux_1_schnell_edit_image, Flux1SchnellEditImageInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct Flux1SchnellEditImageArgs<'a, U: IntoUrl> {
  pub image_url: String,
  pub num_images: Flux1SchnellEditImageNumImages,
  pub image_size: Option<Flux1SchnellEditImageSize>,

  // Fulfillment
  pub webhook_url: U,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum Flux1SchnellEditImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum Flux1SchnellEditImageSize {
  Square,
  SquareHd,
  LandscapeFourByThree,
  LandscapeSixteenByNine,
  PortraitThreeByFour,
  PortraitNineBySixteen,
}

pub async fn enqueue_flux_1_schnell_edit_image_webhook<U: IntoUrl>(
  args: Flux1SchnellEditImageArgs<'_, U>
) -> Result<WebhookResponse, FalErrorPlus> {
  let num_images = match args.num_images {
    Flux1SchnellEditImageNumImages::One => 1,
    Flux1SchnellEditImageNumImages::Two => 2,
    Flux1SchnellEditImageNumImages::Three => 3,
    Flux1SchnellEditImageNumImages::Four => 4,
  };

  let image_size = args.image_size.map(|s| match s {
    Flux1SchnellEditImageSize::Square => "square",
    Flux1SchnellEditImageSize::SquareHd => "square_hd",
    Flux1SchnellEditImageSize::LandscapeFourByThree => "landscape_4_3",
    Flux1SchnellEditImageSize::LandscapeSixteenByNine => "landscape_16_9",
    Flux1SchnellEditImageSize::PortraitThreeByFour => "portrait_4_3",
    Flux1SchnellEditImageSize::PortraitNineBySixteen => "portrait_16_9",
  }.to_string());

  let request = Flux1SchnellEditImageInput {
    image_url: args.image_url,
    num_images: Some(num_images),
    image_size,
    enable_safety_checker: Some(false),
    output_format: Some("png".to_string()),
    ..Default::default()
  };

  let result = flux_1_schnell_edit_image(request)
    .with_api_key(&args.api_key.0)
    .queue_webhook(args.webhook_url)
    .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::edit::enqueue_flux_1_schnell_edit_image_webhook::{
    enqueue_flux_1_schnell_edit_image_webhook, Flux1SchnellEditImageArgs,
    Flux1SchnellEditImageNumImages, Flux1SchnellEditImageSize,
  };
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::GHOST_IMAGE_URL;

  #[tokio::test]
  #[ignore] // manually run — fires a real Fal API request
  async fn test_single_image_no_size() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = Flux1SchnellEditImageArgs {
      image_url: GHOST_IMAGE_URL.to_string(),
      num_images: Flux1SchnellEditImageNumImages::One,
      image_size: None,
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_flux_1_schnell_edit_image_webhook(args).await?;
    assert!(result.request_id.is_some());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real Fal API request
  async fn test_with_landscape_size() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = Flux1SchnellEditImageArgs {
      image_url: GHOST_IMAGE_URL.to_string(),
      num_images: Flux1SchnellEditImageNumImages::Two,
      image_size: Some(Flux1SchnellEditImageSize::LandscapeSixteenByNine),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_flux_1_schnell_edit_image_webhook(args).await?;
    assert!(result.request_id.is_some());
    Ok(())
  }
}

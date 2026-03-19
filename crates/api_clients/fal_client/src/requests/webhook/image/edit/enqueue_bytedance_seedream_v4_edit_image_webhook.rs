use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::image::edit::http_seedream_4_edit_image::{seedream_4_edit_image, SeedreamV4EditImageInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueBytedanceSeedreamV4EditImageArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: &'a str,
  pub image_urls: Vec<String>,

  // Optional args
  pub num_images: Option<EnqueueBytedanceSeedreamV4EditImageNumImages>,
  pub max_images: Option<EnqueueBytedanceSeedreamV4EditImageMaxImages>,
  pub image_size: Option<EnqueueBytedanceSeedreamV4EditImageSize>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueBytedanceSeedreamV4EditImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueBytedanceSeedreamV4EditImageMaxImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueBytedanceSeedreamV4EditImageSize {
  // Square
  Square,
  SquareHd,
  // Tall
  PortraitFourThree,
  PortraitSixteenNine,
  // Wide
  LandscapeFourThree,
  LandscapeSixteenNine,
  // Auto
  Auto,
  Auto2k,
  Auto4k,
}


impl <U: IntoUrl> FalRequestCostCalculator for EnqueueBytedanceSeedreamV4EditImageArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Your request will cost $0.03 per image.
    let unit_cost = 3;
    let cost = match self.num_images {
      None => unit_cost,
      Some(EnqueueBytedanceSeedreamV4EditImageNumImages::One) => unit_cost,
      Some(EnqueueBytedanceSeedreamV4EditImageNumImages::Two) => unit_cost * 2,
      Some(EnqueueBytedanceSeedreamV4EditImageNumImages::Three) => unit_cost * 3,
      Some(EnqueueBytedanceSeedreamV4EditImageNumImages::Four) => unit_cost * 4,
    };
    cost as UsdCents
  }
}


pub async fn enqueue_bytedance_seedream_v4_edit_image_webhook<R: IntoUrl>(
  args: EnqueueBytedanceSeedreamV4EditImageArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = args.num_images
      .map(|num_images| match num_images {
        EnqueueBytedanceSeedreamV4EditImageNumImages::One => 1,
        EnqueueBytedanceSeedreamV4EditImageNumImages::Two => 2,
        EnqueueBytedanceSeedreamV4EditImageNumImages::Three => 3,
        EnqueueBytedanceSeedreamV4EditImageNumImages::Four => 4,
      });

  let max_images = args.max_images
      .map(|num_images| match num_images {
        EnqueueBytedanceSeedreamV4EditImageMaxImages::One => 1,
        EnqueueBytedanceSeedreamV4EditImageMaxImages::Two => 2,
        EnqueueBytedanceSeedreamV4EditImageMaxImages::Three => 3,
        EnqueueBytedanceSeedreamV4EditImageMaxImages::Four => 4,
      });

  let image_size = args.image_size
      .map(|image_size| match image_size {
        EnqueueBytedanceSeedreamV4EditImageSize::Square => "square",
        EnqueueBytedanceSeedreamV4EditImageSize::SquareHd => "square_hd",
        EnqueueBytedanceSeedreamV4EditImageSize::PortraitFourThree => "portrait_4_3",
        EnqueueBytedanceSeedreamV4EditImageSize::PortraitSixteenNine => "portrait_16_9",
        EnqueueBytedanceSeedreamV4EditImageSize::LandscapeFourThree => "landscape_4_3",
        EnqueueBytedanceSeedreamV4EditImageSize::LandscapeSixteenNine => "landscape_16_9",
        EnqueueBytedanceSeedreamV4EditImageSize::Auto => "auto",
        EnqueueBytedanceSeedreamV4EditImageSize::Auto2k => "auto_2K",
        EnqueueBytedanceSeedreamV4EditImageSize::Auto4k => "auto_4K",
      })
      .map(|resolution| resolution.to_string());

  let request = SeedreamV4EditImageInput {
    prompt: args.prompt.to_string(),
    image_urls: args.image_urls,
    // Optionals
    num_images,
    max_images,
    image_size,
    // Constants
    enhance_prompt_mode: Some("standard".to_string()),
    enable_safety_checker: Some(false),
  };

  let result = seedream_4_edit_image(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::edit::enqueue_bytedance_seedream_v4_edit_image_webhook::{enqueue_bytedance_seedream_v4_edit_image_webhook, EnqueueBytedanceSeedreamV4EditImageArgs, EnqueueBytedanceSeedreamV4EditImageMaxImages, EnqueueBytedanceSeedreamV4EditImageNumImages, EnqueueBytedanceSeedreamV4EditImageSize};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{GHOST_IMAGE_URL, TREX_SKELETON_IMAGE_URL};

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueBytedanceSeedreamV4EditImageArgs {
      image_urls: vec![
        GHOST_IMAGE_URL.to_string(),
        TREX_SKELETON_IMAGE_URL.to_string(),
      ],
      prompt: "add the ghost to the image of the t-rex skeleton, make it look spooky but friendly",
      num_images: Some(EnqueueBytedanceSeedreamV4EditImageNumImages::Two),
      max_images: Some(EnqueueBytedanceSeedreamV4EditImageMaxImages::Two),
      image_size: Some(EnqueueBytedanceSeedreamV4EditImageSize::Auto2k),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_bytedance_seedream_v4_edit_image_webhook(args).await?;

    Ok(())
  }
}

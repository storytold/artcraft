use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::image::edit::http_seedream_5_edit_image::{http_seedream_5_edit_image, SeedreamV5LiteEditImageInput};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueBytedanceSeedreamV5LiteEditImageArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: &'a str,
  pub image_urls: Vec<String>,

  // Optional args
  pub num_images: Option<EnqueueBytedanceSeedreamV5LiteEditImageNumImages>,
  pub max_images: Option<EnqueueBytedanceSeedreamV5LiteEditImageMaxImages>,
  pub image_size: Option<EnqueueBytedanceSeedreamV5LiteEditImageSize>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueBytedanceSeedreamV5LiteEditImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueBytedanceSeedreamV5LiteEditImageMaxImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueBytedanceSeedreamV5LiteEditImageSize {
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
  Auto2k,
  Auto3k, // NB: v5 uses auto_3K instead of v4's auto_4K
}


impl <U: IntoUrl> FalRequestCostCalculator for EnqueueBytedanceSeedreamV5LiteEditImageArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // TODO(bt): Verify actual pricing for Seedream v5 Lite on fal.ai.
    let unit_cost = 4;
    let cost = match self.num_images {
      None => unit_cost,
      Some(EnqueueBytedanceSeedreamV5LiteEditImageNumImages::One) => unit_cost,
      Some(EnqueueBytedanceSeedreamV5LiteEditImageNumImages::Two) => unit_cost * 2,
      Some(EnqueueBytedanceSeedreamV5LiteEditImageNumImages::Three) => unit_cost * 3,
      Some(EnqueueBytedanceSeedreamV5LiteEditImageNumImages::Four) => unit_cost * 4,
    };
    cost as UsdCents
  }
}


pub async fn enqueue_bytedance_seedream_v5_lite_edit_image_webhook<R: IntoUrl>(
  args: EnqueueBytedanceSeedreamV5LiteEditImageArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = args.num_images
      .map(|n| match n {
        EnqueueBytedanceSeedreamV5LiteEditImageNumImages::One => 1,
        EnqueueBytedanceSeedreamV5LiteEditImageNumImages::Two => 2,
        EnqueueBytedanceSeedreamV5LiteEditImageNumImages::Three => 3,
        EnqueueBytedanceSeedreamV5LiteEditImageNumImages::Four => 4,
      });

  let max_images = args.max_images
      .map(|n| match n {
        EnqueueBytedanceSeedreamV5LiteEditImageMaxImages::One => 1,
        EnqueueBytedanceSeedreamV5LiteEditImageMaxImages::Two => 2,
        EnqueueBytedanceSeedreamV5LiteEditImageMaxImages::Three => 3,
        EnqueueBytedanceSeedreamV5LiteEditImageMaxImages::Four => 4,
      });

  let image_size = args.image_size
      .map(|s| match s {
        EnqueueBytedanceSeedreamV5LiteEditImageSize::Square => "square",
        EnqueueBytedanceSeedreamV5LiteEditImageSize::SquareHd => "square_hd",
        EnqueueBytedanceSeedreamV5LiteEditImageSize::PortraitFourThree => "portrait_4_3",
        EnqueueBytedanceSeedreamV5LiteEditImageSize::PortraitSixteenNine => "portrait_16_9",
        EnqueueBytedanceSeedreamV5LiteEditImageSize::LandscapeFourThree => "landscape_4_3",
        EnqueueBytedanceSeedreamV5LiteEditImageSize::LandscapeSixteenNine => "landscape_16_9",
        EnqueueBytedanceSeedreamV5LiteEditImageSize::Auto2k => "auto_2K",
        EnqueueBytedanceSeedreamV5LiteEditImageSize::Auto3k => "auto_3K",
      })
      .map(|s| s.to_string());

  let request = SeedreamV5LiteEditImageInput {
    prompt: args.prompt.to_string(),
    image_urls: args.image_urls,
    // Optionals
    num_images,
    max_images,
    image_size,
    // Constants
    enable_safety_checker: Some(false),
  };

  let result = http_seedream_5_edit_image(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::edit::enqueue_bytedance_seedream_v5_lite_edit_image_webhook::{enqueue_bytedance_seedream_v5_lite_edit_image_webhook, EnqueueBytedanceSeedreamV5LiteEditImageArgs, EnqueueBytedanceSeedreamV5LiteEditImageMaxImages, EnqueueBytedanceSeedreamV5LiteEditImageNumImages, EnqueueBytedanceSeedreamV5LiteEditImageSize};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{GHOST_IMAGE_URL, TREX_SKELETON_IMAGE_URL};

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueBytedanceSeedreamV5LiteEditImageArgs {
      image_urls: vec![
        GHOST_IMAGE_URL.to_string(),
        TREX_SKELETON_IMAGE_URL.to_string(),
      ],
      prompt: "add the ghost to the image of the t-rex skeleton, make it look spooky but friendly",
      num_images: Some(EnqueueBytedanceSeedreamV5LiteEditImageNumImages::Two),
      max_images: Some(EnqueueBytedanceSeedreamV5LiteEditImageMaxImages::Two),
      image_size: Some(EnqueueBytedanceSeedreamV5LiteEditImageSize::Auto2k),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_bytedance_seedream_v5_lite_edit_image_webhook(args).await?;

    Ok(())
  }
}

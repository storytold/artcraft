use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::image::http_seedream_5_text_to_image::{http_seedream_5_text_to_image, SeedreamV5LiteTextToImageInput};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueBytedanceSeedreamV5LiteTextToImageArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: &'a str,

  // Optional args
  pub num_images: Option<EnqueueBytedanceSeedreamV5LiteTextToImageNumImages>,
  pub max_images: Option<EnqueueBytedanceSeedreamV5LiteTextToImageMaxImages>,
  pub image_size: Option<EnqueueBytedanceSeedreamV5LiteTextToImageSize>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueBytedanceSeedreamV5LiteTextToImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueBytedanceSeedreamV5LiteTextToImageMaxImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueBytedanceSeedreamV5LiteTextToImageSize {
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


impl <U: IntoUrl> FalRequestCostCalculator for EnqueueBytedanceSeedreamV5LiteTextToImageArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // TODO(bt): Verify actual pricing for Seedream v5 Lite on fal.ai.
    let unit_cost = 4;
    let cost = match self.num_images {
      None => unit_cost,
      Some(EnqueueBytedanceSeedreamV5LiteTextToImageNumImages::One) => unit_cost,
      Some(EnqueueBytedanceSeedreamV5LiteTextToImageNumImages::Two) => unit_cost * 2,
      Some(EnqueueBytedanceSeedreamV5LiteTextToImageNumImages::Three) => unit_cost * 3,
      Some(EnqueueBytedanceSeedreamV5LiteTextToImageNumImages::Four) => unit_cost * 4,
    };
    cost as UsdCents
  }
}


pub async fn enqueue_bytedance_seedream_v5_lite_text_to_image_webhook<R: IntoUrl>(
  args: EnqueueBytedanceSeedreamV5LiteTextToImageArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = args.num_images
      .map(|n| match n {
        EnqueueBytedanceSeedreamV5LiteTextToImageNumImages::One => 1,
        EnqueueBytedanceSeedreamV5LiteTextToImageNumImages::Two => 2,
        EnqueueBytedanceSeedreamV5LiteTextToImageNumImages::Three => 3,
        EnqueueBytedanceSeedreamV5LiteTextToImageNumImages::Four => 4,
      });

  let max_images = args.max_images
      .map(|n| match n {
        EnqueueBytedanceSeedreamV5LiteTextToImageMaxImages::One => 1,
        EnqueueBytedanceSeedreamV5LiteTextToImageMaxImages::Two => 2,
        EnqueueBytedanceSeedreamV5LiteTextToImageMaxImages::Three => 3,
        EnqueueBytedanceSeedreamV5LiteTextToImageMaxImages::Four => 4,
      });

  let image_size = args.image_size
      .map(|s| match s {
        EnqueueBytedanceSeedreamV5LiteTextToImageSize::Square => "square",
        EnqueueBytedanceSeedreamV5LiteTextToImageSize::SquareHd => "square_hd",
        EnqueueBytedanceSeedreamV5LiteTextToImageSize::PortraitFourThree => "portrait_4_3",
        EnqueueBytedanceSeedreamV5LiteTextToImageSize::PortraitSixteenNine => "portrait_16_9",
        EnqueueBytedanceSeedreamV5LiteTextToImageSize::LandscapeFourThree => "landscape_4_3",
        EnqueueBytedanceSeedreamV5LiteTextToImageSize::LandscapeSixteenNine => "landscape_16_9",
        EnqueueBytedanceSeedreamV5LiteTextToImageSize::Auto2k => "auto_2K",
        EnqueueBytedanceSeedreamV5LiteTextToImageSize::Auto3k => "auto_3K",
      })
      .map(|s| s.to_string());

  let request = SeedreamV5LiteTextToImageInput {
    prompt: args.prompt.to_string(),
    // Optionals
    num_images,
    max_images,
    image_size,
    // Constants
    enable_safety_checker: Some(false),
  };

  let result = http_seedream_5_text_to_image(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::text::enqueue_bytedance_seedream_v5_lite_text_to_image_webhook::{enqueue_bytedance_seedream_v5_lite_text_to_image_webhook, EnqueueBytedanceSeedreamV5LiteTextToImageArgs, EnqueueBytedanceSeedreamV5LiteTextToImageMaxImages, EnqueueBytedanceSeedreamV5LiteTextToImageNumImages, EnqueueBytedanceSeedreamV5LiteTextToImageSize};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueBytedanceSeedreamV5LiteTextToImageArgs {
      prompt: "an anime girl is riding a t-rex in the forest",
      num_images: Some(EnqueueBytedanceSeedreamV5LiteTextToImageNumImages::Two),
      max_images: Some(EnqueueBytedanceSeedreamV5LiteTextToImageMaxImages::Two),
      image_size: Some(EnqueueBytedanceSeedreamV5LiteTextToImageSize::LandscapeSixteenNine),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_bytedance_seedream_v5_lite_text_to_image_webhook(args).await?;

    Ok(())
  }
}

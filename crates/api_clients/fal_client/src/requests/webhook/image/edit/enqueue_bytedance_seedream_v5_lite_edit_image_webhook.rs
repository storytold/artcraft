use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::image::edit::http_seedream_5_edit_image::{http_seedream_5_edit_image, SeedreamV5LiteEditImageInput};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::core_api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueBytedanceSeedreamV5LiteEditImageArgs<'a, R: IntoUrl> {
  pub request: EnqueueBytedanceSeedreamV5LiteEditImageRequest,
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Clone, Debug)]
pub struct EnqueueBytedanceSeedreamV5LiteEditImageRequest {
  pub prompt: String,
  pub image_urls: Vec<String>,
  pub num_images: Option<EnqueueBytedanceSeedreamV5LiteEditImageNumImages>,
  pub max_images: Option<EnqueueBytedanceSeedreamV5LiteEditImageMaxImages>,
  pub image_size: Option<EnqueueBytedanceSeedreamV5LiteEditImageSize>,
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
  Square,
  SquareHd,
  PortraitFourThree,
  PortraitSixteenNine,
  LandscapeFourThree,
  LandscapeSixteenNine,
  Auto2k,
  Auto3k, // NB: v5 uses auto_3K instead of v4's auto_4K
}

impl FalRequestCostCalculator for EnqueueBytedanceSeedreamV5LiteEditImageRequest {
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
  let req = args.request;

  let num_images = req.num_images
      .map(|n| match n {
        EnqueueBytedanceSeedreamV5LiteEditImageNumImages::One => 1,
        EnqueueBytedanceSeedreamV5LiteEditImageNumImages::Two => 2,
        EnqueueBytedanceSeedreamV5LiteEditImageNumImages::Three => 3,
        EnqueueBytedanceSeedreamV5LiteEditImageNumImages::Four => 4,
      });

  let max_images = req.max_images
      .map(|n| match n {
        EnqueueBytedanceSeedreamV5LiteEditImageMaxImages::One => 1,
        EnqueueBytedanceSeedreamV5LiteEditImageMaxImages::Two => 2,
        EnqueueBytedanceSeedreamV5LiteEditImageMaxImages::Three => 3,
        EnqueueBytedanceSeedreamV5LiteEditImageMaxImages::Four => 4,
      });

  let image_size = req.image_size
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

  let input = SeedreamV5LiteEditImageInput {
    prompt: req.prompt,
    image_urls: req.image_urls,
    num_images,
    max_images,
    image_size,
    enable_safety_checker: Some(false),
  };

  http_seedream_5_edit_image(input)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await
      .map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::fal_api_key::FalApiKey;
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{GHOST_IMAGE_URL, TREX_SKELETON_IMAGE_URL};

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueBytedanceSeedreamV5LiteEditImageArgs {
      request: EnqueueBytedanceSeedreamV5LiteEditImageRequest {
        prompt: "add the ghost to the image of the t-rex skeleton, make it look spooky but friendly".to_string(),
        image_urls: vec![GHOST_IMAGE_URL.to_string(), TREX_SKELETON_IMAGE_URL.to_string()],
        num_images: Some(EnqueueBytedanceSeedreamV5LiteEditImageNumImages::Two),
        max_images: Some(EnqueueBytedanceSeedreamV5LiteEditImageMaxImages::Two),
        image_size: Some(EnqueueBytedanceSeedreamV5LiteEditImageSize::Auto2k),
      },
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let _result = enqueue_bytedance_seedream_v5_lite_edit_image_webhook(args).await?;
    Ok(())
  }
}

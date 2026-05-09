use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::image::edit::http_seedream_4_edit_image::{seedream_4_edit_image, SeedreamV4EditImageInput};
use crate::requests::core_api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueBytedanceSeedreamV4EditImageArgs<'a, R: IntoUrl> {
  pub request: EnqueueBytedanceSeedreamV4EditImageRequest,
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Clone, Debug)]
pub struct EnqueueBytedanceSeedreamV4EditImageRequest {
  pub prompt: String,
  pub image_urls: Vec<String>,
  pub num_images: Option<EnqueueBytedanceSeedreamV4EditImageNumImages>,
  pub max_images: Option<EnqueueBytedanceSeedreamV4EditImageMaxImages>,
  pub image_size: Option<EnqueueBytedanceSeedreamV4EditImageSize>,
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
  Square,
  SquareHd,
  PortraitFourThree,
  PortraitSixteenNine,
  LandscapeFourThree,
  LandscapeSixteenNine,
  Auto,
  Auto2k,
  Auto4k,
}

impl FalRequestCostCalculator for EnqueueBytedanceSeedreamV4EditImageRequest {
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
  let req = args.request;

  let num_images = req.num_images
      .map(|n| match n {
        EnqueueBytedanceSeedreamV4EditImageNumImages::One => 1,
        EnqueueBytedanceSeedreamV4EditImageNumImages::Two => 2,
        EnqueueBytedanceSeedreamV4EditImageNumImages::Three => 3,
        EnqueueBytedanceSeedreamV4EditImageNumImages::Four => 4,
      });

  let max_images = req.max_images
      .map(|n| match n {
        EnqueueBytedanceSeedreamV4EditImageMaxImages::One => 1,
        EnqueueBytedanceSeedreamV4EditImageMaxImages::Two => 2,
        EnqueueBytedanceSeedreamV4EditImageMaxImages::Three => 3,
        EnqueueBytedanceSeedreamV4EditImageMaxImages::Four => 4,
      });

  let image_size = req.image_size
      .map(|s| match s {
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
      .map(|s| s.to_string());

  let input = SeedreamV4EditImageInput {
    prompt: req.prompt,
    image_urls: req.image_urls,
    num_images,
    max_images,
    image_size,
    enhance_prompt_mode: Some("standard".to_string()),
    enable_safety_checker: Some(false),
  };

  seedream_4_edit_image(input)
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

    let args = EnqueueBytedanceSeedreamV4EditImageArgs {
      request: EnqueueBytedanceSeedreamV4EditImageRequest {
        prompt: "add the ghost to the image of the t-rex skeleton, make it look spooky but friendly".to_string(),
        image_urls: vec![GHOST_IMAGE_URL.to_string(), TREX_SKELETON_IMAGE_URL.to_string()],
        num_images: Some(EnqueueBytedanceSeedreamV4EditImageNumImages::Two),
        max_images: Some(EnqueueBytedanceSeedreamV4EditImageMaxImages::Two),
        image_size: Some(EnqueueBytedanceSeedreamV4EditImageSize::Auto2k),
      },
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let _result = enqueue_bytedance_seedream_v4_edit_image_webhook(args).await?;
    Ok(())
  }
}

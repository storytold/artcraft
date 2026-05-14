//! Deprecated BYOK (bring-your-own-OpenAI-key) edit-image binding for
//! `fal-ai/gpt-image-1/edit-image/byok`. The non-BYOK replacement lives in
//! `enqueue_gpt_image_1_edit_image_webhook.rs`. Kept for the legacy
//! `gpt_image_1_edit_image_handler` storyteller-web endpoint.

use crate::creds::fal_api_key::FalApiKey;
use crate::creds::open_ai_api_key::OpenAiApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::image::edit::http_gpt_image_1_byok_edit_image::{gpt_image_1_byok_edit_image, GptImage1ByokEditImageInput};
use crate::requests::core_api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct GptEditImageByokArgs<'a, V: IntoUrl> {
  pub request: GptEditImageByokRequest,

  // Fulfillment
  pub api_key: &'a FalApiKey,
  pub openai_api_key: &'a OpenAiApiKey,
  pub webhook_url: V,
}

#[derive(Clone, Debug)]
pub struct GptEditImageByokRequest {
  pub image_urls: Vec<String>,
  pub prompt: String,
  pub image_size: GptEditImageSize,
  pub num_images: GptEditImageNumImages,
  pub quality: GptEditImageQuality,
}

#[derive(Copy, Clone, Debug)]
pub enum GptEditImageSize {
  Auto,
  Square,
  Horizontal,
  Vertical,
}

#[derive(Copy, Clone, Debug)]
pub enum GptEditImageQuality {
  Auto,
  Low,
  Medium,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum GptEditImageNumImages{
  One,
  Two,
  Three,
  Four,
}


// NB: These are BYOK, so they're not Fal's prices
impl FalRequestCostCalculator for GptEditImageByokRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    let base_cost = match self.quality {
      GptEditImageQuality::Auto => 17,
      GptEditImageQuality::Low => 1,
      GptEditImageQuality::Medium => 4,
      GptEditImageQuality::High => 17,
    };
    let cost = match self.num_images {
      GptEditImageNumImages::One => base_cost,
      GptEditImageNumImages::Two => base_cost * 2,
      GptEditImageNumImages::Three => base_cost * 3,
      GptEditImageNumImages::Four => base_cost * 4,
    };
    cost as UsdCents
  }
}


pub async fn enqueue_gpt_image_1_byok_edit_image_webhook<V: IntoUrl>(
  args: GptEditImageByokArgs<'_, V>
) -> Result<WebhookResponse, FalErrorPlus> {
  let req = args.request;

  let image_size = match req.image_size {
    GptEditImageSize::Auto => "auto",
    GptEditImageSize::Square => "1024x1024",
    GptEditImageSize::Horizontal => "1536x1024",
    GptEditImageSize::Vertical => "1024x1536",
  };

  let quality = match req.quality {
    GptEditImageQuality::Auto => "auto",
    GptEditImageQuality::Low => "low",
    GptEditImageQuality::Medium => "medium",
    GptEditImageQuality::High => "high",
  };

  let num_images = match req.num_images {
    GptEditImageNumImages::One => 1,
    GptEditImageNumImages::Two => 2,
    GptEditImageNumImages::Three => 3,
    GptEditImageNumImages::Four => 4,
  };

  let request = GptImage1ByokEditImageInput {
    image_urls: req.image_urls,
    prompt: req.prompt,
    image_size: image_size.to_string(),
    num_images,
    quality: quality.to_string(),
    openai_api_key: args.openai_api_key.0.to_string(),
  };

  let result = gpt_image_1_byok_edit_image(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::creds::open_ai_api_key::OpenAiApiKey;
  use crate::requests::webhook::image::edit::enqueue_gpt_image_1_byok_edit_image_webhook::{
    enqueue_gpt_image_1_byok_edit_image_webhook, GptEditImageByokArgs, GptEditImageByokRequest,
    GptEditImageNumImages, GptEditImageQuality, GptEditImageSize,
  };
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{
    ERNEST_SCARED_STUPID_IMAGE_URL, GHOST_IMAGE_URL, TREX_SKELETON_IMAGE_URL,
  };

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let fal_secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let fal_api_key = FalApiKey::from_str(&fal_secret);

    let openai_secret = read_to_string("/Users/bt/Artcraft/credentials/openai_api_key.txt")?;
    let openai_api_key = OpenAiApiKey::from_str(&openai_secret);

    let args = GptEditImageByokArgs {
      request: GptEditImageByokRequest {
        image_urls: vec![
          GHOST_IMAGE_URL.to_string(),
          TREX_SKELETON_IMAGE_URL.to_string(),
          ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
        ],
        prompt: "add the ghost and scared man to the image of the t-rex skeleton, make it look spooky but friendly".to_string(),
        image_size: GptEditImageSize::Horizontal,
        num_images: GptEditImageNumImages::One,
        quality: GptEditImageQuality::High,
      },
      api_key: &fal_api_key,
      openai_api_key: &openai_api_key,
      webhook_url: "https://example.com/webhook",
    };

    let _result = enqueue_gpt_image_1_byok_edit_image_webhook(args).await?;

    Ok(())
  }
}

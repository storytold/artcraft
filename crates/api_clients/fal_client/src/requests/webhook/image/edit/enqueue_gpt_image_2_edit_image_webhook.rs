use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::image::edit::http_gpt_image_2_edit_image::{gpt_image_2_edit_image, GptImage2EditImageInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;
use crate::requests::webhook::image::edit::enqueue_gpt_image_2_edit_image_webhook::EnqueueGptImage2EditImageQuality::{High, Medium};
use crate::requests::webhook::image::edit::enqueue_gpt_image_2_edit_image_webhook::EnqueueGptImage2EditImageSize::SquareHd;

pub struct EnqueueGptImage2EditImageArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: &'a str,
  pub image_urls: Vec<String>,
  pub num_images: EnqueueGptImage2EditImageNumImages,

  // Optional args
  pub mask_url: Option<String>,
  pub image_size: Option<EnqueueGptImage2EditImageSize>,
  pub quality: Option<EnqueueGptImage2EditImageQuality>,
  pub output_format: Option<EnqueueGptImage2EditImageOutputFormat>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage2EditImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage2EditImageSize {
  SquareHd,
  Square,
  Portrait4x3,
  Portrait16x9,
  Landscape4x3,
  Landscape16x9,
  Auto,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage2EditImageQuality {
  Low,
  Medium,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage2EditImageOutputFormat {
  Jpeg,
  Png,
  Webp,
}


impl <U: IntoUrl> FalRequestCostCalculator for EnqueueGptImage2EditImageArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Cost table (per image) by approximate pixel dimensions:
    //
    // landscape_4_3 (~1024x768):  low=$0.01, medium=$0.04, high=$0.15
    // square        (~1024x1024): low=$0.01, medium=$0.06, high=$0.22
    // portrait_4_3  (~768x1024):  low=$0.01, medium=$0.04, high=$0.15
    // landscape_16_9(~1920x1080): low=$0.01, medium=$0.04, high=$0.16
    // portrait_16_9 (~1080x1920): low=$0.01, medium=$0.04, high=$0.16
    // square_hd     (~2048x2048): low=$0.01, medium=$0.06, high=$0.23
    // auto          (varies):     estimated as square
    let use_quality = self.quality.unwrap_or(EnqueueGptImage2EditImageQuality::High);
    let use_size = self.image_size.unwrap_or(EnqueueGptImage2EditImageSize::Square);

    use EnqueueGptImage2EditImageQuality::*;
    use EnqueueGptImage2EditImageSize::*;

    let base_cost = match (use_quality, use_size) {
      (Low, _) => 1,
      (Medium, Landscape4x3 | Portrait4x3 | Landscape16x9 | Portrait16x9) => 4,
      (Medium, Square) => 6,
      (Medium, SquareHd) => 6,
      (Medium, Auto) => 6, // TODO(bt): Unknown
      (High, Landscape4x3 | Portrait4x3) => 15,
      (High, Landscape16x9 | Portrait16x9) => 16,
      (High, Square) => 22,
      (High, SquareHd) => 23,
      (High, Auto) => 23, // TODO(bt): Unknown
    };

    let cost = match self.num_images {
      EnqueueGptImage2EditImageNumImages::One => base_cost,
      EnqueueGptImage2EditImageNumImages::Two => base_cost * 2,
      EnqueueGptImage2EditImageNumImages::Three => base_cost * 3,
      EnqueueGptImage2EditImageNumImages::Four => base_cost * 4,
    };
    cost as UsdCents
  }
}


pub async fn enqueue_gpt_image_2_edit_image_webhook<R: IntoUrl>(
  args: EnqueueGptImage2EditImageArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = match args.num_images {
    EnqueueGptImage2EditImageNumImages::One => 1,
    EnqueueGptImage2EditImageNumImages::Two => 2,
    EnqueueGptImage2EditImageNumImages::Three => 3,
    EnqueueGptImage2EditImageNumImages::Four => 4,
  };

  let image_size = args.image_size
      .map(|s| match s {
        EnqueueGptImage2EditImageSize::SquareHd => "square_hd",
        EnqueueGptImage2EditImageSize::Square => "square",
        EnqueueGptImage2EditImageSize::Portrait4x3 => "portrait_4_3",
        EnqueueGptImage2EditImageSize::Portrait16x9 => "portrait_16_9",
        EnqueueGptImage2EditImageSize::Landscape4x3 => "landscape_4_3",
        EnqueueGptImage2EditImageSize::Landscape16x9 => "landscape_16_9",
        EnqueueGptImage2EditImageSize::Auto => "auto",
      })
      .map(|size| size.to_string());

  let quality = args.quality
      .map(|s| match s {
        EnqueueGptImage2EditImageQuality::Low => "low",
        EnqueueGptImage2EditImageQuality::Medium => "medium",
        EnqueueGptImage2EditImageQuality::High => "high",
      })
      .map(|quality| quality.to_string());

  let output_format = args.output_format
      .map(|s| match s {
        EnqueueGptImage2EditImageOutputFormat::Jpeg => "jpeg",
        EnqueueGptImage2EditImageOutputFormat::Png => "png",
        EnqueueGptImage2EditImageOutputFormat::Webp => "webp",
      })
      .map(|format| format.to_string())
      .unwrap_or_else(|| "png".to_string());

  let request = GptImage2EditImageInput {
    prompt: args.prompt.to_string(),
    image_urls: args.image_urls,
    num_images: Some(num_images),
    output_format: Some(output_format),
    // Optionals
    mask_url: args.mask_url,
    image_size,
    quality,
  };

  let result = gpt_image_2_edit_image(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::edit::enqueue_gpt_image_2_edit_image_webhook::{enqueue_gpt_image_2_edit_image_webhook, EnqueueGptImage2EditImageArgs, EnqueueGptImage2EditImageNumImages};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{ERNEST_SCARED_STUPID_IMAGE_URL, GHOST_IMAGE_URL, TREX_SKELETON_IMAGE_URL};

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueGptImage2EditImageArgs {
      image_urls: vec![
        GHOST_IMAGE_URL.to_string(),
        TREX_SKELETON_IMAGE_URL.to_string(),
        ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      ],
      prompt: "add the ghost and scared man to the image of the t-rex skeleton, make it look spooky but friendly",
      num_images: EnqueueGptImage2EditImageNumImages::Two,
      mask_url: None,
      image_size: None,
      quality: None,
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
      output_format: None,
    };

    let result = enqueue_gpt_image_2_edit_image_webhook(args).await?;

    Ok(())
  }
}

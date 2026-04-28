use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::image::text::http_gpt_image_2_text_to_image::{gpt_image_2_text_to_image, GptImage2TextToImageInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueGptImage2TextToImageArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: &'a str,
  pub num_images: EnqueueGptImage2TextToImageNumImages,

  // Optional args
  pub image_size: Option<EnqueueGptImage2TextToImageSize>,
  pub quality: Option<EnqueueGptImage2TextToImageQuality>,
  pub output_format: Option<EnqueueGptImage2TextToImageOutputFormat>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage2TextToImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage2TextToImageSize {
  SquareHd,
  Square,
  Portrait4x3,
  Portrait16x9,
  Landscape4x3,
  Landscape16x9,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage2TextToImageQuality {
  Low,
  Medium,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage2TextToImageOutputFormat {
  Jpeg,
  Png,
  Webp,
}


impl <U: IntoUrl> FalRequestCostCalculator for EnqueueGptImage2TextToImageArgs<'_, U> {
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
    let use_quality = self.quality.unwrap_or(EnqueueGptImage2TextToImageQuality::High);
    let use_size = self.image_size.unwrap_or(EnqueueGptImage2TextToImageSize::Square);

    use EnqueueGptImage2TextToImageQuality::*;
    use EnqueueGptImage2TextToImageSize::*;

    let base_cost = match (use_quality, use_size) {
      (Low, _) => 1,
      (Medium, Landscape4x3 | Portrait4x3 | Landscape16x9 | Portrait16x9) => 4,
      (Medium, Square) => 6,
      (Medium, SquareHd) => 6,
      (High, Landscape4x3 | Portrait4x3) => 15,
      (High, Landscape16x9 | Portrait16x9) => 16,
      (High, Square) => 22,
      (High, SquareHd) => 23,
    };

    let cost = match self.num_images {
      EnqueueGptImage2TextToImageNumImages::One => base_cost,
      EnqueueGptImage2TextToImageNumImages::Two => base_cost * 2,
      EnqueueGptImage2TextToImageNumImages::Three => base_cost * 3,
      EnqueueGptImage2TextToImageNumImages::Four => base_cost * 4,
    };
    cost as UsdCents
  }
}


pub async fn enqueue_gpt_image_2_text_to_image_webhook<R: IntoUrl>(
  args: EnqueueGptImage2TextToImageArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = match args.num_images {
    EnqueueGptImage2TextToImageNumImages::One => 1,
    EnqueueGptImage2TextToImageNumImages::Two => 2,
    EnqueueGptImage2TextToImageNumImages::Three => 3,
    EnqueueGptImage2TextToImageNumImages::Four => 4,
  };

  let image_size = args.image_size
      .map(|s| match s {
        EnqueueGptImage2TextToImageSize::SquareHd => "square_hd",
        EnqueueGptImage2TextToImageSize::Square => "square",
        EnqueueGptImage2TextToImageSize::Portrait4x3 => "portrait_4_3",
        EnqueueGptImage2TextToImageSize::Portrait16x9 => "portrait_16_9",
        EnqueueGptImage2TextToImageSize::Landscape4x3 => "landscape_4_3",
        EnqueueGptImage2TextToImageSize::Landscape16x9 => "landscape_16_9",
      })
      .map(|size| size.to_string());

  let quality = args.quality
      .map(|s| match s {
        EnqueueGptImage2TextToImageQuality::Low => "low",
        EnqueueGptImage2TextToImageQuality::Medium => "medium",
        EnqueueGptImage2TextToImageQuality::High => "high",
      })
      .map(|quality| quality.to_string());

  let output_format = args.output_format
      .map(|s| match s {
        EnqueueGptImage2TextToImageOutputFormat::Jpeg => "jpeg",
        EnqueueGptImage2TextToImageOutputFormat::Png => "png",
        EnqueueGptImage2TextToImageOutputFormat::Webp => "webp",
      })
      .map(|format| format.to_string())
      .unwrap_or_else(|| "png".to_string());

  let request = GptImage2TextToImageInput {
    prompt: args.prompt.to_string(),
    num_images: Some(num_images),
    output_format: Some(output_format),
    // Optionals
    image_size,
    quality,
  };

  let result = gpt_image_2_text_to_image(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::text::enqueue_gpt_image_2_text_to_image_webhook::{enqueue_gpt_image_2_text_to_image_webhook, EnqueueGptImage2TextToImageArgs, EnqueueGptImage2TextToImageNumImages};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueGptImage2TextToImageArgs {
      prompt: "an anime girl riding on the back of a t-rex",
      num_images: EnqueueGptImage2TextToImageNumImages::Two,
      image_size: None,
      quality: None,
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
      output_format: None,
    };

    let result = enqueue_gpt_image_2_text_to_image_webhook(args).await?;

    Ok(())
  }
}

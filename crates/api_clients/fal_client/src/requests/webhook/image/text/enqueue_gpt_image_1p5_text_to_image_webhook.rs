use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::image::text::http_gpt_image_1p5_text_to_image::{gpt_image_1p5_text_to_image, GptImage1p5TextToImageInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueGptImage1p5TextToImageArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: &'a str,
  pub num_images: EnqueueGptImage1p5TextToImageNumImages,

  // Optional args
  pub image_size: Option<EnqueueGptImage1p5TextToImageSize>,
  pub background: Option<EnqueueGptImage1p5TextToImageBackground>,
  pub quality: Option<EnqueueGptImage1p5TextToImageQuality>,
  pub output_format: Option<EnqueueGptImage1p5TextToImageOutputFormat>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1p5TextToImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1p5TextToImageSize {
  /// 1024x1024
  Square,
  /// 1536x1024
  Wide,
  /// 1024x1536
  Tall,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1p5TextToImageBackground {
  Auto,
  Transparent,
  Opaque,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1p5TextToImageQuality {
  Low,
  Medium,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1p5TextToImageOutputFormat {
  Jpeg,
  Png,
  Webp,
}


impl <U: IntoUrl> FalRequestCostCalculator for EnqueueGptImage1p5TextToImageArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // NB: copied from edit image case - should be correct, but not verified.
    // Your request will cost different amounts based on the number of images, quality, and size.
    // For low quality, you will be charged $0.009 for 1024x1024 or $0.013 for any other size per image.
    // For medium quality, you will be charged $0.034 for 1024x1024, $0.051 for 1024x1536 and $0.050 for 1536x1024 per image.
    // For high quality, you will be charged $0.133 for 1024x1024, $0.200 for 1024x1536 or $0.199 for 1536x1024 per image.
    let use_quality = self.quality.unwrap_or(EnqueueGptImage1p5TextToImageQuality::Medium);
    let use_size = self.image_size.unwrap_or(EnqueueGptImage1p5TextToImageSize::Square);
    let base_cost = match (use_quality, use_size) {
      (EnqueueGptImage1p5TextToImageQuality::Low, EnqueueGptImage1p5TextToImageSize::Square) => 1,
      (EnqueueGptImage1p5TextToImageQuality::Low, _) => 1,
      (EnqueueGptImage1p5TextToImageQuality::Medium, EnqueueGptImage1p5TextToImageSize::Square) => 3,
      (EnqueueGptImage1p5TextToImageQuality::Medium, _) => 5,
      (EnqueueGptImage1p5TextToImageQuality::High, EnqueueGptImage1p5TextToImageSize::Square) => 13,
      (EnqueueGptImage1p5TextToImageQuality::High, _) => 20,
    };
    let cost = match self.num_images {
      EnqueueGptImage1p5TextToImageNumImages::One => base_cost,
      EnqueueGptImage1p5TextToImageNumImages::Two => base_cost * 2,
      EnqueueGptImage1p5TextToImageNumImages::Three => base_cost * 3,
      EnqueueGptImage1p5TextToImageNumImages::Four => base_cost * 4,
    };
    cost as UsdCents
  }
}


pub async fn enqueue_gpt_image_1p5_text_to_image_webhook<R: IntoUrl>(
  args: EnqueueGptImage1p5TextToImageArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {


  let num_images = match args.num_images {
    EnqueueGptImage1p5TextToImageNumImages::One => 1,
    EnqueueGptImage1p5TextToImageNumImages::Two => 2,
    EnqueueGptImage1p5TextToImageNumImages::Three => 3,
    EnqueueGptImage1p5TextToImageNumImages::Four => 4,
  };

  let image_size = args.image_size
      .map(|s| match s {
        EnqueueGptImage1p5TextToImageSize::Square => "1024x1024",
        EnqueueGptImage1p5TextToImageSize::Wide => "1536x1024",
        EnqueueGptImage1p5TextToImageSize::Tall => "1024x1536",
      })
      .map(|resolution| resolution.to_string());

  let background = args.background
      .map(|s| match s {
        EnqueueGptImage1p5TextToImageBackground::Auto => "auto",
        EnqueueGptImage1p5TextToImageBackground::Transparent => "transparent",
        EnqueueGptImage1p5TextToImageBackground::Opaque => "opaque",
      })
      .map(|aspect_ratio| aspect_ratio.to_string());

  let quality = args.quality
      .map(|s| match s {
        EnqueueGptImage1p5TextToImageQuality::Low => "low",
        EnqueueGptImage1p5TextToImageQuality::Medium => "medium",
        EnqueueGptImage1p5TextToImageQuality::High => "high",
      })
      .map(|aspect_ratio| aspect_ratio.to_string());

  let output_format = args.output_format
      .map(|s| match s {
        EnqueueGptImage1p5TextToImageOutputFormat::Jpeg => "jpeg",
        EnqueueGptImage1p5TextToImageOutputFormat::Png => "png",
        EnqueueGptImage1p5TextToImageOutputFormat::Webp => "webp",
      })
      .map(|aspect_ratio| aspect_ratio.to_string())
      .unwrap_or_else(|| "png".to_string());

  let num_images = match args.num_images {
    EnqueueGptImage1p5TextToImageNumImages::One => 1,
    EnqueueGptImage1p5TextToImageNumImages::Two => 2,
    EnqueueGptImage1p5TextToImageNumImages::Three => 3,
    EnqueueGptImage1p5TextToImageNumImages::Four => 4,
  };

  let request = GptImage1p5TextToImageInput {
    prompt: args.prompt.to_string(),
    num_images: Some(num_images),
    output_format: Some(output_format),
    // Optionals
    image_size,
    background,
    quality,
  };

  let result = gpt_image_1p5_text_to_image(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::text::enqueue_gpt_image_1p5_text_to_image_webhook::{enqueue_gpt_image_1p5_text_to_image_webhook, EnqueueGptImage1p5TextToImageArgs, EnqueueGptImage1p5TextToImageNumImages};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueGptImage1p5TextToImageArgs {
      prompt: "an anime girl riding on the back of a t-rex",
      num_images: EnqueueGptImage1p5TextToImageNumImages::Two,
      image_size: None,
      background: None,
      quality: None,
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
      output_format: None,
    };

    let result = enqueue_gpt_image_1p5_text_to_image_webhook(args).await?;

    Ok(())
  }
}

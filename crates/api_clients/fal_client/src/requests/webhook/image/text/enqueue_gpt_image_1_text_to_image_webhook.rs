use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::core_api::webhook_response::WebhookResponse;
use crate::requests::http::image::text::http_gpt_image_1_text_to_image::{
  gpt_image_1_text_to_image, GptImage1TextToImageInput,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{
  FalRequestCostCalculator, UsdCents,
};
use reqwest::IntoUrl;

/// Typed args for the non-BYOK `fal-ai/gpt-image-1/text-to-image` endpoint.
///
/// (The BYOK variant lives in `enqueue_gpt_image_1_byok_text_to_image_webhook.rs`
/// and is deprecated.)
pub struct EnqueueGptImage1TextToImageArgs<'a, R: IntoUrl> {
  pub request: EnqueueGptImage1TextToImageRequest,
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Clone, Debug)]
pub struct EnqueueGptImage1TextToImageRequest {
  // Required
  pub prompt: String,
  pub num_images: EnqueueGptImage1TextToImageNumImages,

  // Optional
  pub image_size: Option<EnqueueGptImage1TextToImageSize>,
  pub quality: Option<EnqueueGptImage1TextToImageQuality>,
  pub background: Option<EnqueueGptImage1TextToImageBackground>,
  pub output_format: Option<EnqueueGptImage1TextToImageOutputFormat>,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1TextToImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1TextToImageSize {
  Auto,
  /// 1024x1024
  Square,
  /// 1536x1024
  Horizontal,
  /// 1024x1536
  Vertical,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1TextToImageQuality {
  Low,
  Medium,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1TextToImageBackground {
  Auto,
  Transparent,
  Opaque,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1TextToImageOutputFormat {
  Jpeg,
  Png,
  Webp,
}

impl FalRequestCostCalculator for EnqueueGptImage1TextToImageRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Per fal docs (fal-ai/gpt-image-1/text-to-image):
    //   Low:    $0.011 (1024x1024) / $0.016 (other) per image
    //   Medium: $0.042 (1024x1024) / $0.063 (other) per image
    //   High:   $0.167 (1024x1024) / $0.25  (other) per image
    // Default quality is Medium when unspecified, square when size unspecified.
    let use_quality = self
      .quality
      .unwrap_or(EnqueueGptImage1TextToImageQuality::Medium);
    let is_square = matches!(
      self.image_size,
      None | Some(EnqueueGptImage1TextToImageSize::Square) | Some(EnqueueGptImage1TextToImageSize::Auto)
    );
    let base_cost: u64 = match (use_quality, is_square) {
      (EnqueueGptImage1TextToImageQuality::Low, true) => 2,
      (EnqueueGptImage1TextToImageQuality::Low, false) => 2,
      (EnqueueGptImage1TextToImageQuality::Medium, true) => 5,
      (EnqueueGptImage1TextToImageQuality::Medium, false) => 7,
      (EnqueueGptImage1TextToImageQuality::High, true) => 17,
      (EnqueueGptImage1TextToImageQuality::High, false) => 25,
    };
    let n: u64 = match self.num_images {
      EnqueueGptImage1TextToImageNumImages::One => 1,
      EnqueueGptImage1TextToImageNumImages::Two => 2,
      EnqueueGptImage1TextToImageNumImages::Three => 3,
      EnqueueGptImage1TextToImageNumImages::Four => 4,
    };
    base_cost * n
  }
}

pub async fn enqueue_gpt_image_1_text_to_image_webhook<R: IntoUrl>(
  args: EnqueueGptImage1TextToImageArgs<'_, R>,
) -> Result<WebhookResponse, FalErrorPlus> {
  let req = args.request;

  let num_images: u8 = match req.num_images {
    EnqueueGptImage1TextToImageNumImages::One => 1,
    EnqueueGptImage1TextToImageNumImages::Two => 2,
    EnqueueGptImage1TextToImageNumImages::Three => 3,
    EnqueueGptImage1TextToImageNumImages::Four => 4,
  };

  let image_size = req.image_size.map(|s| {
    match s {
      EnqueueGptImage1TextToImageSize::Auto => "auto",
      EnqueueGptImage1TextToImageSize::Square => "1024x1024",
      EnqueueGptImage1TextToImageSize::Horizontal => "1536x1024",
      EnqueueGptImage1TextToImageSize::Vertical => "1024x1536",
    }
    .to_string()
  });

  let quality = req.quality.map(|q| {
    match q {
      EnqueueGptImage1TextToImageQuality::Low => "low",
      EnqueueGptImage1TextToImageQuality::Medium => "medium",
      EnqueueGptImage1TextToImageQuality::High => "high",
    }
    .to_string()
  });

  let background = req.background.map(|b| {
    match b {
      EnqueueGptImage1TextToImageBackground::Auto => "auto",
      EnqueueGptImage1TextToImageBackground::Transparent => "transparent",
      EnqueueGptImage1TextToImageBackground::Opaque => "opaque",
    }
    .to_string()
  });

  let output_format = req.output_format.map(|f| {
    match f {
      EnqueueGptImage1TextToImageOutputFormat::Jpeg => "jpeg",
      EnqueueGptImage1TextToImageOutputFormat::Png => "png",
      EnqueueGptImage1TextToImageOutputFormat::Webp => "webp",
    }
    .to_string()
  });

  let request = GptImage1TextToImageInput {
    prompt: req.prompt,
    num_images: Some(num_images),
    image_size,
    quality,
    background,
    output_format,
  };

  let result = gpt_image_1_text_to_image(request)
    .with_api_key(&args.api_key.0)
    .queue_webhook(args.webhook_url)
    .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::text::enqueue_gpt_image_1_text_to_image_webhook::{
    enqueue_gpt_image_1_text_to_image_webhook, EnqueueGptImage1TextToImageArgs,
    EnqueueGptImage1TextToImageNumImages, EnqueueGptImage1TextToImageQuality,
    EnqueueGptImage1TextToImageRequest, EnqueueGptImage1TextToImageSize,
  };
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueGptImage1TextToImageArgs {
      request: EnqueueGptImage1TextToImageRequest {
        prompt: "an anime girl riding on the back of a t-rex".to_string(),
        num_images: EnqueueGptImage1TextToImageNumImages::One,
        image_size: Some(EnqueueGptImage1TextToImageSize::Horizontal),
        quality: Some(EnqueueGptImage1TextToImageQuality::Medium),
        background: None,
        output_format: None,
      },
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let _result = enqueue_gpt_image_1_text_to_image_webhook(args).await?;

    Ok(())
  }
}

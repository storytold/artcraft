use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests_old::http::image::edit::http_gpt_image_1p5_edit_image::{gpt_image_1p5_edit_image, GptImage1p5EditImageInput};
use crate::requests::core_api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueGptImage1p5EditImageArgs<'a, R: IntoUrl> {
  pub request: EnqueueGptImage1p5EditImageRequest,
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Clone, Debug)]
pub struct EnqueueGptImage1p5EditImageRequest {
  // Required
  pub prompt: String,
  pub image_urls: Vec<String>,
  pub num_images: EnqueueGptImage1p5EditImageNumImages,

  // Optional
  pub mask_image_url: Option<String>,
  pub image_size: Option<EnqueueGptImage1p5EditImageSize>,
  pub background: Option<EnqueueGptImage1p5EditImageBackground>,
  pub quality: Option<EnqueueGptImage1p5EditImageQuality>,
  pub input_fidelity: Option<EnqueueGptImage1p5EditImageInputFidelity>,
  pub output_format: Option<EnqueueGptImage1p5EditImageOutputFormat>,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1p5EditImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1p5EditImageSize {
  /// 1024x1024
  Square,
  /// 1536x1024
  Wide,
  /// 1024x1536
  Tall,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1p5EditImageBackground {
  Auto,
  Transparent,
  Opaque,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1p5EditImageQuality {
  Low,
  Medium,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1p5EditImageInputFidelity {
  Low,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1p5EditImageOutputFormat {
  Jpeg,
  Png,
  Webp,
}

impl FalRequestCostCalculator for EnqueueGptImage1p5EditImageRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Your request will cost different amounts based on the number of images, quality, and size.
    // For low quality, you will be charged $0.009 for 1024x1024 or $0.013 for any other size per image.
    // For medium quality, you will be charged $0.034 for 1024x1024, $0.051 for 1024x1536 and $0.050 for 1536x1024 per image.
    // For high quality, you will be charged $0.133 for 1024x1024, $0.200 for 1024x1536 or $0.199 for 1536x1024 per image.
    let use_quality = self.quality.unwrap_or(EnqueueGptImage1p5EditImageQuality::Medium);
    let use_size = self.image_size.unwrap_or(EnqueueGptImage1p5EditImageSize::Square);
    let base_cost = match (use_quality, use_size) {
      (EnqueueGptImage1p5EditImageQuality::Low, EnqueueGptImage1p5EditImageSize::Square) => 1,
      (EnqueueGptImage1p5EditImageQuality::Low, _) => 1,
      (EnqueueGptImage1p5EditImageQuality::Medium, EnqueueGptImage1p5EditImageSize::Square) => 3,
      (EnqueueGptImage1p5EditImageQuality::Medium, _) => 5,
      (EnqueueGptImage1p5EditImageQuality::High, EnqueueGptImage1p5EditImageSize::Square) => 13,
      (EnqueueGptImage1p5EditImageQuality::High, _) => 20,
    };
    let cost = match self.num_images {
      EnqueueGptImage1p5EditImageNumImages::One => base_cost,
      EnqueueGptImage1p5EditImageNumImages::Two => base_cost * 2,
      EnqueueGptImage1p5EditImageNumImages::Three => base_cost * 3,
      EnqueueGptImage1p5EditImageNumImages::Four => base_cost * 4,
    };
    cost as UsdCents
  }
}

pub async fn enqueue_gpt_image_1p5_image_edit_webhook<R: IntoUrl>(
  args: EnqueueGptImage1p5EditImageArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {
  let req = args.request;

  let num_images = match req.num_images {
    EnqueueGptImage1p5EditImageNumImages::One => 1,
    EnqueueGptImage1p5EditImageNumImages::Two => 2,
    EnqueueGptImage1p5EditImageNumImages::Three => 3,
    EnqueueGptImage1p5EditImageNumImages::Four => 4,
  };

  let image_size = req.image_size
      .map(|s| match s {
        EnqueueGptImage1p5EditImageSize::Square => "1024x1024",
        EnqueueGptImage1p5EditImageSize::Wide => "1536x1024",
        EnqueueGptImage1p5EditImageSize::Tall => "1024x1536",
      })
      .map(|resolution| resolution.to_string());

  let background = req.background
      .map(|s| match s {
        EnqueueGptImage1p5EditImageBackground::Auto => "auto",
        EnqueueGptImage1p5EditImageBackground::Transparent => "transparent",
        EnqueueGptImage1p5EditImageBackground::Opaque => "opaque",
      })
      .map(|aspect_ratio| aspect_ratio.to_string());

  let quality = req.quality
      .map(|s| match s {
        EnqueueGptImage1p5EditImageQuality::Low => "low",
        EnqueueGptImage1p5EditImageQuality::Medium => "medium",
        EnqueueGptImage1p5EditImageQuality::High => "high",
      })
      .map(|aspect_ratio| aspect_ratio.to_string());

  let input_fidelity = req.input_fidelity
      .map(|s| match s {
        EnqueueGptImage1p5EditImageInputFidelity::Low => "low",
        EnqueueGptImage1p5EditImageInputFidelity::High => "high",
      })
      .map(|aspect_ratio| aspect_ratio.to_string());

  let output_format = req.output_format
      .map(|s| match s {
        EnqueueGptImage1p5EditImageOutputFormat::Jpeg => "jpeg",
        EnqueueGptImage1p5EditImageOutputFormat::Png => "png",
        EnqueueGptImage1p5EditImageOutputFormat::Webp => "webp",
      })
      .map(|aspect_ratio| aspect_ratio.to_string())
      .unwrap_or_else(|| "png".to_string());

  let request = GptImage1p5EditImageInput {
    prompt: req.prompt,
    image_urls: req.image_urls,
    num_images: Some(num_images),
    output_format: Some(output_format),
    // Optionals
    mask_image_url: req.mask_image_url,
    image_size,
    background,
    quality,
    input_fidelity,
  };

  let result = gpt_image_1p5_edit_image(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests_old::webhook::image::edit::enqueue_gpt_image_1p5_edit_image_webhook::{
    enqueue_gpt_image_1p5_image_edit_webhook, EnqueueGptImage1p5EditImageArgs,
    EnqueueGptImage1p5EditImageNumImages, EnqueueGptImage1p5EditImageRequest,
  };
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{ERNEST_SCARED_STUPID_IMAGE_URL, GHOST_IMAGE_URL, TREX_SKELETON_IMAGE_URL};

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueGptImage1p5EditImageArgs {
      request: EnqueueGptImage1p5EditImageRequest {
        image_urls: vec![
          GHOST_IMAGE_URL.to_string(),
          TREX_SKELETON_IMAGE_URL.to_string(),
          ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
        ],
        prompt: "add the ghost and scared man to the image of the t-rex skeleton, make it look spooky but friendly".to_string(),
        num_images: EnqueueGptImage1p5EditImageNumImages::Two,
        mask_image_url: None,
        image_size: None,
        background: None,
        quality: None,
        input_fidelity: None,
        output_format: None,
      },
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_gpt_image_1p5_image_edit_webhook(args).await?;

    Ok(())
  }
}

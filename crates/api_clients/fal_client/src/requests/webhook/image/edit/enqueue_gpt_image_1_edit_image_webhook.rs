use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::core_api::webhook_response::WebhookResponse;
use crate::requests::http::image::edit::http_gpt_image_1_edit_image::{
  gpt_image_1_edit_image, GptImage1EditImageInput,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{
  FalRequestCostCalculator, UsdCents,
};
use reqwest::IntoUrl;

/// Typed args for the non-BYOK `fal-ai/gpt-image-1/edit-image` endpoint.
///
/// (The BYOK variant lives in `enqueue_gpt_image_1_byok_edit_image_webhook.rs`
/// and is deprecated.)
pub struct EnqueueGptImage1EditImageArgs<'a, R: IntoUrl> {
  pub request: EnqueueGptImage1EditImageRequest,
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Clone, Debug)]
pub struct EnqueueGptImage1EditImageRequest {
  // Required
  pub prompt: String,
  pub image_urls: Vec<String>,
  pub num_images: EnqueueGptImage1EditImageNumImages,

  // Optional
  pub mask_image_url: Option<String>,
  pub image_size: Option<EnqueueGptImage1EditImageSize>,
  pub quality: Option<EnqueueGptImage1EditImageQuality>,
  pub input_fidelity: Option<EnqueueGptImage1EditImageInputFidelity>,
  pub background: Option<EnqueueGptImage1EditImageBackground>,
  pub output_format: Option<EnqueueGptImage1EditImageOutputFormat>,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1EditImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1EditImageSize {
  Auto,
  /// 1024x1024
  Square,
  /// 1536x1024
  Horizontal,
  /// 1024x1536
  Vertical,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1EditImageQuality {
  Low,
  Medium,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1EditImageInputFidelity {
  Low,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1EditImageBackground {
  Auto,
  Transparent,
  Opaque,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueGptImage1EditImageOutputFormat {
  Jpeg,
  Png,
  Webp,
}

impl FalRequestCostCalculator for EnqueueGptImage1EditImageRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Per fal docs (fal-ai/gpt-image-1/edit-image), pricing matches
    // text-to-image (input image tokens are billed separately and not included
    // in this base estimate):
    //   Low:    $0.011 (1024x1024) / $0.016 (other) per image
    //   Medium: $0.042 (1024x1024) / $0.063 (other) per image
    //   High:   $0.167 (1024x1024) / $0.25  (other) per image
    let use_quality = self
      .quality
      .unwrap_or(EnqueueGptImage1EditImageQuality::Medium);
    let is_square = matches!(
      self.image_size,
      None | Some(EnqueueGptImage1EditImageSize::Square) | Some(EnqueueGptImage1EditImageSize::Auto)
    );
    let base_cost: u64 = match (use_quality, is_square) {
      (EnqueueGptImage1EditImageQuality::Low, true) => 2,
      (EnqueueGptImage1EditImageQuality::Low, false) => 2,
      (EnqueueGptImage1EditImageQuality::Medium, true) => 5,
      (EnqueueGptImage1EditImageQuality::Medium, false) => 7,
      (EnqueueGptImage1EditImageQuality::High, true) => 17,
      (EnqueueGptImage1EditImageQuality::High, false) => 25,
    };
    let n: u64 = match self.num_images {
      EnqueueGptImage1EditImageNumImages::One => 1,
      EnqueueGptImage1EditImageNumImages::Two => 2,
      EnqueueGptImage1EditImageNumImages::Three => 3,
      EnqueueGptImage1EditImageNumImages::Four => 4,
    };
    base_cost * n
  }
}

pub async fn enqueue_gpt_image_1_edit_image_webhook<R: IntoUrl>(
  args: EnqueueGptImage1EditImageArgs<'_, R>,
) -> Result<WebhookResponse, FalErrorPlus> {
  let req = args.request;

  let num_images: u8 = match req.num_images {
    EnqueueGptImage1EditImageNumImages::One => 1,
    EnqueueGptImage1EditImageNumImages::Two => 2,
    EnqueueGptImage1EditImageNumImages::Three => 3,
    EnqueueGptImage1EditImageNumImages::Four => 4,
  };

  let image_size = req.image_size.map(|s| {
    match s {
      EnqueueGptImage1EditImageSize::Auto => "auto",
      EnqueueGptImage1EditImageSize::Square => "1024x1024",
      EnqueueGptImage1EditImageSize::Horizontal => "1536x1024",
      EnqueueGptImage1EditImageSize::Vertical => "1024x1536",
    }
    .to_string()
  });

  let quality = req.quality.map(|q| {
    match q {
      EnqueueGptImage1EditImageQuality::Low => "low",
      EnqueueGptImage1EditImageQuality::Medium => "medium",
      EnqueueGptImage1EditImageQuality::High => "high",
    }
    .to_string()
  });

  let input_fidelity = req.input_fidelity.map(|f| {
    match f {
      EnqueueGptImage1EditImageInputFidelity::Low => "low",
      EnqueueGptImage1EditImageInputFidelity::High => "high",
    }
    .to_string()
  });

  let background = req.background.map(|b| {
    match b {
      EnqueueGptImage1EditImageBackground::Auto => "auto",
      EnqueueGptImage1EditImageBackground::Transparent => "transparent",
      EnqueueGptImage1EditImageBackground::Opaque => "opaque",
    }
    .to_string()
  });

  let output_format = req.output_format.map(|f| {
    match f {
      EnqueueGptImage1EditImageOutputFormat::Jpeg => "jpeg",
      EnqueueGptImage1EditImageOutputFormat::Png => "png",
      EnqueueGptImage1EditImageOutputFormat::Webp => "webp",
    }
    .to_string()
  });

  let request = GptImage1EditImageInput {
    prompt: req.prompt,
    image_urls: req.image_urls,
    mask_image_url: req.mask_image_url,
    num_images: Some(num_images),
    image_size,
    quality,
    input_fidelity,
    background,
    output_format,
  };

  let result = gpt_image_1_edit_image(request)
    .with_api_key(&args.api_key.0)
    .queue_webhook(args.webhook_url)
    .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::edit::enqueue_gpt_image_1_edit_image_webhook::{
    enqueue_gpt_image_1_edit_image_webhook, EnqueueGptImage1EditImageArgs,
    EnqueueGptImage1EditImageNumImages, EnqueueGptImage1EditImageQuality,
    EnqueueGptImage1EditImageRequest, EnqueueGptImage1EditImageSize,
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
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueGptImage1EditImageArgs {
      request: EnqueueGptImage1EditImageRequest {
        prompt: "add the ghost and scared man to the image of the t-rex skeleton, make it look spooky but friendly".to_string(),
        image_urls: vec![
          GHOST_IMAGE_URL.to_string(),
          TREX_SKELETON_IMAGE_URL.to_string(),
          ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
        ],
        num_images: EnqueueGptImage1EditImageNumImages::One,
        mask_image_url: None,
        image_size: Some(EnqueueGptImage1EditImageSize::Horizontal),
        quality: Some(EnqueueGptImage1EditImageQuality::Medium),
        input_fidelity: None,
        background: None,
        output_format: None,
      },
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let _result = enqueue_gpt_image_1_edit_image_webhook(args).await?;

    Ok(())
  }
}

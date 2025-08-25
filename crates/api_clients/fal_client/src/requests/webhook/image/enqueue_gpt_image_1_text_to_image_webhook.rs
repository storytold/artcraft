use crate::creds::fal_api_key::FalApiKey;
use crate::creds::open_ai_api_key::OpenAiApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::prelude::fal_ai::gpt_image_1::edit_image::byok::{gpt_text_to_image, GptTextToImageRequest};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct GptTextToImageByokArgs<'a, V: IntoUrl> {
  // Request
  pub prompt: &'a str,
  pub image_size: GptTextToImageSize,
  pub num_images: GptTextToImageNumImages,
  pub quality: GptTextToImageQuality,
  
  // Fulfillment
  pub api_key: &'a FalApiKey,
  pub openai_api_key: &'a OpenAiApiKey,
  pub webhook_url: V,
}

#[derive(Copy, Clone, Debug)]
pub enum GptTextToImageSize{
  Auto,
  Square,
  Horizontal,
  Vertical,
}

#[derive(Copy, Clone, Debug)]
pub enum GptTextToImageQuality {
  Auto,
  Low,
  Medium,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum GptTextToImageNumImages{
  One,
  Two,
  Three,
  Four,
}

pub async fn enqueue_gpt_image_1_text_to_image_webhook<V: IntoUrl>(
  args: GptTextToImageByokArgs<'_, V>
) -> Result<WebhookResponse, FalErrorPlus> {

  // auto, 1024x1024, 1536x1024, 1024x1536
  let image_size = match args.image_size {
    GptTextToImageSize::Auto => "auto",
    GptTextToImageSize::Square => "1024x1024",
    GptTextToImageSize::Horizontal => "1536x1024",
    GptTextToImageSize::Vertical => "1024x1536",
  };
  
  let quality = match args.quality {
    GptTextToImageQuality::Auto => "auto",
    GptTextToImageQuality::Low => "low",
    GptTextToImageQuality::Medium => "medium",
    GptTextToImageQuality::High => "high",
  };

  let num_images = match args.num_images {
    GptTextToImageNumImages::One => 1,
    GptTextToImageNumImages::Two => 2,
    GptTextToImageNumImages::Three => 3,
    GptTextToImageNumImages::Four => 4,
  };

  let request = GptTextToImageRequest {
    prompt: args.prompt.to_string(),
    image_size: image_size.to_string(),
    num_images,
    quality: quality.to_string(),
    openai_api_key: args.openai_api_key.0.to_string(),
  };

  let result = gpt_text_to_image(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}


#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::creds::open_ai_api_key::OpenAiApiKey;
  use crate::requests::webhook::image::enqueue_gpt_image_1_text_to_image_webhook::{enqueue_gpt_image_1_text_to_image_webhook, GptTextToImageByokArgs, GptTextToImageNumImages, GptTextToImageQuality, GptTextToImageSize};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let fal_api_key = FalApiKey::from_str(&secret);

    let secret = read_to_string("/Users/bt/Artcraft/credentials/openai_api_key.txt")?;

    let open_ai_api_key = OpenAiApiKey::from_str(&secret);

    let args = GptTextToImageByokArgs {
      prompt: "put the man and the ghost on the grassy hill. the man is scared of the friendly ghost.",
      api_key: &fal_api_key,
      openai_api_key: &open_ai_api_key,
      webhook_url: "https://example.com/webhook",
      image_size: GptTextToImageSize::Horizontal,
      num_images: GptTextToImageNumImages::One,
      quality: GptTextToImageQuality::High,
    };

    let result = enqueue_gpt_image_1_text_to_image_webhook(args).await?;

    Ok(())
  }
}

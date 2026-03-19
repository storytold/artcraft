use crate::creds::fal_api_key::FalApiKey;
use crate::creds::open_ai_api_key::OpenAiApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::image::text::http_gpt_image_1_text_to_image::{gpt_image_1_text_to_image, GptImage1TextToImageInput};
use crate::requests::api::webhook_response::WebhookResponse;
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


// NB: These are BYOK, so they're not Fal's prices
impl <U: IntoUrl> FalRequestCostCalculator for GptTextToImageByokArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Can't find details, so using this: https://www.reddit.com/r/OpenAI/comments/1krfwa1/pricing_gpt_image_1_model/
    // Prompts are billed similarly to other GPT models. Image outputs cost approximately $0.01 (low), $0.04 (medium),
    // and $0.17 (high) for square images.
    // We're likely losing money on this, but that's okay. Will adjust in the future to be fair to users and us.
    let base_cost = match self.quality {
      GptTextToImageQuality::Auto => 17,
      GptTextToImageQuality::Low => 1,
      GptTextToImageQuality::Medium => 4,
      GptTextToImageQuality::High => 17,
    };
    let cost = match self.num_images {
      GptTextToImageNumImages::One => base_cost,
      GptTextToImageNumImages::Two => base_cost * 2,
      GptTextToImageNumImages::Three => base_cost * 3,
      GptTextToImageNumImages::Four => base_cost * 4,
    };
    cost as UsdCents
  }
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

  let request = GptImage1TextToImageInput {
    prompt: args.prompt.to_string(),
    image_size: image_size.to_string(),
    num_images,
    quality: quality.to_string(),
    openai_api_key: args.openai_api_key.0.to_string(),
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
  use crate::creds::open_ai_api_key::OpenAiApiKey;
  use crate::requests::webhook::image::text::enqueue_gpt_image_1_text_to_image_webhook::{enqueue_gpt_image_1_text_to_image_webhook, GptTextToImageByokArgs, GptTextToImageNumImages, GptTextToImageQuality, GptTextToImageSize};
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

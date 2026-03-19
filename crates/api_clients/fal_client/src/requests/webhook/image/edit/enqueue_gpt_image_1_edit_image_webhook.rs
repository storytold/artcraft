use crate::creds::fal_api_key::FalApiKey;
use crate::creds::open_ai_api_key::OpenAiApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::image::edit::http_gpt_image_1_edit_image::{gpt_image_1_edit_image, GptImage1EditImageInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct GptEditImageByokArgs<'a, V: IntoUrl> {
  // Request
  pub image_urls: Vec<String>,
  pub prompt: &'a str,
  pub image_size: GptEditImageSize,
  pub num_images: GptEditImageNumImages,
  pub quality: GptEditImageQuality,
  
  // Fulfillment
  pub api_key: &'a FalApiKey,
  pub openai_api_key: &'a OpenAiApiKey,
  pub webhook_url: V,
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
impl <U: IntoUrl> FalRequestCostCalculator for GptEditImageByokArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Can't find details, so using this: https://www.reddit.com/r/OpenAI/comments/1krfwa1/pricing_gpt_image_1_model/
    // Prompts are billed similarly to other GPT models. Image outputs cost approximately $0.01 (low), $0.04 (medium),
    // and $0.17 (high) for square images.
    // We're likely losing money on this, but that's okay. Will adjust in the future to be fair to users and us.
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


pub async fn enqueue_gpt_image_1_edit_image_webhook<V: IntoUrl>(
  args: GptEditImageByokArgs<'_, V>
) -> Result<WebhookResponse, FalErrorPlus> {

  // auto, 1024x1024, 1536x1024, 1024x1536
  let image_size = match args.image_size {
    GptEditImageSize::Auto => "auto",
    GptEditImageSize::Square => "1024x1024",
    GptEditImageSize::Horizontal => "1536x1024",
    GptEditImageSize::Vertical => "1024x1536",
  };
  
  let quality = match args.quality {
    GptEditImageQuality::Auto => "auto",
    GptEditImageQuality::Low => "low",
    GptEditImageQuality::Medium => "medium",
    GptEditImageQuality::High => "high",
  };

  let num_images = match args.num_images {
    GptEditImageNumImages::One => 1,
    GptEditImageNumImages::Two => 2,
    GptEditImageNumImages::Three => 3,
    GptEditImageNumImages::Four => 4,
  };

  let request = GptImage1EditImageInput {
    image_urls: args.image_urls,
    prompt: args.prompt.to_string(),
    image_size: image_size.to_string(),
    num_images,
    quality: quality.to_string(),
    openai_api_key: args.openai_api_key.0.to_string(),
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
  use crate::creds::open_ai_api_key::OpenAiApiKey;
  use crate::requests::webhook::image::edit::enqueue_gpt_image_1_edit_image_webhook::{enqueue_gpt_image_1_edit_image_webhook, GptEditImageByokArgs, GptEditImageNumImages, GptEditImageQuality, GptEditImageSize};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{ERNEST_SCARED_STUPID_IMAGE_URL, GHOST_IMAGE_URL, GRASSY_HILL_TRANSPARENT_IMAGE_URL};

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    let image_url = "https://cdn-2.fakeyou.com/media/3/4/h/f/s/34hfsmt8e38rvne6mwa4pwbxr6292sgy/image_34hfsmt8e38rvne6mwa4pwbxr6292sgy.png";

    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let fal_api_key = FalApiKey::from_str(&secret);

    let secret = read_to_string("/Users/bt/Artcraft/credentials/openai_api_key.txt")?;

    let open_ai_api_key = OpenAiApiKey::from_str(&secret);

    let args = GptEditImageByokArgs {
      image_urls: vec![
        ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
        GHOST_IMAGE_URL.to_string(),
        GRASSY_HILL_TRANSPARENT_IMAGE_URL.to_string(),
      ],
      prompt: "put the man and the ghost on the grassy hill. the man is scared of the friendly ghost.",
      api_key: &fal_api_key,
      openai_api_key: &open_ai_api_key,
      webhook_url: "https://example.com/webhook",
      image_size: GptEditImageSize::Horizontal,
      num_images: GptEditImageNumImages::One,
      quality: GptEditImageQuality::High,
    };

    let result = enqueue_gpt_image_1_edit_image_webhook(args).await?;

    Ok(())
  }
}

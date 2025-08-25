use crate::creds::fal_api_key::FalApiKey;
use crate::creds::open_ai_api_key::OpenAiApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::gpt_image_1::edit_image::byok::{gpt_edit_image, GptEditImageRequest};
use fal::webhook::WebhookResponse;
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
pub enum GptEditImageSize{
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

  let request = GptEditImageRequest {
    image_urls: args.image_urls,
    prompt: args.prompt.to_string(),
    image_size: image_size.to_string(),
    num_images,
    quality: quality.to_string(),
    openai_api_key: args.openai_api_key.0.to_string(),
  };

  let result = gpt_edit_image(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}


#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::creds::open_ai_api_key::OpenAiApiKey;
  use crate::requests::webhook::image::enqueue_gpt_image_1_edit_image_webhook::{enqueue_gpt_image_1_edit_image_webhook, GptEditImageByokArgs, GptEditImageNumImages, GptEditImageQuality, GptEditImageSize};
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

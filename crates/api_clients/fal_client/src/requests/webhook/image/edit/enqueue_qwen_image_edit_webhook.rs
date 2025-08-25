use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::qwen_image_edit::{qwen_image_edit, QwenImageEditInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct QwenImageEditArgs<'a, U: IntoUrl, R: IntoUrl> {
  // Request required
  pub prompt: &'a str,
  pub image_url: U,
  
  // Request optional
  pub num_images: Option<QwenImageEditNumImages>,
  pub image_size: Option<QwenImageEditSize>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum QwenImageEditNumImages {
  One, // Default
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum QwenImageEditSize {
  Square, // 1:1
  SquareHd, // 1:1
  LandscapeFourByThree, // 4:3
  LandscapeSixteenByNine, // 16:9
  PortraitThreeByFour, // 3:4
  PortraitNineBySixteen, // 9:16
  //Custom { width: u32, height: u32 }, // TODO
}

pub async fn enqueue_qwen_image_edit_webhook<U: IntoUrl, R: IntoUrl>(
  args: QwenImageEditArgs<'_, U, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = args.num_images
      .map(|num| match num {
        QwenImageEditNumImages::One => 1,
        QwenImageEditNumImages::Two => 2,
        QwenImageEditNumImages::Three => 3,
        QwenImageEditNumImages::Four => 4,
      });

  let image_size = args.image_size
      .map(|size| match size {
        QwenImageEditSize::Square => "square",
        QwenImageEditSize::SquareHd => "square_hd",
        QwenImageEditSize::LandscapeFourByThree => "landscape_4_3",
        QwenImageEditSize::LandscapeSixteenByNine => "landscape_16_9",
        QwenImageEditSize::PortraitThreeByFour => "portrait_4_3", // NB: I think they made a mistake
        QwenImageEditSize::PortraitNineBySixteen => "portrait_16_9", // NB: I think they made a mistake
      })
      .map(|size| size.to_string());

  let request = QwenImageEditInput {
    prompt: args.prompt.to_string(),
    image_url: args.image_url.as_str().to_string(),
    image_size,
    num_images,

    // Maybe expose
    output_format: Some("png".to_string()), // png or jpeg
    negative_prompt: None,
    seed: None,

    // Constants
    //sync_mode: None, // Synchronous / slow
    num_inference_steps: None,
    guidance_scale: None,
    enable_safety_checker: None,
    acceleration: None,
  };

  let result = qwen_image_edit(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::edit::enqueue_qwen_image_edit_webhook::{enqueue_qwen_image_edit_webhook, QwenImageEditArgs, QwenImageEditNumImages};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::MOUNTAIN_TREE_IMAGE_URL;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = QwenImageEditArgs {
      image_url: MOUNTAIN_TREE_IMAGE_URL,
      prompt: "put christmas lights on the tree, add snow to the mountains",
      num_images: Some(QwenImageEditNumImages::One),
      image_size: None,
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_qwen_image_edit_webhook(args).await?;

    Ok(())
  }
}

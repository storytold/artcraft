use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::image::edit::http_gemini_25_flash_edit::{gemini_25_flash_edit, Gemini25FlashEditInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct Gemini25FlashEditArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: &'a str,
  pub image_urls: Vec<String>,
  pub num_images: Gemini25FlashEditNumImages,
  
  // Optional
  pub aspect_ratio: Option<Gemini25FlashEditAspectRatio>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum Gemini25FlashEditNumImages {
  One,
  Two,
  Three,
  Four,
}

/// auto, 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16
/// Default is "auto"
#[derive(Copy, Clone, Debug)]
pub enum Gemini25FlashEditAspectRatio {
  // Automatic (default)
  Auto,
  // Square
  OneByOne,
  // Wide
  FiveByFour,
  FourByThree,
  ThreeByTwo,
  SixteenByNine,
  TwentyOneByNine,
  // Tall
  FourByFive,
  ThreeByFour,
  TwoByThree,
  NineBySixteen, // NB: No NineByTwentyOne ?
}


impl <U: IntoUrl> FalRequestCostCalculator for Gemini25FlashEditArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Your request will cost $0.039 per image. For $1.00, you can run this model 25 times.
    match self.num_images {
      Gemini25FlashEditNumImages::One => 4,
      Gemini25FlashEditNumImages::Two => 8,
      Gemini25FlashEditNumImages::Three => 12,
      Gemini25FlashEditNumImages::Four => 16,
    }
  }
}


pub async fn enqueue_gemini_25_flash_edit_webhook<R: IntoUrl>(
  args: Gemini25FlashEditArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = match args.num_images {
    Gemini25FlashEditNumImages::One => 1,
    Gemini25FlashEditNumImages::Two => 2,
    Gemini25FlashEditNumImages::Three => 3,
    Gemini25FlashEditNumImages::Four => 4,
  };

  let aspect_ratio = args.aspect_ratio
      .map(|aspect_ratio| match aspect_ratio {
        // Auto
        Gemini25FlashEditAspectRatio::Auto => "auto",
        // Square
        Gemini25FlashEditAspectRatio::OneByOne => "1:1",
        // Wide
        Gemini25FlashEditAspectRatio::FiveByFour => "5:4",
        Gemini25FlashEditAspectRatio::FourByThree => "4:3",
        Gemini25FlashEditAspectRatio::ThreeByTwo => "3:2",
        Gemini25FlashEditAspectRatio::SixteenByNine => "16:9",
        Gemini25FlashEditAspectRatio::TwentyOneByNine => "21:9",
        // Tall
        Gemini25FlashEditAspectRatio::FourByFive => "4:5",
        Gemini25FlashEditAspectRatio::ThreeByFour => "3:4",
        Gemini25FlashEditAspectRatio::TwoByThree => "2:3",
        Gemini25FlashEditAspectRatio::NineBySixteen => "9:16",
      })
      .map(|aspect_ratio| aspect_ratio.to_string());

  let request = Gemini25FlashEditInput {
    prompt: args.prompt.to_string(),
    image_urls: args.image_urls,
    aspect_ratio,
    // Constants
    num_images: Some(num_images),
    output_format: Some("png".to_string()),
  };

  let result = gemini_25_flash_edit(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::edit::enqueue_gemini_25_flash_edit_webhook::{enqueue_gemini_25_flash_edit_webhook, Gemini25FlashEditArgs, Gemini25FlashEditNumImages};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{GHOST_IMAGE_URL, TREX_SKELETON_IMAGE_URL};

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Gemini25FlashEditArgs {
      image_urls: vec![
        GHOST_IMAGE_URL.to_string(),
        TREX_SKELETON_IMAGE_URL.to_string(),
      ],
      num_images: Gemini25FlashEditNumImages::Two,
      aspect_ratio: None,
      prompt: "add the ghost to the image of the t-rex skeleton, make it look spooky but friendly",
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_gemini_25_flash_edit_webhook(args).await?;

    Ok(())
  }
}

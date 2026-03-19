use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::image::text::http_gemini_25_flash_text_to_image::{gemini_25_flash_text_to_image, Gemini25FlashTextToImageInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::webhook::image::edit::enqueue_gemini_25_flash_edit_webhook::{Gemini25FlashEditArgs, Gemini25FlashEditNumImages};

pub struct Gemini25FlashTextToImageArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: &'a str,
  pub num_images: Gemini25FlashTextToImageNumImages,
  
  // Optional
  pub aspect_ratio: Option<Gemini25FlashTextToImageAspectRatio>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum Gemini25FlashTextToImageNumImages {
  One,
  Two,
  Three,
  Four,
}

/// 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16
/// Default is "1:1"
#[derive(Copy, Clone, Debug)]
pub enum Gemini25FlashTextToImageAspectRatio {
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


impl <U: IntoUrl> FalRequestCostCalculator for Gemini25FlashTextToImageArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // NB: This was copied from the image-to-image case.
    // Your request will cost $0.039 per image. For $1.00, you can run this model 25 times.
    match self.num_images {
      Gemini25FlashTextToImageNumImages::One => 4,
      Gemini25FlashTextToImageNumImages::Two => 8,
      Gemini25FlashTextToImageNumImages::Three => 12,
      Gemini25FlashTextToImageNumImages::Four => 16,
    }
  }
}


pub async fn enqueue_gemini_25_flash_text_to_image_webhook<R: IntoUrl>(
  args: Gemini25FlashTextToImageArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = match args.num_images {
    Gemini25FlashTextToImageNumImages::One => 1,
    Gemini25FlashTextToImageNumImages::Two => 2,
    Gemini25FlashTextToImageNumImages::Three => 3,
    Gemini25FlashTextToImageNumImages::Four => 4,
  };

  let aspect_ratio = args.aspect_ratio
      .map(|aspect_ratio| match aspect_ratio {
        // Square
        Gemini25FlashTextToImageAspectRatio::OneByOne => "1:1",
        // Wide
        Gemini25FlashTextToImageAspectRatio::FiveByFour => "5:4",
        Gemini25FlashTextToImageAspectRatio::FourByThree => "4:3",
        Gemini25FlashTextToImageAspectRatio::ThreeByTwo => "3:2",
        Gemini25FlashTextToImageAspectRatio::SixteenByNine => "16:9",
        Gemini25FlashTextToImageAspectRatio::TwentyOneByNine => "21:9",
        // Tall
        Gemini25FlashTextToImageAspectRatio::FourByFive => "4:5",
        Gemini25FlashTextToImageAspectRatio::ThreeByFour => "3:4",
        Gemini25FlashTextToImageAspectRatio::TwoByThree => "2:3",
        Gemini25FlashTextToImageAspectRatio::NineBySixteen => "9:16",
      })
      .map(|aspect_ratio| aspect_ratio.to_string());

  let request = Gemini25FlashTextToImageInput {
    prompt: args.prompt.to_string(),
    aspect_ratio,
    // Constants
    num_images: Some(num_images),
    output_format: Some("png".to_string()),
  };

  let result = gemini_25_flash_text_to_image(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::text::enqueue_gemini_25_flash_text_to_image_webhook::{enqueue_gemini_25_flash_text_to_image_webhook, Gemini25FlashTextToImageArgs, Gemini25FlashTextToImageNumImages};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Gemini25FlashTextToImageArgs {
      prompt: "a warrior on the field of battle, final fantasy style, lots of hungry raptors rushing the heroes",
      num_images: Gemini25FlashTextToImageNumImages::Two,
      aspect_ratio: None,
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_gemini_25_flash_text_to_image_webhook(args).await?;

    Ok(())
  }
}

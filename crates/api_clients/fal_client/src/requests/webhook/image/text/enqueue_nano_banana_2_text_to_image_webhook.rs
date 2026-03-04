use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::image::http_nano_banana_2_text_to_image::{nano_banana_2_text_to_image, NanoBanana2TextToImageInput};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueNanoBanana2TextToImageArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: &'a str,
  pub num_images: EnqueueNanoBanana2TextToImageNumImages,

  // Optional args
  pub resolution: Option<EnqueueNanoBanana2TextToImageResolution>,
  pub aspect_ratio: Option<EnqueueNanoBanana2TextToImageAspectRatio>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueNanoBanana2TextToImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueNanoBanana2TextToImageResolution {
  HalfK, // "0.5K"
  OneK,  // "1K" (default)
  TwoK,  // "2K"
  FourK, // "4K"
}

/// auto, 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16
/// Default: "auto"
#[derive(Copy, Clone, Debug)]
pub enum EnqueueNanoBanana2TextToImageAspectRatio {
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
  NineBySixteen,
}


impl <U: IntoUrl> FalRequestCostCalculator for EnqueueNanoBanana2TextToImageArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // TODO(bt): Verify actual pricing for Nano Banana 2 on fal.ai.
    // 4K outputs may be charged at double the standard rate.
    let cost = match self.resolution {
      None => 15,
      Some(EnqueueNanoBanana2TextToImageResolution::HalfK) => 8,
      Some(EnqueueNanoBanana2TextToImageResolution::OneK) => 15,
      Some(EnqueueNanoBanana2TextToImageResolution::TwoK) => 15,
      Some(EnqueueNanoBanana2TextToImageResolution::FourK) => 30,
    };
    let cost = match self.num_images {
      EnqueueNanoBanana2TextToImageNumImages::One => cost,
      EnqueueNanoBanana2TextToImageNumImages::Two => cost * 2,
      EnqueueNanoBanana2TextToImageNumImages::Three => cost * 3,
      EnqueueNanoBanana2TextToImageNumImages::Four => cost * 4,
    };
    cost as UsdCents
  }
}


pub async fn enqueue_nano_banana_2_text_to_image_webhook<R: IntoUrl>(
  args: EnqueueNanoBanana2TextToImageArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = match args.num_images {
    EnqueueNanoBanana2TextToImageNumImages::One => 1,
    EnqueueNanoBanana2TextToImageNumImages::Two => 2,
    EnqueueNanoBanana2TextToImageNumImages::Three => 3,
    EnqueueNanoBanana2TextToImageNumImages::Four => 4,
  };

  let resolution = args.resolution
      .map(|resolution| match resolution {
        EnqueueNanoBanana2TextToImageResolution::HalfK => "0.5K",
        EnqueueNanoBanana2TextToImageResolution::OneK => "1K",
        EnqueueNanoBanana2TextToImageResolution::TwoK => "2K",
        EnqueueNanoBanana2TextToImageResolution::FourK => "4K",
      })
      .map(|r| r.to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|ar| match ar {
        // Auto
        EnqueueNanoBanana2TextToImageAspectRatio::Auto => "auto",
        // Square
        EnqueueNanoBanana2TextToImageAspectRatio::OneByOne => "1:1",
        // Wide
        EnqueueNanoBanana2TextToImageAspectRatio::FiveByFour => "5:4",
        EnqueueNanoBanana2TextToImageAspectRatio::FourByThree => "4:3",
        EnqueueNanoBanana2TextToImageAspectRatio::ThreeByTwo => "3:2",
        EnqueueNanoBanana2TextToImageAspectRatio::SixteenByNine => "16:9",
        EnqueueNanoBanana2TextToImageAspectRatio::TwentyOneByNine => "21:9",
        // Tall
        EnqueueNanoBanana2TextToImageAspectRatio::FourByFive => "4:5",
        EnqueueNanoBanana2TextToImageAspectRatio::ThreeByFour => "3:4",
        EnqueueNanoBanana2TextToImageAspectRatio::TwoByThree => "2:3",
        EnqueueNanoBanana2TextToImageAspectRatio::NineBySixteen => "9:16",
      })
      .map(|ar| ar.to_string());

  let request = NanoBanana2TextToImageInput {
    prompt: args.prompt.to_string(),
    num_images: Some(num_images),
    // Optionals
    aspect_ratio,
    resolution,
    // Constants
    output_format: Some("png".to_string()),
    limit_generations: None,
    safety_tolerance: Some("6".to_string()),
    enable_web_search: None,
    seed: None,
  };

  let result = nano_banana_2_text_to_image(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::text::enqueue_nano_banana_2_text_to_image_webhook::{enqueue_nano_banana_2_text_to_image_webhook, EnqueueNanoBanana2TextToImageArgs, EnqueueNanoBanana2TextToImageAspectRatio, EnqueueNanoBanana2TextToImageNumImages, EnqueueNanoBanana2TextToImageResolution};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueNanoBanana2TextToImageArgs {
      prompt: "an anime girl riding on the back of a t-rex",
      num_images: EnqueueNanoBanana2TextToImageNumImages::One,
      aspect_ratio: Some(EnqueueNanoBanana2TextToImageAspectRatio::SixteenByNine),
      resolution: Some(EnqueueNanoBanana2TextToImageResolution::TwoK),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_nano_banana_2_text_to_image_webhook(args).await?;

    Ok(())
  }
}

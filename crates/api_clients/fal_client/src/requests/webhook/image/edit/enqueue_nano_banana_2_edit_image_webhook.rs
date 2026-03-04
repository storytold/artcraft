use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::image::http_nano_banana_2_edit_image::{nano_banana_2_edit_image, NanoBanana2EditImageInput};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueNanoBanana2EditImageArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: &'a str,
  pub image_urls: Vec<String>,
  pub num_images: EnqueueNanoBanana2EditImageNumImages,

  // Optional args
  pub resolution: Option<EnqueueNanoBanana2EditImageResolution>,
  pub aspect_ratio: Option<EnqueueNanoBanana2EditImageAspectRatio>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueNanoBanana2EditImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueNanoBanana2EditImageResolution {
  HalfK, // "0.5K"
  OneK,  // "1K" (default)
  TwoK,  // "2K"
  FourK, // "4K"
}

/// auto, 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16
/// Default: "auto"
#[derive(Copy, Clone, Debug)]
pub enum EnqueueNanoBanana2EditImageAspectRatio {
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


impl <U: IntoUrl> FalRequestCostCalculator for EnqueueNanoBanana2EditImageArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // TODO(bt): Verify actual pricing for Nano Banana 2 on fal.ai.
    // 4K outputs may be charged at double the standard rate.
    let cost = match self.resolution {
      None => 15,
      Some(EnqueueNanoBanana2EditImageResolution::HalfK) => 8,
      Some(EnqueueNanoBanana2EditImageResolution::OneK) => 15,
      Some(EnqueueNanoBanana2EditImageResolution::TwoK) => 15,
      Some(EnqueueNanoBanana2EditImageResolution::FourK) => 30,
    };
    let cost = match self.num_images {
      EnqueueNanoBanana2EditImageNumImages::One => cost,
      EnqueueNanoBanana2EditImageNumImages::Two => cost * 2,
      EnqueueNanoBanana2EditImageNumImages::Three => cost * 3,
      EnqueueNanoBanana2EditImageNumImages::Four => cost * 4,
    };
    cost as UsdCents
  }
}


pub async fn enqueue_nano_banana_2_edit_image_webhook<R: IntoUrl>(
  args: EnqueueNanoBanana2EditImageArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = match args.num_images {
    EnqueueNanoBanana2EditImageNumImages::One => 1,
    EnqueueNanoBanana2EditImageNumImages::Two => 2,
    EnqueueNanoBanana2EditImageNumImages::Three => 3,
    EnqueueNanoBanana2EditImageNumImages::Four => 4,
  };

  let resolution = args.resolution
      .map(|resolution| match resolution {
        EnqueueNanoBanana2EditImageResolution::HalfK => "0.5K",
        EnqueueNanoBanana2EditImageResolution::OneK => "1K",
        EnqueueNanoBanana2EditImageResolution::TwoK => "2K",
        EnqueueNanoBanana2EditImageResolution::FourK => "4K",
      })
      .map(|r| r.to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|ar| match ar {
        // Auto
        EnqueueNanoBanana2EditImageAspectRatio::Auto => "auto",
        // Square
        EnqueueNanoBanana2EditImageAspectRatio::OneByOne => "1:1",
        // Wide
        EnqueueNanoBanana2EditImageAspectRatio::FiveByFour => "5:4",
        EnqueueNanoBanana2EditImageAspectRatio::FourByThree => "4:3",
        EnqueueNanoBanana2EditImageAspectRatio::ThreeByTwo => "3:2",
        EnqueueNanoBanana2EditImageAspectRatio::SixteenByNine => "16:9",
        EnqueueNanoBanana2EditImageAspectRatio::TwentyOneByNine => "21:9",
        // Tall
        EnqueueNanoBanana2EditImageAspectRatio::FourByFive => "4:5",
        EnqueueNanoBanana2EditImageAspectRatio::ThreeByFour => "3:4",
        EnqueueNanoBanana2EditImageAspectRatio::TwoByThree => "2:3",
        EnqueueNanoBanana2EditImageAspectRatio::NineBySixteen => "9:16",
      })
      .map(|ar| ar.to_string());

  let request = NanoBanana2EditImageInput {
    prompt: args.prompt.to_string(),
    image_urls: args.image_urls,
    num_images: Some(num_images),
    // Optionals
    aspect_ratio,
    resolution,
    // Constants
    output_format: Some("png".to_string()),
    safety_tolerance: Some("6".to_string()),
    limit_generations: None,
    enable_web_search: None,
    seed: None,
  };

  let result = nano_banana_2_edit_image(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::edit::enqueue_nano_banana_2_edit_image_webhook::{enqueue_nano_banana_2_edit_image_webhook, EnqueueNanoBanana2EditImageArgs, EnqueueNanoBanana2EditImageAspectRatio, EnqueueNanoBanana2EditImageNumImages, EnqueueNanoBanana2EditImageResolution};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{ERNEST_SCARED_STUPID_IMAGE_URL, GHOST_IMAGE_URL, TREX_SKELETON_IMAGE_URL};

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueNanoBanana2EditImageArgs {
      image_urls: vec![
        GHOST_IMAGE_URL.to_string(),
        TREX_SKELETON_IMAGE_URL.to_string(),
        ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      ],
      prompt: "add the ghost and scared man to the image of the t-rex skeleton, make it look spooky but friendly",
      num_images: EnqueueNanoBanana2EditImageNumImages::Two,
      aspect_ratio: Some(EnqueueNanoBanana2EditImageAspectRatio::SixteenByNine),
      resolution: Some(EnqueueNanoBanana2EditImageResolution::TwoK),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_nano_banana_2_edit_image_webhook(args).await?;

    Ok(())
  }
}

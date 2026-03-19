use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::image::edit::http_nano_banana_pro_edit_image::{nano_banana_pro_edit_image, NanoBananaProEditImageInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueNanoBananaProEditImageArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: &'a str,
  pub image_urls: Vec<String>,
  pub num_images: EnqueueNanoBananaProEditImageNumImages,

  // Optional args
  pub resolution: Option<EnqueueNanoBananaProEditImageResolution>,
  pub aspect_ratio: Option<EnqueueNanoBananaProEditImageAspectRatio>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueNanoBananaProEditImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueNanoBananaProEditImageResolution {
  OneK, // Default value "1K"
  TwoK,
  FourK,
}

/// auto, 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16
/// Default is "auto"
#[derive(Copy, Clone, Debug)]
pub enum EnqueueNanoBananaProEditImageAspectRatio {
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


impl <U: IntoUrl> FalRequestCostCalculator for EnqueueNanoBananaProEditImageArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Your request will cost $0.15 per image.
    // For $1.00, you can run this model 7 times.
    // 4K outputs will be charged at double the standard rate.
    // If web search is used, an additional $0.015 will be charged.
    // Note: Pricing may change in the future.
    let cost = match self.resolution {
      None => 15,
      Some(EnqueueNanoBananaProEditImageResolution::OneK) => 15,
      Some(EnqueueNanoBananaProEditImageResolution::TwoK) => 15,
      Some(EnqueueNanoBananaProEditImageResolution::FourK) => 30,
    };
    let cost = match self.num_images {
      EnqueueNanoBananaProEditImageNumImages::One => cost,
      EnqueueNanoBananaProEditImageNumImages::Two => cost * 2,
      EnqueueNanoBananaProEditImageNumImages::Three => cost * 3,
      EnqueueNanoBananaProEditImageNumImages::Four => cost * 4,
    };
    cost as UsdCents
  }
}

pub async fn enqueue_nano_banana_pro_image_edit_webhook<R: IntoUrl>(
  args: EnqueueNanoBananaProEditImageArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = match args.num_images {
    EnqueueNanoBananaProEditImageNumImages::One => 1,
    EnqueueNanoBananaProEditImageNumImages::Two => 2,
    EnqueueNanoBananaProEditImageNumImages::Three => 3,
    EnqueueNanoBananaProEditImageNumImages::Four => 4,
  };

  let resolution = args.resolution
      .map(|resolution| match resolution {
        EnqueueNanoBananaProEditImageResolution::OneK => "1K",
        EnqueueNanoBananaProEditImageResolution::TwoK => "2K",
        EnqueueNanoBananaProEditImageResolution::FourK => "4K",
      })
      .map(|resolution| resolution.to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|aspect_ratio| match aspect_ratio {
        // Auto
        EnqueueNanoBananaProEditImageAspectRatio::Auto => "auto",
        // Square
        EnqueueNanoBananaProEditImageAspectRatio::OneByOne => "1:1",
        // Wide
        EnqueueNanoBananaProEditImageAspectRatio::FiveByFour => "5:4",
        EnqueueNanoBananaProEditImageAspectRatio::FourByThree => "4:3",
        EnqueueNanoBananaProEditImageAspectRatio::ThreeByTwo => "3:2",
        EnqueueNanoBananaProEditImageAspectRatio::SixteenByNine => "16:9",
        EnqueueNanoBananaProEditImageAspectRatio::TwentyOneByNine => "21:9",
        // Tall
        EnqueueNanoBananaProEditImageAspectRatio::FourByFive => "4:5",
        EnqueueNanoBananaProEditImageAspectRatio::ThreeByFour => "3:4",
        EnqueueNanoBananaProEditImageAspectRatio::TwoByThree => "2:3",
        EnqueueNanoBananaProEditImageAspectRatio::NineBySixteen => "9:16",
      })
      .map(|aspect_ratio| aspect_ratio.to_string());

  let request = NanoBananaProEditImageInput {
    prompt: args.prompt.to_string(),
    image_urls: args.image_urls,
    num_images: Some(num_images),
    // Optionals
    aspect_ratio,
    resolution,
    // Constants
    output_format: Some("png".to_string()),
  };

  let result = nano_banana_pro_edit_image(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::edit::enqueue_nano_banana_pro_edit_image_webhook::{enqueue_nano_banana_pro_image_edit_webhook, EnqueueNanoBananaProEditImageArgs, EnqueueNanoBananaProEditImageAspectRatio, EnqueueNanoBananaProEditImageNumImages, EnqueueNanoBananaProEditImageResolution};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{ERNEST_SCARED_STUPID_IMAGE_URL, GHOST_IMAGE_URL, TREX_SKELETON_IMAGE_URL};

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueNanoBananaProEditImageArgs {
      image_urls: vec![
        GHOST_IMAGE_URL.to_string(),
        TREX_SKELETON_IMAGE_URL.to_string(),
        ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      ],
      prompt: "add the ghost and scared man to the image of the t-rex skeleton, make it look spooky but friendly",
      num_images: EnqueueNanoBananaProEditImageNumImages::Two,
      aspect_ratio: Some(EnqueueNanoBananaProEditImageAspectRatio::SixteenByNine),
      resolution: Some(EnqueueNanoBananaProEditImageResolution::TwoK),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_nano_banana_pro_image_edit_webhook(args).await?;

    Ok(())
  }
}

use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::image::text::http_flux_pro_11_ultra_text_to_image::{flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct FluxPro11UltraArgs<'a, U: IntoUrl> {
  pub prompt: &'a str,
  pub webhook_url: U,
  pub api_key: &'a FalApiKey,
  pub aspect_ratio: FluxPro11UltraAspectRatio,
  pub num_images: FluxPro11UltraNumImages,
}

#[derive(Copy, Clone, Debug)]
pub enum FluxPro11UltraAspectRatio {
  Square, // 1:1
  LandscapeThreeByTwo, // 3:2
  LandscapeFourByThree, // 4:3
  LandscapeSixteenByNine, // 16:9
  LandscapeTwentyOneByNine, // 21:9
  PortraitTwoByThree, // 2:3
  PortraitThreeByFour, // 3:4
  PortraitNineBySixteen, // 9:16
  PortraitNineByTwentyOne, // 9:21
  //Custom { width: u32, height: u32 }, // TODO
}

#[derive(Copy, Clone, Debug)]
pub enum FluxPro11UltraNumImages {
  One, // Default
  Two,
  Three,
  Four,
}


impl <U: IntoUrl> FalRequestCostCalculator for FluxPro11UltraArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Your request will cost $0.06 per image.
    let base_cost = 6;
    let cost = match self.num_images {
      FluxPro11UltraNumImages::One => base_cost,
      FluxPro11UltraNumImages::Two => base_cost * 2,
      FluxPro11UltraNumImages::Three => base_cost * 3,
      FluxPro11UltraNumImages::Four => base_cost * 4,
    };
    cost as UsdCents
  }
}


pub async fn enqueue_flux_pro_11_ultra_text_to_image_webhook<U: IntoUrl>(
  args: FluxPro11UltraArgs<'_, U>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = match args.num_images {
    FluxPro11UltraNumImages::One => 1,
    FluxPro11UltraNumImages::Two => 2,
    FluxPro11UltraNumImages::Three => 3,
    FluxPro11UltraNumImages::Four => 4,
  };

  let aspect_ratio = match args.aspect_ratio {
    FluxPro11UltraAspectRatio::Square => "1:1",
    FluxPro11UltraAspectRatio::LandscapeThreeByTwo => "3:2",
    FluxPro11UltraAspectRatio::LandscapeFourByThree => "4:3",
    FluxPro11UltraAspectRatio::LandscapeSixteenByNine => "16:9",
    FluxPro11UltraAspectRatio::LandscapeTwentyOneByNine => "21:9",
    FluxPro11UltraAspectRatio::PortraitTwoByThree => "2:3",
    FluxPro11UltraAspectRatio::PortraitThreeByFour => "3:4",
    FluxPro11UltraAspectRatio::PortraitNineBySixteen => "9:16",
    FluxPro11UltraAspectRatio::PortraitNineByTwentyOne => "9:21",
  };

  let request = FluxPro11UltraTextToImageInput {
    prompt: args.prompt.to_string(),
    num_images: Some(num_images),
    aspect_ratio: Some(aspect_ratio.to_string()),
    // Maybe expose
    seed: None,
    raw: Some(true), // Generate less processed, more natural-looking images. Default is false.
    // Maybe abstract
    enable_safety_checker: Some(false),
    safety_tolerance: Some("5".to_string()), // 1 is most strict, 5 is most permissive
    // Constants
    output_format: Some("png".to_string()),
    sync_mode: None, // Synchronous / slow
  };

  let result = flux_pro_11_ultra_text_to_image(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

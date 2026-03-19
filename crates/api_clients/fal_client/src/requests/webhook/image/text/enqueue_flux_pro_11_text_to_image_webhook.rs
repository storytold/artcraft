use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::image::text::http_flux_pro_11_text_to_image::{flux_pro_11_text_to_image, FluxPro11TextToImageInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct FluxPro11Args<'a, U: IntoUrl> {
  pub prompt: &'a str,
  pub webhook_url: U,
  pub api_key: &'a FalApiKey,
  pub aspect_ratio: FluxPro11AspectRatio,
  pub num_images: FluxPro11NumImages,
}

// TODO(bt,2026-01-01): This seems to disagree between Fal.ai and Fal.rs client libraries.
#[derive(Copy, Clone, Debug)]
pub enum FluxPro11AspectRatio {
  Square, // 1:1
  SquareHd, // 1:1 (TODO: Is this in the API? I checked recently and don't see it.)
  LandscapeFourByThree, // 4:3
  LandscapeSixteenByNine, // 16:9
  PortraitThreeByFour, // 3:4
  PortraitNineBySixteen, // 9:16
  //Custom { width: u32, height: u32 }, // TODO
}

#[derive(Copy, Clone, Debug)]
pub enum FluxPro11NumImages {
  One, // Default
  Two,
  Three,
  Four,
}


impl <U: IntoUrl> FalRequestCostCalculator for FluxPro11Args<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Your request will cost $0.04 per megapixel. -- NB: What? Not going to calculate that.
    let base_cost = 6;
    let cost = match self.num_images {
      FluxPro11NumImages::One => base_cost,
      FluxPro11NumImages::Two => base_cost * 2,
      FluxPro11NumImages::Three => base_cost * 3,
      FluxPro11NumImages::Four => base_cost * 4,
    };
    cost as UsdCents
  }
}


pub async fn enqueue_flux_pro_11_text_to_image_webhook<U: IntoUrl>(
  args: FluxPro11Args<'_, U>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = match args.num_images {
    FluxPro11NumImages::One => 1,
    FluxPro11NumImages::Two => 2,
    FluxPro11NumImages::Three => 3,
    FluxPro11NumImages::Four => 4,
  };

  let image_size = match args.aspect_ratio {
    FluxPro11AspectRatio::Square => "square",
    FluxPro11AspectRatio::SquareHd => "square_hd",
    FluxPro11AspectRatio::LandscapeFourByThree => "landscape_4_3",
    FluxPro11AspectRatio::LandscapeSixteenByNine => "landscape_16_9",
    FluxPro11AspectRatio::PortraitThreeByFour => "portrait_4_3",
    FluxPro11AspectRatio::PortraitNineBySixteen => "portrait_16_9",
  };

  let request = FluxPro11TextToImageInput {
    prompt: args.prompt.to_string(),
    num_images: Some(num_images),
    image_size: Some(image_size.to_string()),
    // Maybe expose
    seed: None,
    // Maybe abstract
    enable_safety_checker: Some(false),
    safety_tolerance: Some("5".to_string()), // 1 is most strict, 5 is most permissive
    // Constants
    output_format: Some("png".to_string()),
    sync_mode: None, // Synchronous / slow
  };

  let result = flux_pro_11_text_to_image(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::text::enqueue_flux_pro_11_text_to_image_webhook::{enqueue_flux_pro_11_text_to_image_webhook, FluxPro11Args, FluxPro11AspectRatio, FluxPro11NumImages};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = FluxPro11Args {
      prompt: "a giant red panda fighting a dragon in a futuristic city",
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
      num_images: FluxPro11NumImages::One,
      aspect_ratio: FluxPro11AspectRatio::LandscapeSixteenByNine,
    };

    let result = enqueue_flux_pro_11_text_to_image_webhook(args).await?;

    Ok(())
  }
}

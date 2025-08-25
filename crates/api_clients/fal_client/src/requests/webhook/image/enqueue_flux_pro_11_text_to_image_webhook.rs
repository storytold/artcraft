use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::flux_pro::v1_1::{v1_1, FluxProPlusTextToImageInput, ImageSizeProperty};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct FluxPro11Args<'a, U: IntoUrl> {
  pub prompt: &'a str,
  pub webhook_url: U,
  pub api_key: &'a FalApiKey,
  pub aspect_ratio: FluxPro11AspectRatio,
  pub num_images: FluxPro11NumImages,
}

#[derive(Copy, Clone, Debug)]
pub enum FluxPro11AspectRatio {
  Square, // 1:1
  SquareHd, // 1:1
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
    FluxPro11AspectRatio::Square => ImageSizeProperty::Square,
    FluxPro11AspectRatio::SquareHd => ImageSizeProperty::SquareHd,
    FluxPro11AspectRatio::LandscapeFourByThree => ImageSizeProperty::Landscape43,
    FluxPro11AspectRatio::LandscapeSixteenByNine => ImageSizeProperty::Landscape169,
    FluxPro11AspectRatio::PortraitThreeByFour => ImageSizeProperty::Portrait43,
    FluxPro11AspectRatio::PortraitNineBySixteen => ImageSizeProperty::Portrait169,
  };
  
  let request = FluxProPlusTextToImageInput {
    prompt: args.prompt.to_string(),
    num_images: Some(num_images),
    image_size: Some(image_size),
    // Maybe expose
    seed: None,
    // Maybe abstract
    enable_safety_checker: Some(false),
    safety_tolerance: Some("5".to_string()), // 1 is most strict, 5 is most permissive
    // Constants
    output_format: Some("png".to_string()),
    sync_mode: None, // Synchronous / slow
  };
  
  let result = v1_1(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::enqueue_flux_pro_11_text_to_image_webhook::{enqueue_flux_pro_11_text_to_image_webhook, FluxPro11Args, FluxPro11AspectRatio, FluxPro11NumImages};
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

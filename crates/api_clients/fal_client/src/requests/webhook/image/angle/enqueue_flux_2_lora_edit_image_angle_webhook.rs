use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::image::angle::http_flux_2_lora_edit_image_angle::{http_flux_2_lora_edit_image_angle, Flux2LoraEditImageAngleInput};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueFlux2LoraEditImageAngleArgs<'a, R: IntoUrl> {
  // Request required
  pub image_urls: Vec<String>,

  // Camera parameters
  pub horizontal_angle: Option<f64>,
  pub vertical_angle: Option<f64>,
  pub zoom: Option<f64>,

  // Optional args
  pub num_images: Option<EnqueueFlux2LoraAngleNumImages>,
  pub image_size: Option<EnqueueFlux2LoraAngleImageSize>,
  pub lora_scale: Option<f64>,
  pub guidance_scale: Option<f64>,
  pub num_inference_steps: Option<u32>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueFlux2LoraAngleNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueFlux2LoraAngleImageSize {
  Square,
  SquareHd,
  PortraitFourThree,
  PortraitSixteenNine,
  LandscapeFourThree,
  LandscapeSixteenNine,
}

impl <U: IntoUrl> FalRequestCostCalculator for EnqueueFlux2LoraEditImageAngleArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing: $0.021 per megapixel.
    // For a 1024x1024 image (~1 MP), that's ~2 cents per image.
    let unit_cost = 2;
    let cost = match self.num_images {
      None => unit_cost,
      Some(EnqueueFlux2LoraAngleNumImages::One) => unit_cost,
      Some(EnqueueFlux2LoraAngleNumImages::Two) => unit_cost * 2,
      Some(EnqueueFlux2LoraAngleNumImages::Three) => unit_cost * 3,
      Some(EnqueueFlux2LoraAngleNumImages::Four) => unit_cost * 4,
    };
    cost as UsdCents
  }
}

pub async fn enqueue_flux_2_lora_edit_image_angle_webhook<R: IntoUrl>(
  args: EnqueueFlux2LoraEditImageAngleArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = args.num_images
      .map(|n| match n {
        EnqueueFlux2LoraAngleNumImages::One => 1,
        EnqueueFlux2LoraAngleNumImages::Two => 2,
        EnqueueFlux2LoraAngleNumImages::Three => 3,
        EnqueueFlux2LoraAngleNumImages::Four => 4,
      });

  let image_size = args.image_size
      .map(|s| match s {
        EnqueueFlux2LoraAngleImageSize::Square => "square",
        EnqueueFlux2LoraAngleImageSize::SquareHd => "square_hd",
        EnqueueFlux2LoraAngleImageSize::PortraitFourThree => "portrait_4_3",
        EnqueueFlux2LoraAngleImageSize::PortraitSixteenNine => "portrait_16_9",
        EnqueueFlux2LoraAngleImageSize::LandscapeFourThree => "landscape_4_3",
        EnqueueFlux2LoraAngleImageSize::LandscapeSixteenNine => "landscape_16_9",
      })
      .map(|s| s.to_string());

  let request = Flux2LoraEditImageAngleInput {
    image_urls: args.image_urls,
    horizontal_angle: args.horizontal_angle,
    vertical_angle: args.vertical_angle,
    zoom: args.zoom,
    lora_scale: args.lora_scale,
    image_size,
    guidance_scale: args.guidance_scale,
    num_inference_steps: args.num_inference_steps,
    num_images,
    // Constants
    enable_safety_checker: Some(false),
    output_format: Some("png".to_string()),
    // Unused
    seed: None,
  };

  let result = http_flux_2_lora_edit_image_angle(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::angle::enqueue_flux_2_lora_edit_image_angle_webhook::{enqueue_flux_2_lora_edit_image_angle_webhook, EnqueueFlux2LoraEditImageAngleArgs, EnqueueFlux2LoraAngleNumImages, EnqueueFlux2LoraAngleImageSize};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  #[tokio::test]
  #[ignore]
  async fn test_single() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueFlux2LoraEditImageAngleArgs {
      image_urls: vec![JUNO_AT_LAKE_IMAGE_URL.to_string()],
      horizontal_angle: Some(45.0),
      vertical_angle: Some(15.0),
      zoom: Some(5.0),
      num_images: Some(EnqueueFlux2LoraAngleNumImages::One),
      image_size: Some(EnqueueFlux2LoraAngleImageSize::SquareHd),
      lora_scale: None,
      guidance_scale: None,
      num_inference_steps: None,
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let _result = enqueue_flux_2_lora_edit_image_angle_webhook(args).await?;
    Ok(())
  }

  /// Enqueues 27 angle combinations: 3 horizontal × 3 vertical × 3 zoom levels.
  #[tokio::test]
  #[ignore]
  async fn test_angle_grid() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let horizontal_angles: [f64; 3] = [-45.0, 0.0, 45.0];
    let vertical_angles: [f64; 3] = [-30.0, 0.0, 30.0];
    let zoom_levels: [f64; 3] = [0.0, 1.0, 3.0];

    for &h in &horizontal_angles {
      for &v in &vertical_angles {
        for &z in &zoom_levels {
          let args = EnqueueFlux2LoraEditImageAngleArgs {
            image_urls: vec![JUNO_AT_LAKE_IMAGE_URL.to_string()],
            horizontal_angle: Some(h),
            vertical_angle: Some(v),
            zoom: Some(z),
            num_images: Some(EnqueueFlux2LoraAngleNumImages::One),
            image_size: Some(EnqueueFlux2LoraAngleImageSize::SquareHd),
            lora_scale: None,
            guidance_scale: None,
            num_inference_steps: None,
            api_key: &api_key,
            webhook_url: "https://example.com/webhook",
          };

          let _result = enqueue_flux_2_lora_edit_image_angle_webhook(args).await?;
          println!("Enqueued: h={}, v={}, z={}", h, v, z);
        }
      }
    }

    Ok(())
  }
}

use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::image::angle::http_qwen_edit_2511_edit_image_angle::{http_qwen_edit_2511_edit_image_angle, QwenEdit2511EditImageAngleInput};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueQwenEdit2511EditImageAngleArgs<'a, R: IntoUrl> {
  // Request required
  pub image_urls: Vec<String>,

  // Camera parameters
  pub horizontal_angle: Option<f64>,
  pub vertical_angle: Option<f64>,
  pub zoom: Option<f64>,

  // Optional args
  pub additional_prompt: Option<&'a str>,
  pub num_images: Option<EnqueueQwenEdit2511AngleNumImages>,
  pub image_size: Option<EnqueueQwenEdit2511AngleImageSize>,
  pub lora_scale: Option<f64>,
  pub guidance_scale: Option<f64>,
  pub num_inference_steps: Option<u32>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueQwenEdit2511AngleNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueQwenEdit2511AngleImageSize {
  Square,
  SquareHd,
  PortraitFourThree,
  PortraitSixteenNine,
  LandscapeFourThree,
  LandscapeSixteenNine,
}

impl <U: IntoUrl> FalRequestCostCalculator for EnqueueQwenEdit2511EditImageAngleArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing: $0.035 per megapixel.
    // For a 1024x1024 image (~1 MP), that's ~4 cents per image.
    let unit_cost = 4;
    let cost = match self.num_images {
      None => unit_cost,
      Some(EnqueueQwenEdit2511AngleNumImages::One) => unit_cost,
      Some(EnqueueQwenEdit2511AngleNumImages::Two) => unit_cost * 2,
      Some(EnqueueQwenEdit2511AngleNumImages::Three) => unit_cost * 3,
      Some(EnqueueQwenEdit2511AngleNumImages::Four) => unit_cost * 4,
    };
    cost as UsdCents
  }
}

pub async fn enqueue_qwen_edit_2511_edit_image_angle_webhook<R: IntoUrl>(
  args: EnqueueQwenEdit2511EditImageAngleArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let num_images = args.num_images
      .map(|n| match n {
        EnqueueQwenEdit2511AngleNumImages::One => 1,
        EnqueueQwenEdit2511AngleNumImages::Two => 2,
        EnqueueQwenEdit2511AngleNumImages::Three => 3,
        EnqueueQwenEdit2511AngleNumImages::Four => 4,
      });

  let image_size = args.image_size
      .map(|s| match s {
        EnqueueQwenEdit2511AngleImageSize::Square => "square",
        EnqueueQwenEdit2511AngleImageSize::SquareHd => "square_hd",
        EnqueueQwenEdit2511AngleImageSize::PortraitFourThree => "portrait_4_3",
        EnqueueQwenEdit2511AngleImageSize::PortraitSixteenNine => "portrait_16_9",
        EnqueueQwenEdit2511AngleImageSize::LandscapeFourThree => "landscape_4_3",
        EnqueueQwenEdit2511AngleImageSize::LandscapeSixteenNine => "landscape_16_9",
      })
      .map(|s| s.to_string());

  let request = QwenEdit2511EditImageAngleInput {
    image_urls: args.image_urls,
    horizontal_angle: args.horizontal_angle,
    vertical_angle: args.vertical_angle,
    zoom: args.zoom,
    additional_prompt: args.additional_prompt.map(|s| s.to_string()),
    lora_scale: args.lora_scale,
    image_size,
    guidance_scale: args.guidance_scale,
    num_inference_steps: args.num_inference_steps,
    num_images,
    // Constants
    enable_safety_checker: Some(false),
    output_format: Some("png".to_string()),
    // Unused
    negative_prompt: None,
    seed: None,
  };

  let result = http_qwen_edit_2511_edit_image_angle(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::angle::enqueue_qwen_edit_2511_edit_image_angle_webhook::{enqueue_qwen_edit_2511_edit_image_angle_webhook, EnqueueQwenEdit2511EditImageAngleArgs, EnqueueQwenEdit2511AngleNumImages, EnqueueQwenEdit2511AngleImageSize};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  #[tokio::test]
  #[ignore]
  async fn test_single() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueQwenEdit2511EditImageAngleArgs {
      image_urls: vec![JUNO_AT_LAKE_IMAGE_URL.to_string()],
      horizontal_angle: Some(45.0),
      vertical_angle: Some(15.0),
      zoom: Some(5.0),
      additional_prompt: Some("cinematic lighting"),
      num_images: Some(EnqueueQwenEdit2511AngleNumImages::One),
      image_size: Some(EnqueueQwenEdit2511AngleImageSize::SquareHd),
      lora_scale: None,
      guidance_scale: None,
      num_inference_steps: None,
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let _result = enqueue_qwen_edit_2511_edit_image_angle_webhook(args).await?;
    Ok(())
  }

  /// Enqueues 9 angle combinations: 3 horizontal × 3 vertical × 3 zoom levels.
  /// Each combination generates one image, for a total of 27 enqueued requests.
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
          let args = EnqueueQwenEdit2511EditImageAngleArgs {
            image_urls: vec![JUNO_AT_LAKE_IMAGE_URL.to_string()],
            horizontal_angle: Some(h),
            vertical_angle: Some(v),
            zoom: Some(z),
            additional_prompt: None,
            num_images: Some(EnqueueQwenEdit2511AngleNumImages::One),
            image_size: Some(EnqueueQwenEdit2511AngleImageSize::SquareHd),
            lora_scale: None,
            guidance_scale: None,
            num_inference_steps: None,
            api_key: &api_key,
            webhook_url: "https://example.com/webhook",
          };

          let _result = enqueue_qwen_edit_2511_edit_image_angle_webhook(args).await?;
          println!("Enqueued: h={}, v={}, z={}", h, v, z);
        }
      }
    }

    Ok(())
  }
}

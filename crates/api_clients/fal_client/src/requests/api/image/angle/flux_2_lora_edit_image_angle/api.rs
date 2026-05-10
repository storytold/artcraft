use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::image::angle::flux_2_lora_edit_image_angle::raw_request::{Flux2LoraEditImageAngleInput, Flux2LoraEditImageAngleOutput};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;


#[derive(Clone, Debug)]
pub struct Flux2LoraEditImageAngleRequest {
  // Request required
  pub image_urls: Vec<String>,

  // Camera parameters
  pub horizontal_angle: Option<f64>,
  pub vertical_angle: Option<f64>,
  pub zoom: Option<f64>,

  // Optional args
  pub num_images: Option<Flux2LoraAngleNumImages>,
  pub image_size: Option<Flux2LoraAngleImageSize>,
  pub lora_scale: Option<f64>,
  pub guidance_scale: Option<f64>,
  pub num_inference_steps: Option<u32>,
}

#[derive(Copy, Clone, Debug)]
pub enum Flux2LoraAngleNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum Flux2LoraAngleImageSize {
  Square,
  SquareHd,
  PortraitFourThree,
  PortraitSixteenNine,
  LandscapeFourThree,
  LandscapeSixteenNine,
}

impl FalEndpoint for Flux2LoraEditImageAngleRequest {
  const ENDPOINT : &str = "fal-ai/flux-2-lora-gallery/multiple-angles";

  type RawRequest = Flux2LoraEditImageAngleInput;
  type RawResponse = Flux2LoraEditImageAngleOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let num_images = self.num_images
        .map(|n| match n {
          Flux2LoraAngleNumImages::One => 1,
          Flux2LoraAngleNumImages::Two => 2,
          Flux2LoraAngleNumImages::Three => 3,
          Flux2LoraAngleNumImages::Four => 4,
        });

    let image_size = self.image_size
        .map(|s| match s {
          Flux2LoraAngleImageSize::Square => "square",
          Flux2LoraAngleImageSize::SquareHd => "square_hd",
          Flux2LoraAngleImageSize::PortraitFourThree => "portrait_4_3",
          Flux2LoraAngleImageSize::PortraitSixteenNine => "portrait_16_9",
          Flux2LoraAngleImageSize::LandscapeFourThree => "landscape_4_3",
          Flux2LoraAngleImageSize::LandscapeSixteenNine => "landscape_16_9",
        })
        .map(|s| s.to_string());

    Ok(Self::RawRequest {
      image_urls: self.image_urls.clone(),
      horizontal_angle: self.horizontal_angle,
      vertical_angle: self.vertical_angle,
      zoom: self.zoom,
      lora_scale: self.lora_scale,
      guidance_scale: self.guidance_scale,
      num_inference_steps: self.num_inference_steps,
      image_size,
      num_images,
      // Constants
      enable_safety_checker: Some(false),
      output_format: Some("png".to_string()),
      // Unused
      seed: None,
    })
  }
}


#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::image::angle::enqueue_flux_2_lora_edit_image_angle_webhook::{enqueue_flux_2_lora_edit_image_angle_webhook, EnqueueFlux2LoraAngleImageSize, EnqueueFlux2LoraAngleNumImages, EnqueueFlux2LoraEditImageAngleArgs, EnqueueFlux2LoraEditImageAngleRequest};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  #[tokio::test]
  #[ignore]
  async fn test_single() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueFlux2LoraEditImageAngleArgs {
      request: EnqueueFlux2LoraEditImageAngleRequest {
        image_urls: vec![JUNO_AT_LAKE_IMAGE_URL.to_string()],
        horizontal_angle: Some(45.0),
        vertical_angle: Some(15.0),
        zoom: Some(5.0),
        num_images: Some(EnqueueFlux2LoraAngleNumImages::One),
        image_size: Some(EnqueueFlux2LoraAngleImageSize::SquareHd),
        lora_scale: None,
        guidance_scale: None,
        num_inference_steps: None,
      },
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let _result = enqueue_flux_2_lora_edit_image_angle_webhook(args).await?;
    Ok(())
  }

  /// Enqueues 27 angle combinations: 3 horizontal x 3 vertical x 3 zoom levels.
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
            request: EnqueueFlux2LoraEditImageAngleRequest {
              image_urls: vec![JUNO_AT_LAKE_IMAGE_URL.to_string()],
              horizontal_angle: Some(h),
              vertical_angle: Some(v),
              zoom: Some(z),
              num_images: Some(EnqueueFlux2LoraAngleNumImages::One),
              image_size: Some(EnqueueFlux2LoraAngleImageSize::SquareHd),
              lora_scale: None,
              guidance_scale: None,
              num_inference_steps: None,
            },
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

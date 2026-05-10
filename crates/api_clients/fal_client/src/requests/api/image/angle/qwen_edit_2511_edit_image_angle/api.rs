use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::image::angle::qwen_edit_2511_edit_image_angle::raw_request::{
  QwenEdit2511EditImageAngleInput, QwenEdit2511EditImageAngleOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct QwenEdit2511EditImageAngleRequest {
  // Request required
  pub image_urls: Vec<String>,

  // Camera parameters
  pub horizontal_angle: Option<f64>,
  pub vertical_angle: Option<f64>,
  pub zoom: Option<f64>,

  // Optional args
  pub additional_prompt: Option<String>,
  pub num_images: Option<QwenEdit2511AngleNumImages>,
  pub image_size: Option<QwenEdit2511AngleImageSize>,
  pub lora_scale: Option<f64>,
  pub guidance_scale: Option<f64>,
  pub num_inference_steps: Option<u32>,
}

#[derive(Copy, Clone, Debug)]
pub enum QwenEdit2511AngleNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum QwenEdit2511AngleImageSize {
  Square,
  SquareHd,
  PortraitFourThree,
  PortraitSixteenNine,
  LandscapeFourThree,
  LandscapeSixteenNine,
}

impl FalEndpoint for QwenEdit2511EditImageAngleRequest {
  const ENDPOINT: &str = "fal-ai/qwen-image-edit-2511-multiple-angles";

  type RawRequest = QwenEdit2511EditImageAngleInput;
  type RawResponse = QwenEdit2511EditImageAngleOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let num_images = self.num_images
      .map(|n| match n {
        QwenEdit2511AngleNumImages::One => 1,
        QwenEdit2511AngleNumImages::Two => 2,
        QwenEdit2511AngleNumImages::Three => 3,
        QwenEdit2511AngleNumImages::Four => 4,
      });

    let image_size = self.image_size
      .map(|s| match s {
        QwenEdit2511AngleImageSize::Square => "square",
        QwenEdit2511AngleImageSize::SquareHd => "square_hd",
        QwenEdit2511AngleImageSize::PortraitFourThree => "portrait_4_3",
        QwenEdit2511AngleImageSize::PortraitSixteenNine => "portrait_16_9",
        QwenEdit2511AngleImageSize::LandscapeFourThree => "landscape_4_3",
        QwenEdit2511AngleImageSize::LandscapeSixteenNine => "landscape_16_9",
      })
      .map(|s| s.to_string());

    Ok(Self::RawRequest {
      image_urls: self.image_urls.clone(),
      horizontal_angle: self.horizontal_angle,
      vertical_angle: self.vertical_angle,
      zoom: self.zoom,
      additional_prompt: self.additional_prompt.clone(),
      lora_scale: self.lora_scale,
      guidance_scale: self.guidance_scale,
      num_inference_steps: self.num_inference_steps,
      image_size,
      num_images,
      // Constants
      enable_safety_checker: Some(false),
      output_format: Some("png".to_string()),
      // Unused
      negative_prompt: None,
      seed: None,
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::traits::fal_endpoint_trait::FalEndpoint;
  use crate::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_single() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = QwenEdit2511EditImageAngleRequest {
      image_urls: vec![JUNO_AT_LAKE_IMAGE_URL.to_string()],
      horizontal_angle: Some(45.0),
      vertical_angle: Some(15.0),
      zoom: Some(5.0),
      additional_prompt: Some("cinematic lighting".to_string()),
      num_images: Some(QwenEdit2511AngleNumImages::One),
      image_size: Some(QwenEdit2511AngleImageSize::SquareHd),
      lora_scale: None,
      guidance_scale: None,
      num_inference_steps: None,
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Request ID: {:?}", result.request_id);
    Ok(())
  }

  /// Enqueues 27 angle combinations: 3 horizontal x 3 vertical x 3 zoom levels.
  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_angle_grid() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let horizontal_angles: [f64; 3] = [-45.0, 0.0, 45.0];
    let vertical_angles: [f64; 3] = [-30.0, 0.0, 30.0];
    let zoom_levels: [f64; 3] = [0.0, 1.0, 3.0];

    for &h in &horizontal_angles {
      for &v in &vertical_angles {
        for &z in &zoom_levels {
          let request = QwenEdit2511EditImageAngleRequest {
            image_urls: vec![JUNO_AT_LAKE_IMAGE_URL.to_string()],
            horizontal_angle: Some(h),
            vertical_angle: Some(v),
            zoom: Some(z),
            additional_prompt: None,
            num_images: Some(QwenEdit2511AngleNumImages::One),
            image_size: Some(QwenEdit2511AngleImageSize::SquareHd),
            lora_scale: None,
            guidance_scale: None,
            num_inference_steps: None,
          };

          let result = request.send_queue_request(&api_key).await?;
          println!("Enqueued: h={}, v={}, z={}, request_id={:?}", h, v, z, result.request_id);
        }
      }
    }

    Ok(())
  }

  // NB: Pricing tests are in cost.rs
}

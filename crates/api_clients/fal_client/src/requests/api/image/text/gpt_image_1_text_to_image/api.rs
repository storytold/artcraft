use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::image::text::gpt_image_1_text_to_image::raw_request::{
  GptImage1TextToImageInput, GptImage1TextToImageOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct GptImage1TextToImageRequest {
  /// Text prompt describing the image to generate.
  pub prompt: String,

  /// Number of images to generate.
  pub num_images: GptImage1TextToImageNumImages,

  /// Output image size.
  pub image_size: Option<GptImage1TextToImageSize>,

  /// Quality level.
  pub quality: Option<GptImage1TextToImageQuality>,

  /// Background mode.
  pub background: Option<GptImage1TextToImageBackground>,

  /// Output format.
  pub output_format: Option<GptImage1TextToImageOutputFormat>,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1TextToImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1TextToImageSize {
  Auto,
  /// 1024x1024
  Square,
  /// 1536x1024
  Horizontal,
  /// 1024x1536
  Vertical,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1TextToImageQuality {
  Low,
  Medium,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1TextToImageBackground {
  Auto,
  Transparent,
  Opaque,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1TextToImageOutputFormat {
  Jpeg,
  Png,
  Webp,
}

impl FalEndpoint for GptImage1TextToImageRequest {
  const ENDPOINT: &str = "fal-ai/gpt-image-1/text-to-image";

  type RawRequest = GptImage1TextToImageInput;
  type RawResponse = GptImage1TextToImageOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let num_images = match self.num_images {
      GptImage1TextToImageNumImages::One => 1,
      GptImage1TextToImageNumImages::Two => 2,
      GptImage1TextToImageNumImages::Three => 3,
      GptImage1TextToImageNumImages::Four => 4,
    };

    let image_size = self.image_size.map(|s| match s {
      GptImage1TextToImageSize::Auto => "auto",
      GptImage1TextToImageSize::Square => "1024x1024",
      GptImage1TextToImageSize::Horizontal => "1536x1024",
      GptImage1TextToImageSize::Vertical => "1024x1536",
    }.to_string());

    let quality = self.quality.map(|q| match q {
      GptImage1TextToImageQuality::Low => "low",
      GptImage1TextToImageQuality::Medium => "medium",
      GptImage1TextToImageQuality::High => "high",
    }.to_string());

    let background = self.background.map(|b| match b {
      GptImage1TextToImageBackground::Auto => "auto",
      GptImage1TextToImageBackground::Transparent => "transparent",
      GptImage1TextToImageBackground::Opaque => "opaque",
    }.to_string());

    let output_format = Some(match self.output_format {
      Some(GptImage1TextToImageOutputFormat::Jpeg) => "jpeg",
      Some(GptImage1TextToImageOutputFormat::Png) => "png",
      Some(GptImage1TextToImageOutputFormat::Webp) => "webp",
      None => "png",
    }.to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      num_images: Some(num_images),
      image_size,
      quality,
      background,
      output_format,
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::traits::fal_endpoint_trait::FalEndpoint;
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_text_to_image_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = GptImage1TextToImageRequest {
      prompt: "an anime girl riding on the back of a t-rex".to_string(),
      num_images: GptImage1TextToImageNumImages::One,
      image_size: Some(GptImage1TextToImageSize::Horizontal),
      quality: Some(GptImage1TextToImageQuality::Medium),
      background: None,
      output_format: None,
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Request ID: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_text_to_image_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = GptImage1TextToImageRequest {
      prompt: "a corgi wearing sunglasses at the beach".to_string(),
      num_images: GptImage1TextToImageNumImages::Two,
      image_size: Some(GptImage1TextToImageSize::Square),
      quality: Some(GptImage1TextToImageQuality::High),
      background: Some(GptImage1TextToImageBackground::Opaque),
      output_format: Some(GptImage1TextToImageOutputFormat::Png),
    };

    let result = request.send_webhook_request(
      &api_key,
      "https://example.com/webhook",
    ).await?;
    println!("Request ID: {:?}", result.request_id);
    assert!(result.request_id.is_some());
    Ok(())
  }

  // NB: Pricing tests are in cost.rs
}

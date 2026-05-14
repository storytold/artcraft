use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::image::text::gpt_image_1p5_text_to_image::raw_request::{
  GptImage1p5TextToImageInput, GptImage1p5TextToImageOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct GptImage1p5TextToImageRequest {
  /// Text prompt describing the image to generate.
  pub prompt: String,

  /// Number of images to generate.
  pub num_images: GptImage1p5TextToImageNumImages,

  /// Output image size.
  pub image_size: Option<GptImage1p5TextToImageSize>,

  /// Background mode.
  pub background: Option<GptImage1p5TextToImageBackground>,

  /// Quality level.
  pub quality: Option<GptImage1p5TextToImageQuality>,

  /// Output format.
  pub output_format: Option<GptImage1p5TextToImageOutputFormat>,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1p5TextToImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1p5TextToImageSize {
  /// 1024x1024
  Square,
  /// 1536x1024
  Wide,
  /// 1024x1536
  Tall,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1p5TextToImageBackground {
  Auto,
  Transparent,
  Opaque,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1p5TextToImageQuality {
  Low,
  Medium,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1p5TextToImageOutputFormat {
  Jpeg,
  Png,
  Webp,
}

impl FalEndpoint for GptImage1p5TextToImageRequest {
  const ENDPOINT: &str = "fal-ai/gpt-image-1.5";

  type RawRequest = GptImage1p5TextToImageInput;
  type RawResponse = GptImage1p5TextToImageOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let num_images = match self.num_images {
      GptImage1p5TextToImageNumImages::One => 1,
      GptImage1p5TextToImageNumImages::Two => 2,
      GptImage1p5TextToImageNumImages::Three => 3,
      GptImage1p5TextToImageNumImages::Four => 4,
    };

    let image_size = self.image_size.map(|s| match s {
      GptImage1p5TextToImageSize::Square => "1024x1024",
      GptImage1p5TextToImageSize::Wide => "1536x1024",
      GptImage1p5TextToImageSize::Tall => "1024x1536",
    }.to_string());

    let background = self.background.map(|b| match b {
      GptImage1p5TextToImageBackground::Auto => "auto",
      GptImage1p5TextToImageBackground::Transparent => "transparent",
      GptImage1p5TextToImageBackground::Opaque => "opaque",
    }.to_string());

    let quality = self.quality.map(|q| match q {
      GptImage1p5TextToImageQuality::Low => "low",
      GptImage1p5TextToImageQuality::Medium => "medium",
      GptImage1p5TextToImageQuality::High => "high",
    }.to_string());

    let output_format = Some(match self.output_format {
      Some(GptImage1p5TextToImageOutputFormat::Jpeg) => "jpeg",
      Some(GptImage1p5TextToImageOutputFormat::Png) => "png",
      Some(GptImage1p5TextToImageOutputFormat::Webp) => "webp",
      None => "png",
    }.to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      num_images: Some(num_images),
      image_size,
      background,
      quality,
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

    let request = GptImage1p5TextToImageRequest {
      prompt: "an anime girl riding on the back of a t-rex".to_string(),
      num_images: GptImage1p5TextToImageNumImages::One,
      image_size: None,
      background: None,
      quality: None,
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

    let request = GptImage1p5TextToImageRequest {
      prompt: "a corgi wearing sunglasses at the beach".to_string(),
      num_images: GptImage1p5TextToImageNumImages::Two,
      image_size: Some(GptImage1p5TextToImageSize::Wide),
      background: None,
      quality: Some(GptImage1p5TextToImageQuality::High),
      output_format: Some(GptImage1p5TextToImageOutputFormat::Png),
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

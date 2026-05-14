use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::image::text::gpt_image_2_text_to_image::raw_request::{
  GptImage2TextToImageInput, GptImage2TextToImageOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct GptImage2TextToImageRequest {
  /// Text prompt describing the image to generate.
  pub prompt: String,

  /// Number of images to generate.
  pub num_images: GptImage2TextToImageNumImages,

  /// Output image size.
  pub image_size: Option<GptImage2TextToImageSize>,

  /// Quality level.
  pub quality: Option<GptImage2TextToImageQuality>,

  /// Output format.
  pub output_format: Option<GptImage2TextToImageOutputFormat>,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage2TextToImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage2TextToImageSize {
  SquareHd,
  Square,
  Portrait4x3,
  Portrait16x9,
  Landscape4x3,
  Landscape16x9,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage2TextToImageQuality {
  Low,
  Medium,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage2TextToImageOutputFormat {
  Jpeg,
  Png,
  Webp,
}

impl FalEndpoint for GptImage2TextToImageRequest {
  const ENDPOINT: &str = "openai/gpt-image-2";

  type RawRequest = GptImage2TextToImageInput;
  type RawResponse = GptImage2TextToImageOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let num_images = match self.num_images {
      GptImage2TextToImageNumImages::One => 1,
      GptImage2TextToImageNumImages::Two => 2,
      GptImage2TextToImageNumImages::Three => 3,
      GptImage2TextToImageNumImages::Four => 4,
    };

    let image_size = self.image_size.map(|s| match s {
      GptImage2TextToImageSize::SquareHd => "square_hd",
      GptImage2TextToImageSize::Square => "square",
      GptImage2TextToImageSize::Portrait4x3 => "portrait_4_3",
      GptImage2TextToImageSize::Portrait16x9 => "portrait_16_9",
      GptImage2TextToImageSize::Landscape4x3 => "landscape_4_3",
      GptImage2TextToImageSize::Landscape16x9 => "landscape_16_9",
    }.to_string());

    let quality = self.quality.map(|q| match q {
      GptImage2TextToImageQuality::Low => "low",
      GptImage2TextToImageQuality::Medium => "medium",
      GptImage2TextToImageQuality::High => "high",
    }.to_string());

    let output_format = Some(match self.output_format {
      Some(GptImage2TextToImageOutputFormat::Jpeg) => "jpeg",
      Some(GptImage2TextToImageOutputFormat::Png) => "png",
      Some(GptImage2TextToImageOutputFormat::Webp) => "webp",
      None => "png",
    }.to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      num_images: Some(num_images),
      image_size,
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

    let request = GptImage2TextToImageRequest {
      prompt: "an anime girl riding on the back of a t-rex".to_string(),
      num_images: GptImage2TextToImageNumImages::One,
      image_size: None,
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

    let request = GptImage2TextToImageRequest {
      prompt: "a corgi wearing sunglasses at the beach".to_string(),
      num_images: GptImage2TextToImageNumImages::Two,
      image_size: Some(GptImage2TextToImageSize::Landscape16x9),
      quality: Some(GptImage2TextToImageQuality::High),
      output_format: Some(GptImage2TextToImageOutputFormat::Png),
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

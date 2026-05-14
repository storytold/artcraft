use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::image::edit::gpt_image_2_edit_image::raw_request::{
  GptImage2EditImageInput, GptImage2EditImageOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct GptImage2EditImageRequest {
  /// Text prompt describing the edit to make.
  pub prompt: String,

  /// One or more source image URLs to edit.
  pub image_urls: Vec<String>,

  /// Number of images to generate.
  pub num_images: GptImage2EditImageNumImages,

  /// Optional mask URL indicating what part of the image to edit.
  pub mask_url: Option<String>,

  /// Output image size.
  pub image_size: Option<GptImage2EditImageSize>,

  /// Quality level.
  pub quality: Option<GptImage2EditImageQuality>,

  /// Output format.
  pub output_format: Option<GptImage2EditImageOutputFormat>,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage2EditImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage2EditImageSize {
  SquareHd,
  Square,
  Portrait4x3,
  Portrait16x9,
  Landscape4x3,
  Landscape16x9,
  Auto,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage2EditImageQuality {
  Low,
  Medium,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage2EditImageOutputFormat {
  Jpeg,
  Png,
  Webp,
}

impl FalEndpoint for GptImage2EditImageRequest {
  const ENDPOINT: &str = "openai/gpt-image-2/edit";

  type RawRequest = GptImage2EditImageInput;
  type RawResponse = GptImage2EditImageOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let num_images = match self.num_images {
      GptImage2EditImageNumImages::One => 1,
      GptImage2EditImageNumImages::Two => 2,
      GptImage2EditImageNumImages::Three => 3,
      GptImage2EditImageNumImages::Four => 4,
    };

    let image_size = self.image_size.map(|s| match s {
      GptImage2EditImageSize::SquareHd => "square_hd",
      GptImage2EditImageSize::Square => "square",
      GptImage2EditImageSize::Portrait4x3 => "portrait_4_3",
      GptImage2EditImageSize::Portrait16x9 => "portrait_16_9",
      GptImage2EditImageSize::Landscape4x3 => "landscape_4_3",
      GptImage2EditImageSize::Landscape16x9 => "landscape_16_9",
      GptImage2EditImageSize::Auto => "auto",
    }.to_string());

    let quality = self.quality.map(|q| match q {
      GptImage2EditImageQuality::Low => "low",
      GptImage2EditImageQuality::Medium => "medium",
      GptImage2EditImageQuality::High => "high",
    }.to_string());

    let output_format = Some(match self.output_format {
      Some(GptImage2EditImageOutputFormat::Jpeg) => "jpeg",
      Some(GptImage2EditImageOutputFormat::Png) => "png",
      Some(GptImage2EditImageOutputFormat::Webp) => "webp",
      None => "png",
    }.to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      image_urls: self.image_urls.clone(),
      num_images: Some(num_images),
      mask_url: self.mask_url.clone(),
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
  use test_data::web::image_urls::{ERNEST_SCARED_STUPID_IMAGE_URL, GHOST_IMAGE_URL, TREX_SKELETON_IMAGE_URL};

  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_edit_image_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = GptImage2EditImageRequest {
      image_urls: vec![
        GHOST_IMAGE_URL.to_string(),
        TREX_SKELETON_IMAGE_URL.to_string(),
        ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      ],
      prompt: "add the ghost and scared man to the image of the t-rex skeleton, make it look spooky but friendly".to_string(),
      num_images: GptImage2EditImageNumImages::Two,
      mask_url: None,
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
  async fn test_edit_image_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = GptImage2EditImageRequest {
      image_urls: vec![GHOST_IMAGE_URL.to_string()],
      prompt: "make the ghost wear a top hat".to_string(),
      num_images: GptImage2EditImageNumImages::One,
      mask_url: None,
      image_size: Some(GptImage2EditImageSize::Square),
      quality: Some(GptImage2EditImageQuality::High),
      output_format: Some(GptImage2EditImageOutputFormat::Png),
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

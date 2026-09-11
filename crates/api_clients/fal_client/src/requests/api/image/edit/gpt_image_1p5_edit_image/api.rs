use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::image::edit::gpt_image_1p5_edit_image::raw_request::{
  GptImage1p5EditImageInput, GptImage1p5EditImageOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct GptImage1p5EditImageRequest {
  /// Text prompt describing the edit to make.
  pub prompt: String,

  /// One or more source image URLs to edit.
  pub image_urls: Vec<String>,

  /// Number of images to generate.
  pub num_images: GptImage1p5EditImageNumImages,

  /// Optional mask URL indicating what part of the image to edit.
  pub mask_image_url: Option<String>,

  /// Output image size.
  pub image_size: Option<GptImage1p5EditImageSize>,

  /// Background mode.
  pub background: Option<GptImage1p5EditImageBackground>,

  /// Quality level.
  pub quality: Option<GptImage1p5EditImageQuality>,

  /// Input fidelity level.
  pub input_fidelity: Option<GptImage1p5EditImageInputFidelity>,

  /// Output format.
  pub output_format: Option<GptImage1p5EditImageOutputFormat>,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1p5EditImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1p5EditImageSize {
  /// 1024x1024
  Square,
  /// 1536x1024
  Wide,
  /// 1024x1536
  Tall,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1p5EditImageBackground {
  Auto,
  Transparent,
  Opaque,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1p5EditImageQuality {
  Low,
  Medium,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1p5EditImageInputFidelity {
  Low,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1p5EditImageOutputFormat {
  Jpeg,
  Png,
  Webp,
}

impl FalEndpoint for GptImage1p5EditImageRequest {
  const ENDPOINT: &str = "fal-ai/gpt-image-1.5/edit";

  type RawRequest = GptImage1p5EditImageInput;
  type RawResponse = GptImage1p5EditImageOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let num_images = match self.num_images {
      GptImage1p5EditImageNumImages::One => 1,
      GptImage1p5EditImageNumImages::Two => 2,
      GptImage1p5EditImageNumImages::Three => 3,
      GptImage1p5EditImageNumImages::Four => 4,
    };

    let image_size = self.image_size.map(|s| match s {
      GptImage1p5EditImageSize::Square => "1024x1024",
      GptImage1p5EditImageSize::Wide => "1536x1024",
      GptImage1p5EditImageSize::Tall => "1024x1536",
    }.to_string());

    let background = self.background.map(|b| match b {
      GptImage1p5EditImageBackground::Auto => "auto",
      GptImage1p5EditImageBackground::Transparent => "transparent",
      GptImage1p5EditImageBackground::Opaque => "opaque",
    }.to_string());

    let quality = self.quality.map(|q| match q {
      GptImage1p5EditImageQuality::Low => "low",
      GptImage1p5EditImageQuality::Medium => "medium",
      GptImage1p5EditImageQuality::High => "high",
    }.to_string());

    let input_fidelity = self.input_fidelity.map(|f| match f {
      GptImage1p5EditImageInputFidelity::Low => "low",
      GptImage1p5EditImageInputFidelity::High => "high",
    }.to_string());

    let output_format = Some(match self.output_format {
      Some(GptImage1p5EditImageOutputFormat::Jpeg) => "jpeg",
      Some(GptImage1p5EditImageOutputFormat::Png) => "png",
      Some(GptImage1p5EditImageOutputFormat::Webp) => "webp",
      None => "png",
    }.to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      image_urls: self.image_urls.clone(),
      num_images: Some(num_images),
      mask_image_url: self.mask_image_url.clone(),
      image_size,
      background,
      quality,
      input_fidelity,
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

    let request = GptImage1p5EditImageRequest {
      image_urls: vec![
        GHOST_IMAGE_URL.to_string(),
        TREX_SKELETON_IMAGE_URL.to_string(),
        ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      ],
      prompt: "add the ghost and scared man to the image of the t-rex skeleton, make it look spooky but friendly".to_string(),
      num_images: GptImage1p5EditImageNumImages::Two,
      mask_image_url: None,
      image_size: None,
      background: None,
      quality: None,
      input_fidelity: None,
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

    let request = GptImage1p5EditImageRequest {
      image_urls: vec![GHOST_IMAGE_URL.to_string()],
      prompt: "make the ghost wear a top hat".to_string(),
      num_images: GptImage1p5EditImageNumImages::One,
      mask_image_url: None,
      image_size: Some(GptImage1p5EditImageSize::Square),
      background: None,
      quality: Some(GptImage1p5EditImageQuality::High),
      input_fidelity: None,
      output_format: Some(GptImage1p5EditImageOutputFormat::Png),
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

use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::image::edit::gpt_image_1_edit_image::raw_request::{
  GptImage1EditImageInput, GptImage1EditImageOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct GptImage1EditImageRequest {
  /// Text prompt describing the edit to make.
  pub prompt: String,

  /// One or more source image URLs to edit.
  pub image_urls: Vec<String>,

  /// Number of images to generate.
  pub num_images: GptImage1EditImageNumImages,

  /// Optional mask URL indicating what part of the image to edit.
  pub mask_image_url: Option<String>,

  /// Output image size.
  pub image_size: Option<GptImage1EditImageSize>,

  /// Quality level.
  pub quality: Option<GptImage1EditImageQuality>,

  /// Input fidelity level.
  pub input_fidelity: Option<GptImage1EditImageInputFidelity>,

  /// Background mode.
  pub background: Option<GptImage1EditImageBackground>,

  /// Output format.
  pub output_format: Option<GptImage1EditImageOutputFormat>,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1EditImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1EditImageSize {
  Auto,
  /// 1024x1024
  Square,
  /// 1536x1024
  Horizontal,
  /// 1024x1536
  Vertical,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1EditImageQuality {
  Low,
  Medium,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1EditImageInputFidelity {
  Low,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1EditImageBackground {
  Auto,
  Transparent,
  Opaque,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage1EditImageOutputFormat {
  Jpeg,
  Png,
  Webp,
}

impl FalEndpoint for GptImage1EditImageRequest {
  const ENDPOINT: &str = "fal-ai/gpt-image-1/edit-image";

  type RawRequest = GptImage1EditImageInput;
  type RawResponse = GptImage1EditImageOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let num_images = match self.num_images {
      GptImage1EditImageNumImages::One => 1,
      GptImage1EditImageNumImages::Two => 2,
      GptImage1EditImageNumImages::Three => 3,
      GptImage1EditImageNumImages::Four => 4,
    };

    let image_size = self.image_size.map(|s| match s {
      GptImage1EditImageSize::Auto => "auto",
      GptImage1EditImageSize::Square => "1024x1024",
      GptImage1EditImageSize::Horizontal => "1536x1024",
      GptImage1EditImageSize::Vertical => "1024x1536",
    }.to_string());

    let quality = self.quality.map(|q| match q {
      GptImage1EditImageQuality::Low => "low",
      GptImage1EditImageQuality::Medium => "medium",
      GptImage1EditImageQuality::High => "high",
    }.to_string());

    let input_fidelity = self.input_fidelity.map(|f| match f {
      GptImage1EditImageInputFidelity::Low => "low",
      GptImage1EditImageInputFidelity::High => "high",
    }.to_string());

    let background = self.background.map(|b| match b {
      GptImage1EditImageBackground::Auto => "auto",
      GptImage1EditImageBackground::Transparent => "transparent",
      GptImage1EditImageBackground::Opaque => "opaque",
    }.to_string());

    let output_format = Some(match self.output_format {
      Some(GptImage1EditImageOutputFormat::Jpeg) => "jpeg",
      Some(GptImage1EditImageOutputFormat::Png) => "png",
      Some(GptImage1EditImageOutputFormat::Webp) => "webp",
      None => "png",
    }.to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      image_urls: self.image_urls.clone(),
      num_images: Some(num_images),
      mask_image_url: self.mask_image_url.clone(),
      image_size,
      quality,
      input_fidelity,
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
  use test_data::web::image_urls::{ERNEST_SCARED_STUPID_IMAGE_URL, GHOST_IMAGE_URL, TREX_SKELETON_IMAGE_URL};

  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_edit_image_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = GptImage1EditImageRequest {
      prompt: "add the ghost and scared man to the image of the t-rex skeleton, make it look spooky but friendly".to_string(),
      image_urls: vec![
        GHOST_IMAGE_URL.to_string(),
        TREX_SKELETON_IMAGE_URL.to_string(),
        ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      ],
      num_images: GptImage1EditImageNumImages::One,
      mask_image_url: None,
      image_size: Some(GptImage1EditImageSize::Horizontal),
      quality: Some(GptImage1EditImageQuality::Medium),
      input_fidelity: None,
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
  async fn test_edit_image_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = GptImage1EditImageRequest {
      image_urls: vec![GHOST_IMAGE_URL.to_string()],
      prompt: "make the ghost wear a top hat".to_string(),
      num_images: GptImage1EditImageNumImages::One,
      mask_image_url: None,
      image_size: None,
      quality: Some(GptImage1EditImageQuality::High),
      input_fidelity: None,
      background: None,
      output_format: Some(GptImage1EditImageOutputFormat::Png),
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

use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::image::text::flux_1_schnell_text_to_image::raw_request::{
  Flux1SchnellTextToImageInput, Flux1SchnellTextToImageOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Flux1SchnellTextToImageRequest {
  /// Text prompt describing the image to generate.
  pub prompt: String,

  /// Aspect ratio / image size.
  pub aspect_ratio: Flux1SchnellTextToImageAspectRatio,

  /// Number of images to generate.
  pub num_images: Flux1SchnellTextToImageNumImages,
}

#[derive(Copy, Clone, Debug)]
pub enum Flux1SchnellTextToImageAspectRatio {
  Square,
  SquareHd,
  LandscapeFourByThree,
  LandscapeSixteenByNine,
  PortraitThreeByFour,
  PortraitNineBySixteen,
}

#[derive(Copy, Clone, Debug)]
pub enum Flux1SchnellTextToImageNumImages {
  One,
  Two,
  Three,
  Four,
}

impl FalEndpoint for Flux1SchnellTextToImageRequest {
  const ENDPOINT: &str = "fal-ai/flux/schnell";

  type RawRequest = Flux1SchnellTextToImageInput;
  type RawResponse = Flux1SchnellTextToImageOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let num_images = match self.num_images {
      Flux1SchnellTextToImageNumImages::One => 1,
      Flux1SchnellTextToImageNumImages::Two => 2,
      Flux1SchnellTextToImageNumImages::Three => 3,
      Flux1SchnellTextToImageNumImages::Four => 4,
    };

    let image_size = match self.aspect_ratio {
      Flux1SchnellTextToImageAspectRatio::Square => "square",
      Flux1SchnellTextToImageAspectRatio::SquareHd => "square_hd",
      Flux1SchnellTextToImageAspectRatio::LandscapeFourByThree => "landscape_4_3",
      Flux1SchnellTextToImageAspectRatio::LandscapeSixteenByNine => "landscape_16_9",
      Flux1SchnellTextToImageAspectRatio::PortraitThreeByFour => "portrait_4_3",
      Flux1SchnellTextToImageAspectRatio::PortraitNineBySixteen => "portrait_16_9",
    };

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      num_images: Some(num_images),
      image_size: Some(image_size.to_string()),
      enable_safety_checker: Some(false),
      ..Default::default()
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
  async fn test_text_to_image() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Flux1SchnellTextToImageRequest {
      prompt: "a giant robot fighting a dragon in a futuristic city".to_string(),
      num_images: Flux1SchnellTextToImageNumImages::One,
      aspect_ratio: Flux1SchnellTextToImageAspectRatio::LandscapeSixteenByNine,
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Request ID: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // NB: Pricing tests are in cost.rs
}

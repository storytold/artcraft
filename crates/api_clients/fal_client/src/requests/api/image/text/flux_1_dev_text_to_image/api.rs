use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::image::text::flux_1_dev_text_to_image::raw_request::{
  Flux1DevTextToImageInput, Flux1DevTextToImageOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Flux1DevTextToImageRequest {
  /// Text prompt describing the image to generate.
  pub prompt: String,

  /// Aspect ratio / image size.
  pub aspect_ratio: Flux1DevTextToImageAspectRatio,

  /// Number of images to generate.
  pub num_images: Flux1DevTextToImageNumImages,
}

#[derive(Copy, Clone, Debug)]
pub enum Flux1DevTextToImageAspectRatio {
  Square,
  SquareHd,
  LandscapeFourByThree,
  LandscapeSixteenByNine,
  PortraitThreeByFour,
  PortraitNineBySixteen,
}

#[derive(Copy, Clone, Debug)]
pub enum Flux1DevTextToImageNumImages {
  One,
  Two,
  Three,
  Four,
}

impl FalEndpoint for Flux1DevTextToImageRequest {
  const ENDPOINT: &str = "fal-ai/flux/dev";

  type RawRequest = Flux1DevTextToImageInput;
  type RawResponse = Flux1DevTextToImageOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let num_images = match self.num_images {
      Flux1DevTextToImageNumImages::One => 1,
      Flux1DevTextToImageNumImages::Two => 2,
      Flux1DevTextToImageNumImages::Three => 3,
      Flux1DevTextToImageNumImages::Four => 4,
    };

    let image_size = match self.aspect_ratio {
      Flux1DevTextToImageAspectRatio::Square => "square",
      Flux1DevTextToImageAspectRatio::SquareHd => "square_hd",
      Flux1DevTextToImageAspectRatio::LandscapeFourByThree => "landscape_4_3",
      Flux1DevTextToImageAspectRatio::LandscapeSixteenByNine => "landscape_16_9",
      Flux1DevTextToImageAspectRatio::PortraitThreeByFour => "portrait_4_3",
      Flux1DevTextToImageAspectRatio::PortraitNineBySixteen => "portrait_16_9",
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

    let request = Flux1DevTextToImageRequest {
      prompt: "a giant robot fighting a dragon in a futuristic city".to_string(),
      num_images: Flux1DevTextToImageNumImages::One,
      aspect_ratio: Flux1DevTextToImageAspectRatio::LandscapeFourByThree,
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Request ID: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // NB: Pricing tests are in cost.rs
}

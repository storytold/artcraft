use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::image::edit::flux_1_schnell_edit_image::raw_request::{
  Flux1SchnellEditImageInput, Flux1SchnellEditImageOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Flux1SchnellEditImageRequest {
  /// URL of the source image to edit.
  pub image_url: String,

  /// Number of images to generate.
  pub num_images: Flux1SchnellEditImageNumImages,

  /// Output image size.
  pub image_size: Option<Flux1SchnellEditImageSize>,
}

#[derive(Copy, Clone, Debug)]
pub enum Flux1SchnellEditImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum Flux1SchnellEditImageSize {
  Square,
  SquareHd,
  LandscapeFourByThree,
  LandscapeSixteenByNine,
  PortraitThreeByFour,
  PortraitNineBySixteen,
}

impl FalEndpoint for Flux1SchnellEditImageRequest {
  const ENDPOINT: &str = "fal-ai/flux/schnell/redux";

  type RawRequest = Flux1SchnellEditImageInput;
  type RawResponse = Flux1SchnellEditImageOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let num_images = match self.num_images {
      Flux1SchnellEditImageNumImages::One => 1,
      Flux1SchnellEditImageNumImages::Two => 2,
      Flux1SchnellEditImageNumImages::Three => 3,
      Flux1SchnellEditImageNumImages::Four => 4,
    };

    let image_size = self.image_size.map(|s| match s {
      Flux1SchnellEditImageSize::Square => "square",
      Flux1SchnellEditImageSize::SquareHd => "square_hd",
      Flux1SchnellEditImageSize::LandscapeFourByThree => "landscape_4_3",
      Flux1SchnellEditImageSize::LandscapeSixteenByNine => "landscape_16_9",
      Flux1SchnellEditImageSize::PortraitThreeByFour => "portrait_4_3",
      Flux1SchnellEditImageSize::PortraitNineBySixteen => "portrait_16_9",
    }.to_string());

    Ok(Self::RawRequest {
      image_url: self.image_url.clone(),
      num_images: Some(num_images),
      image_size,
      enable_safety_checker: Some(false),
      output_format: Some("png".to_string()),
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
  use test_data::web::image_urls::GHOST_IMAGE_URL;

  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_single_image_no_size() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Flux1SchnellEditImageRequest {
      image_url: GHOST_IMAGE_URL.to_string(),
      num_images: Flux1SchnellEditImageNumImages::One,
      image_size: None,
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Request ID: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_with_landscape_size() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Flux1SchnellEditImageRequest {
      image_url: GHOST_IMAGE_URL.to_string(),
      num_images: Flux1SchnellEditImageNumImages::Two,
      image_size: Some(Flux1SchnellEditImageSize::LandscapeSixteenByNine),
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Request ID: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // NB: Pricing tests are in cost.rs
}

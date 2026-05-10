use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::image::edit::nano_banana_2_edit_image::raw_request::{
  NanoBanana2EditImageInput, NanoBanana2EditImageOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct NanoBanana2EditImageRequest {
  /// Text prompt describing the desired edit.
  pub prompt: String,

  /// URL(s) of the source image(s) to edit.
  pub image_urls: Vec<String>,

  /// Number of images to generate.
  pub num_images: NanoBanana2EditImageNumImages,

  /// Output resolution.
  pub resolution: Option<NanoBanana2EditImageResolution>,

  /// Aspect ratio.
  pub aspect_ratio: Option<NanoBanana2EditImageAspectRatio>,
}

#[derive(Copy, Clone, Debug)]
pub enum NanoBanana2EditImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum NanoBanana2EditImageResolution {
  HalfK,
  OneK,
  TwoK,
  FourK,
}

/// auto, 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16
#[derive(Copy, Clone, Debug)]
pub enum NanoBanana2EditImageAspectRatio {
  Auto,
  OneByOne,
  FiveByFour,
  FourByThree,
  ThreeByTwo,
  SixteenByNine,
  TwentyOneByNine,
  FourByFive,
  ThreeByFour,
  TwoByThree,
  NineBySixteen,
}

impl FalEndpoint for NanoBanana2EditImageRequest {
  const ENDPOINT: &str = "fal-ai/nano-banana-2/edit";

  type RawRequest = NanoBanana2EditImageInput;
  type RawResponse = NanoBanana2EditImageOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let num_images = match self.num_images {
      NanoBanana2EditImageNumImages::One => 1,
      NanoBanana2EditImageNumImages::Two => 2,
      NanoBanana2EditImageNumImages::Three => 3,
      NanoBanana2EditImageNumImages::Four => 4,
    };

    let resolution = self.resolution.map(|r| match r {
      NanoBanana2EditImageResolution::HalfK => "0.5K",
      NanoBanana2EditImageResolution::OneK => "1K",
      NanoBanana2EditImageResolution::TwoK => "2K",
      NanoBanana2EditImageResolution::FourK => "4K",
    }.to_string());

    let aspect_ratio = self.aspect_ratio.map(|ar| match ar {
      NanoBanana2EditImageAspectRatio::Auto => "auto",
      NanoBanana2EditImageAspectRatio::OneByOne => "1:1",
      NanoBanana2EditImageAspectRatio::FiveByFour => "5:4",
      NanoBanana2EditImageAspectRatio::FourByThree => "4:3",
      NanoBanana2EditImageAspectRatio::ThreeByTwo => "3:2",
      NanoBanana2EditImageAspectRatio::SixteenByNine => "16:9",
      NanoBanana2EditImageAspectRatio::TwentyOneByNine => "21:9",
      NanoBanana2EditImageAspectRatio::FourByFive => "4:5",
      NanoBanana2EditImageAspectRatio::ThreeByFour => "3:4",
      NanoBanana2EditImageAspectRatio::TwoByThree => "2:3",
      NanoBanana2EditImageAspectRatio::NineBySixteen => "9:16",
    }.to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      image_urls: self.image_urls.clone(),
      num_images: Some(num_images),
      aspect_ratio,
      resolution,
      output_format: Some("png".to_string()),
      safety_tolerance: Some("6".to_string()),
      limit_generations: None,
      enable_web_search: None,
      seed: None,
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
  use test_data::web::image_urls::{
    ERNEST_SCARED_STUPID_IMAGE_URL, GHOST_IMAGE_URL, TREX_SKELETON_IMAGE_URL,
    WHITE_HOUSE_SUNSET_IMAGE_URL,
  };

  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_edit_image() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = NanoBanana2EditImageRequest {
      prompt: "make this image look like a watercolor painting".to_string(),
      image_urls: vec![GHOST_IMAGE_URL.to_string()],
      num_images: NanoBanana2EditImageNumImages::One,
      resolution: Some(NanoBanana2EditImageResolution::OneK),
      aspect_ratio: None,
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Request ID: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_edit_multi_image_spooky() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = NanoBanana2EditImageRequest {
      prompt: "add the ghost and scared man to the image of the t-rex skeleton, make it look spooky but friendly".to_string(),
      image_urls: vec![
        GHOST_IMAGE_URL.to_string(),
        TREX_SKELETON_IMAGE_URL.to_string(),
        ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      ],
      num_images: NanoBanana2EditImageNumImages::Two,
      resolution: Some(NanoBanana2EditImageResolution::TwoK),
      aspect_ratio: Some(NanoBanana2EditImageAspectRatio::SixteenByNine),
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Request ID: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_edit_multi_image_white_house() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = NanoBanana2EditImageRequest {
      prompt: "Put the scared man and the t-rex in front of the white house scene. Make the man afraid of the t-rex.".to_string(),
      image_urls: vec![
        WHITE_HOUSE_SUNSET_IMAGE_URL.to_string(),
        TREX_SKELETON_IMAGE_URL.to_string(),
        ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      ],
      num_images: NanoBanana2EditImageNumImages::Two,
      resolution: Some(NanoBanana2EditImageResolution::TwoK),
      aspect_ratio: Some(NanoBanana2EditImageAspectRatio::SixteenByNine),
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Request ID: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // NB: Pricing tests are in cost.rs
}

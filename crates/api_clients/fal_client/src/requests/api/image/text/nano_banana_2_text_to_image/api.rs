use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::image::text::nano_banana_2_text_to_image::raw_request::{
  NanoBanana2TextToImageInput, NanoBanana2TextToImageOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct NanoBanana2TextToImageRequest {
  /// Text prompt describing the image to generate.
  pub prompt: String,

  /// Number of images to generate.
  pub num_images: NanoBanana2TextToImageNumImages,

  /// Output resolution.
  pub resolution: Option<NanoBanana2TextToImageResolution>,

  /// Aspect ratio.
  pub aspect_ratio: Option<NanoBanana2TextToImageAspectRatio>,
}

#[derive(Copy, Clone, Debug)]
pub enum NanoBanana2TextToImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum NanoBanana2TextToImageResolution {
  HalfK, // "0.5K"
  OneK,  // "1K" (default)
  TwoK,  // "2K"
  FourK, // "4K"
}

/// auto, 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16
#[derive(Copy, Clone, Debug)]
pub enum NanoBanana2TextToImageAspectRatio {
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

impl FalEndpoint for NanoBanana2TextToImageRequest {
  const ENDPOINT: &str = "fal-ai/nano-banana-2";

  type RawRequest = NanoBanana2TextToImageInput;
  type RawResponse = NanoBanana2TextToImageOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let num_images = match self.num_images {
      NanoBanana2TextToImageNumImages::One => 1,
      NanoBanana2TextToImageNumImages::Two => 2,
      NanoBanana2TextToImageNumImages::Three => 3,
      NanoBanana2TextToImageNumImages::Four => 4,
    };

    let resolution = self.resolution.map(|r| match r {
      NanoBanana2TextToImageResolution::HalfK => "0.5K",
      NanoBanana2TextToImageResolution::OneK => "1K",
      NanoBanana2TextToImageResolution::TwoK => "2K",
      NanoBanana2TextToImageResolution::FourK => "4K",
    }.to_string());

    let aspect_ratio = self.aspect_ratio.map(|ar| match ar {
      NanoBanana2TextToImageAspectRatio::Auto => "auto",
      NanoBanana2TextToImageAspectRatio::OneByOne => "1:1",
      NanoBanana2TextToImageAspectRatio::FiveByFour => "5:4",
      NanoBanana2TextToImageAspectRatio::FourByThree => "4:3",
      NanoBanana2TextToImageAspectRatio::ThreeByTwo => "3:2",
      NanoBanana2TextToImageAspectRatio::SixteenByNine => "16:9",
      NanoBanana2TextToImageAspectRatio::TwentyOneByNine => "21:9",
      NanoBanana2TextToImageAspectRatio::FourByFive => "4:5",
      NanoBanana2TextToImageAspectRatio::ThreeByFour => "3:4",
      NanoBanana2TextToImageAspectRatio::TwoByThree => "2:3",
      NanoBanana2TextToImageAspectRatio::NineBySixteen => "9:16",
    }.to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
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

  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_text_to_image() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = NanoBanana2TextToImageRequest {
      prompt: "a corgi wearing sunglasses at the beach".to_string(),
      num_images: NanoBanana2TextToImageNumImages::One,
      resolution: Some(NanoBanana2TextToImageResolution::OneK),
      aspect_ratio: Some(NanoBanana2TextToImageAspectRatio::SixteenByNine),
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Request ID: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // NB: Pricing tests are in cost.rs
}

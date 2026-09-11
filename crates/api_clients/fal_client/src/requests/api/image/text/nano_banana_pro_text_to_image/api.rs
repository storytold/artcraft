use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::image::text::nano_banana_pro_text_to_image::raw_request::{
  NanoBananaProTextToImageInput, NanoBananaProTextToImageOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct NanoBananaProTextToImageRequest {
  /// Text prompt describing the image to generate.
  pub prompt: String,

  /// Number of images to generate.
  pub num_images: NanoBananaProTextToImageNumImages,

  /// Output resolution.
  pub resolution: Option<NanoBananaProTextToImageResolution>,

  /// Aspect ratio.
  pub aspect_ratio: Option<NanoBananaProTextToImageAspectRatio>,
}

#[derive(Copy, Clone, Debug)]
pub enum NanoBananaProTextToImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum NanoBananaProTextToImageResolution {
  OneK,
  TwoK,
  FourK,
}

/// 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16
#[derive(Copy, Clone, Debug)]
pub enum NanoBananaProTextToImageAspectRatio {
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

impl FalEndpoint for NanoBananaProTextToImageRequest {
  const ENDPOINT: &str = "fal-ai/nano-banana-pro";

  type RawRequest = NanoBananaProTextToImageInput;
  type RawResponse = NanoBananaProTextToImageOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let num_images = match self.num_images {
      NanoBananaProTextToImageNumImages::One => 1,
      NanoBananaProTextToImageNumImages::Two => 2,
      NanoBananaProTextToImageNumImages::Three => 3,
      NanoBananaProTextToImageNumImages::Four => 4,
    };

    let resolution = self.resolution.map(|r| match r {
      NanoBananaProTextToImageResolution::OneK => "1K",
      NanoBananaProTextToImageResolution::TwoK => "2K",
      NanoBananaProTextToImageResolution::FourK => "4K",
    }.to_string());

    let aspect_ratio = self.aspect_ratio.map(|ar| match ar {
      NanoBananaProTextToImageAspectRatio::OneByOne => "1:1",
      NanoBananaProTextToImageAspectRatio::FiveByFour => "5:4",
      NanoBananaProTextToImageAspectRatio::FourByThree => "4:3",
      NanoBananaProTextToImageAspectRatio::ThreeByTwo => "3:2",
      NanoBananaProTextToImageAspectRatio::SixteenByNine => "16:9",
      NanoBananaProTextToImageAspectRatio::TwentyOneByNine => "21:9",
      NanoBananaProTextToImageAspectRatio::FourByFive => "4:5",
      NanoBananaProTextToImageAspectRatio::ThreeByFour => "3:4",
      NanoBananaProTextToImageAspectRatio::TwoByThree => "2:3",
      NanoBananaProTextToImageAspectRatio::NineBySixteen => "9:16",
    }.to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      num_images: Some(num_images),
      aspect_ratio,
      resolution,
      output_format: Some("png".to_string()),
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

    let request = NanoBananaProTextToImageRequest {
      prompt: "an anime girl riding on the back of a t-rex".to_string(),
      num_images: NanoBananaProTextToImageNumImages::One,
      resolution: Some(NanoBananaProTextToImageResolution::TwoK),
      aspect_ratio: Some(NanoBananaProTextToImageAspectRatio::SixteenByNine),
    };

    let result = request.send_webhook_request(&api_key, "https://example.com/test").await?;
    println!("Request ID: {:?}", result.request_id);
    assert!(result.request_id.is_some());
    Ok(())
  }

  // NB: Pricing tests are in cost.rs
}

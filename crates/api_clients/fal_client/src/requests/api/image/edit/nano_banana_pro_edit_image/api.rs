use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::image::edit::nano_banana_pro_edit_image::raw_request::{
  NanoBananaProEditImageInput, NanoBananaProEditImageOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct NanoBananaProEditImageRequest {
  /// Text prompt describing the desired edit.
  pub prompt: String,

  /// URL(s) of the source image(s) to edit.
  pub image_urls: Vec<String>,

  /// Number of images to generate.
  pub num_images: NanoBananaProEditImageNumImages,

  /// Output resolution.
  pub resolution: Option<NanoBananaProEditImageResolution>,

  /// Aspect ratio.
  pub aspect_ratio: Option<NanoBananaProEditImageAspectRatio>,
}

#[derive(Copy, Clone, Debug)]
pub enum NanoBananaProEditImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum NanoBananaProEditImageResolution {
  OneK,
  TwoK,
  FourK,
}

/// auto, 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16
#[derive(Copy, Clone, Debug)]
pub enum NanoBananaProEditImageAspectRatio {
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

impl FalEndpoint for NanoBananaProEditImageRequest {
  const ENDPOINT: &str = "fal-ai/nano-banana-pro/edit";

  type RawRequest = NanoBananaProEditImageInput;
  type RawResponse = NanoBananaProEditImageOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let num_images = match self.num_images {
      NanoBananaProEditImageNumImages::One => 1,
      NanoBananaProEditImageNumImages::Two => 2,
      NanoBananaProEditImageNumImages::Three => 3,
      NanoBananaProEditImageNumImages::Four => 4,
    };

    let resolution = self.resolution.map(|r| match r {
      NanoBananaProEditImageResolution::OneK => "1K",
      NanoBananaProEditImageResolution::TwoK => "2K",
      NanoBananaProEditImageResolution::FourK => "4K",
    }.to_string());

    let aspect_ratio = self.aspect_ratio.map(|ar| match ar {
      NanoBananaProEditImageAspectRatio::Auto => "auto",
      NanoBananaProEditImageAspectRatio::OneByOne => "1:1",
      NanoBananaProEditImageAspectRatio::FiveByFour => "5:4",
      NanoBananaProEditImageAspectRatio::FourByThree => "4:3",
      NanoBananaProEditImageAspectRatio::ThreeByTwo => "3:2",
      NanoBananaProEditImageAspectRatio::SixteenByNine => "16:9",
      NanoBananaProEditImageAspectRatio::TwentyOneByNine => "21:9",
      NanoBananaProEditImageAspectRatio::FourByFive => "4:5",
      NanoBananaProEditImageAspectRatio::ThreeByFour => "3:4",
      NanoBananaProEditImageAspectRatio::TwoByThree => "2:3",
      NanoBananaProEditImageAspectRatio::NineBySixteen => "9:16",
    }.to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      image_urls: self.image_urls.clone(),
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
  use test_data::web::image_urls::{
    ERNEST_SCARED_STUPID_IMAGE_URL, GHOST_IMAGE_URL, TREX_SKELETON_IMAGE_URL,
  };

  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_edit_multi_image_spooky() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = NanoBananaProEditImageRequest {
      prompt: "add the ghost and scared man to the image of the t-rex skeleton, make it look spooky but friendly".to_string(),
      image_urls: vec![
        GHOST_IMAGE_URL.to_string(),
        TREX_SKELETON_IMAGE_URL.to_string(),
        ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      ],
      num_images: NanoBananaProEditImageNumImages::Two,
      resolution: Some(NanoBananaProEditImageResolution::TwoK),
      aspect_ratio: Some(NanoBananaProEditImageAspectRatio::SixteenByNine),
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Request ID: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // NB: Pricing tests are in cost.rs
}

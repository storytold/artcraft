use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_text_to_image_params::GptImage2p5TextToImageParams;
use crate::requests::api::image::common::gpt_image_2p5::raw::gpt_image_2p5_image_output::GptImage2p5ImageOutput;
use crate::requests::api::image::common::gpt_image_2p5::raw::gpt_image_2p5_text_to_image_input::GptImage2p5TextToImageInput;
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// GPT Image 2.5 Sunburst text-to-image.
///
/// Flare and Sunburst take the same parameters (see `GptImage2p5TextToImageParams`);
/// this type only selects the endpoint.
#[derive(Clone, Debug)]
pub struct GptImage2p5SunburstTextToImageRequest {
  pub params: GptImage2p5TextToImageParams,
}

impl FalEndpoint for GptImage2p5SunburstTextToImageRequest {
  const ENDPOINT: &str = "openai/gpt-image-2.5/sunburst/text-to-image";

  type RawRequest = GptImage2p5TextToImageInput;
  type RawResponse = GptImage2p5ImageOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(self.params.to_raw_input())
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::api::image::common::gpt_image_2_resolution::GptImage2Resolution;
  use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_image_size::GptImage2p5ImageSize;
  use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_num_images::GptImage2p5NumImages;
  use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_output_format::GptImage2p5OutputFormat;
  use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_quality::GptImage2p5Quality;
  use crate::requests::api::image::common::gpt_image_2p5::raw::gpt_image_2p5_image_size_param::GptImage2p5ImageSizeParam;
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[test]
  fn endpoint() {
    assert_eq!(GptImage2p5SunburstTextToImageRequest::ENDPOINT, "openai/gpt-image-2.5/sunburst/text-to-image");
    assert_eq!(GptImage2p5SunburstTextToImageRequest::get_endpoint(), "openai/gpt-image-2.5/sunburst/text-to-image");
  }

  #[test]
  fn to_raw_request_delegates_to_params() {
    let request = GptImage2p5SunburstTextToImageRequest {
      params: GptImage2p5TextToImageParams {
        prompt: "test".to_string(),
        num_images: GptImage2p5NumImages::Two,
        image_size: Some(GptImage2p5ImageSize::Landscape16x9),
        resolution: Some(GptImage2Resolution::TwoK),
        quality: Some(GptImage2p5Quality::Medium),
        background: None,
        output_format: Some(GptImage2p5OutputFormat::Jpeg),
        output_compression: Some(75),
      },
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "test");
    assert_eq!(raw.num_images, Some(2));
    assert_eq!(raw.quality.as_deref(), Some("medium"));
    assert_eq!(raw.output_format.as_deref(), Some("jpeg"));
    assert_eq!(raw.output_compression, Some(75));
    match raw.image_size.unwrap() {
      GptImage2p5ImageSizeParam::Custom(c) => assert_eq!((c.width, c.height), (2048, 1152)),
      GptImage2p5ImageSizeParam::Preset(_) => panic!("expected custom"),
    }
  }

  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_text_to_image_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = GptImage2p5SunburstTextToImageRequest {
      params: GptImage2p5TextToImageParams {
        prompt: "an anime girl riding on the back of a t-rex".to_string(),
        num_images: GptImage2p5NumImages::One,
        image_size: None,
        resolution: None,
        quality: None,
        background: None,
        output_format: None,
        output_compression: None,
      },
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Request ID: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_text_to_image_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = GptImage2p5SunburstTextToImageRequest {
      params: GptImage2p5TextToImageParams {
        prompt: "a corgi wearing sunglasses at the beach".to_string(),
        num_images: GptImage2p5NumImages::Two,
        image_size: Some(GptImage2p5ImageSize::Landscape16x9),
        resolution: None,
        quality: Some(GptImage2p5Quality::High),
        background: None,
        output_format: Some(GptImage2p5OutputFormat::Png),
        output_compression: None,
      },
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

use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_edit_image_params::GptImage2p5EditImageParams;
use crate::requests::api::image::common::gpt_image_2p5::raw::gpt_image_2p5_edit_image_input::GptImage2p5EditImageInput;
use crate::requests::api::image::common::gpt_image_2p5::raw::gpt_image_2p5_image_output::GptImage2p5ImageOutput;
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// GPT Image 2.5 Flare image edit.
///
/// Flare and Sunburst take the same parameters (see `GptImage2p5EditImageParams`);
/// this type only selects the endpoint.
#[derive(Clone, Debug)]
pub struct GptImage2p5FlareEditImageRequest {
  pub params: GptImage2p5EditImageParams,
}

impl FalEndpoint for GptImage2p5FlareEditImageRequest {
  const ENDPOINT: &str = "openai/gpt-image-2.5/flare/edit";

  type RawRequest = GptImage2p5EditImageInput;
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
  use test_data::web::image_urls::{ERNEST_SCARED_STUPID_IMAGE_URL, GHOST_IMAGE_URL, TREX_SKELETON_IMAGE_URL};

  #[test]
  fn endpoint() {
    assert_eq!(GptImage2p5FlareEditImageRequest::ENDPOINT, "openai/gpt-image-2.5/flare/edit");
    assert_eq!(GptImage2p5FlareEditImageRequest::get_endpoint(), "openai/gpt-image-2.5/flare/edit");
  }

  #[test]
  fn to_raw_request_delegates_to_params() {
    let request = GptImage2p5FlareEditImageRequest {
      params: GptImage2p5EditImageParams {
        prompt: "test".to_string(),
        image_urls: vec!["https://example.com/image.png".to_string()],
        mask_url: Some("https://example.com/mask.png".to_string()),
        num_images: GptImage2p5NumImages::Two,
        image_size: Some(GptImage2p5ImageSize::Square),
        resolution: Some(GptImage2Resolution::TwoK),
        quality: Some(GptImage2p5Quality::Low),
        background: None,
        output_format: Some(GptImage2p5OutputFormat::Png),
        output_compression: None,
      },
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "test");
    assert_eq!(raw.image_urls, vec!["https://example.com/image.png".to_string()]);
    assert_eq!(raw.mask_url.as_deref(), Some("https://example.com/mask.png"));
    assert_eq!(raw.num_images, Some(2));
    assert_eq!(raw.quality.as_deref(), Some("low"));
    match raw.image_size.unwrap() {
      GptImage2p5ImageSizeParam::Custom(c) => assert_eq!((c.width, c.height), (2048, 2048)),
      GptImage2p5ImageSizeParam::Preset(_) => panic!("expected custom"),
    }
  }

  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_edit_image_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = GptImage2p5FlareEditImageRequest {
      params: GptImage2p5EditImageParams {
        prompt: "add the ghost and scared man to the image of the t-rex skeleton, make it look spooky but friendly".to_string(),
        image_urls: vec![
          GHOST_IMAGE_URL.to_string(),
          TREX_SKELETON_IMAGE_URL.to_string(),
          ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
        ],
        mask_url: None,
        num_images: GptImage2p5NumImages::Two,
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
  async fn test_edit_image_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = GptImage2p5FlareEditImageRequest {
      params: GptImage2p5EditImageParams {
        prompt: "make the ghost wear a top hat".to_string(),
        image_urls: vec![GHOST_IMAGE_URL.to_string()],
        mask_url: None,
        num_images: GptImage2p5NumImages::One,
        image_size: Some(GptImage2p5ImageSize::Square),
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

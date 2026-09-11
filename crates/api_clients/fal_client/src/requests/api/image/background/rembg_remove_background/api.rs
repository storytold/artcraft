use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::image::background::rembg_remove_background::raw_request::{
  RembgRemoveBackgroundInput, RembgRemoveBackgroundOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct RembgRemoveBackgroundRequest {
  /// URL of the image to remove the background from.
  pub image_url: String,
}

impl FalEndpoint for RembgRemoveBackgroundRequest {
  const ENDPOINT: &str = "fal-ai/imageutils/rembg";

  type RawRequest = RembgRemoveBackgroundInput;
  type RawResponse = RembgRemoveBackgroundOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      image_url: self.image_url.clone(),
      crop_to_bbox: None,
      sync_mode: None,
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
  use test_data::web::image_urls::ERNEST_SCARED_STUPID_IMAGE_URL;

  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_remove_background() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = RembgRemoveBackgroundRequest {
      image_url: ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Request ID: {:?}", result.request_id);
    Ok(())
  }

  // NB: Pricing tests are in cost.rs
}

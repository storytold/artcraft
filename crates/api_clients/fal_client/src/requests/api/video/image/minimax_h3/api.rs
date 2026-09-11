use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::image::minimax_h3::raw_request::{
  MinimaxH3ImageToVideoInput, MinimaxH3ImageToVideoOutput,
};
use crate::requests::api::video::text::minimax_h3::api::MinimaxH3Resolution;
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct MinimaxH3ImageToVideoRequest {
  /// Text prompt (1 to 7000 characters).
  pub prompt: String,

  /// URL of the image to use as the first frame. The output aspect ratio
  /// follows this image.
  pub image_url: String,

  /// Optional URL of the image to use as the last frame, for first-to-last
  /// keyframe generation.
  pub end_image_url: Option<String>,

  /// Duration in seconds. Valid range 5–15; fal's default is `5` when `None`.
  pub duration: Option<u8>,

  /// Output resolution. fal's default is `2K` when `None`.
  pub resolution: Option<MinimaxH3Resolution>,
}

impl FalEndpoint for MinimaxH3ImageToVideoRequest {
  const ENDPOINT: &str = "minimax/h3/image-to-video";

  type RawRequest = MinimaxH3ImageToVideoInput;
  type RawResponse = MinimaxH3ImageToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      image_url: self.image_url.clone(),
      end_image_url: self.end_image_url.clone(),
      duration: self.duration,
      resolution: self.resolution.map(|r| r.to_str().to_string()),
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

  const EXAMPLE_IMAGE_URL: &str =
    "https://storage.googleapis.com/falserverless/example_inputs/hailuo23/pro_i2v_in.jpg";

  // ── Real requests (manually run; require a live key and cost money) ──

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_image_to_video_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = MinimaxH3ImageToVideoRequest {
      prompt: "the camera slowly pulls back, revealing the full landscape".to_string(),
      image_url: EXAMPLE_IMAGE_URL.to_string(),
      end_image_url: None,
      duration: Some(5),
      resolution: Some(MinimaxH3Resolution::SevenSixtyEightP),
    };

    let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
    println!("Webhook result: {:?}", result);
    assert!(result.request_id.is_some() || result.gateway_request_id.is_some());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_image_to_video_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = MinimaxH3ImageToVideoRequest {
      prompt: "gentle wind moves through the scene as clouds drift overhead".to_string(),
      image_url: EXAMPLE_IMAGE_URL.to_string(),
      end_image_url: None,
      duration: Some(5),
      resolution: Some(MinimaxH3Resolution::SevenSixtyEightP),
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // ── Wire-shape sanity (no API calls) ──

  #[test]
  fn raw_request_maps_all_fields() {
    let request = MinimaxH3ImageToVideoRequest {
      prompt: "p".to_string(),
      image_url: "https://example.com/first.png".to_string(),
      end_image_url: Some("https://example.com/last.png".to_string()),
      duration: Some(12),
      resolution: Some(MinimaxH3Resolution::TwoK),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert_eq!(raw.image_url, "https://example.com/first.png");
    assert_eq!(raw.end_image_url.as_deref(), Some("https://example.com/last.png"));
    assert_eq!(raw.duration, Some(12));
    assert_eq!(raw.resolution.as_deref(), Some("2K"));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = MinimaxH3ImageToVideoRequest {
      prompt: "minimal".to_string(),
      image_url: "https://example.com/first.png".to_string(),
      end_image_url: None,
      duration: None,
      resolution: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({
      "prompt": "minimal",
      "image_url": "https://example.com/first.png",
    }));
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(MinimaxH3ImageToVideoRequest::ENDPOINT, "minimax/h3/image-to-video");
  }

  // NB: Pricing tests are in cost.rs
}

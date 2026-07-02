use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::image::veo_2::raw_request::{
  Veo2ImageToVideoInput, Veo2ImageToVideoOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Veo2ImageToVideoRequest {
  /// Text prompt describing how the image should be animated.
  pub prompt: String,

  /// URL of the input image to animate (720p+, 16:9 or 9:16).
  pub image_url: String,

  /// Video duration. fal's default is `5s` when `None`.
  pub duration: Option<Veo2ImageToVideoDuration>,
}

/// Veo 2 supports 5–8 second durations (default 5s).
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Veo2ImageToVideoDuration {
  FiveSeconds,
  SixSeconds,
  SevenSeconds,
  EightSeconds,
}

impl Veo2ImageToVideoDuration {
  pub fn to_seconds(&self) -> u64 {
    match self {
      Self::FiveSeconds => 5,
      Self::SixSeconds => 6,
      Self::SevenSeconds => 7,
      Self::EightSeconds => 8,
    }
  }

  fn to_str(&self) -> &'static str {
    match self {
      Self::FiveSeconds => "5s",
      Self::SixSeconds => "6s",
      Self::SevenSeconds => "7s",
      Self::EightSeconds => "8s",
    }
  }
}

impl FalEndpoint for Veo2ImageToVideoRequest {
  const ENDPOINT: &str = "fal-ai/veo2/image-to-video";

  type RawRequest = Veo2ImageToVideoInput;
  type RawResponse = Veo2ImageToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      image_url: self.image_url.clone(),
      duration: self.duration.map(|d| d.to_str().to_string()),
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
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  // ── Real requests (manually run; require a live key and cost money) ──

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_image_to_video_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Veo2ImageToVideoRequest {
      prompt: "the lake comes alive with gentle ripples and dappled sunlight".to_string(),
      image_url: JUNO_AT_LAKE_IMAGE_URL.to_string(),
      duration: Some(Veo2ImageToVideoDuration::FiveSeconds),
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

    let request = Veo2ImageToVideoRequest {
      prompt: "wind moves through the trees".to_string(),
      image_url: JUNO_AT_LAKE_IMAGE_URL.to_string(),
      duration: Some(Veo2ImageToVideoDuration::FiveSeconds),
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // ── Wire-shape sanity (no API calls) ──

  #[test]
  fn raw_request_maps_all_fields() {
    let request = Veo2ImageToVideoRequest {
      prompt: "p".to_string(),
      image_url: "https://example.com/start.png".to_string(),
      duration: Some(Veo2ImageToVideoDuration::EightSeconds),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert_eq!(raw.image_url, "https://example.com/start.png");
    assert_eq!(raw.duration.as_deref(), Some("8s"));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Veo2ImageToVideoRequest {
      prompt: "p".to_string(),
      image_url: "https://example.com/start.png".to_string(),
      duration: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({ "prompt": "p", "image_url": "https://example.com/start.png" }),
    );
  }

  #[test]
  fn every_duration_maps_to_wire_string_and_seconds() {
    for (variant, s, secs) in [
      (Veo2ImageToVideoDuration::FiveSeconds, "5s", 5),
      (Veo2ImageToVideoDuration::SixSeconds, "6s", 6),
      (Veo2ImageToVideoDuration::SevenSeconds, "7s", 7),
      (Veo2ImageToVideoDuration::EightSeconds, "8s", 8),
    ] {
      assert_eq!(variant.to_str(), s);
      assert_eq!(variant.to_seconds(), secs);
    }
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(Veo2ImageToVideoRequest::ENDPOINT, "fal-ai/veo2/image-to-video");
  }

  // NB: Pricing tests are in cost.rs
}

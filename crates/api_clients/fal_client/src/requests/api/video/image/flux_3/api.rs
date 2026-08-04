use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::image::flux_3::raw_request::{
  Flux3ImageToVideoInput, Flux3ImageToVideoOutput,
};
use crate::requests::api::video::text::flux_3::api::{
  Flux3AspectRatio, Flux3Duration, Flux3Resolution,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Flux3ImageToVideoRequest {
  /// Text prompt for video generation.
  pub prompt: String,

  /// URL of the image to animate.
  pub image_url: String,

  /// Duration in seconds. fal's default is `auto` when `None`.
  pub duration: Option<Flux3Duration>,

  /// Output resolution. fal's default is `720p` when `None`.
  pub resolution: Option<Flux3Resolution>,

  /// Aspect ratio. fal's default is `auto` when `None`.
  pub aspect_ratio: Option<Flux3AspectRatio>,

  /// Whether to generate synchronized audio. fal's default is `true` when
  /// `None`. Audio does not affect the bill.
  pub generate_audio: Option<bool>,

  /// Safety tolerance, 0 (strictest) to 4 (most permissive). fal's default is
  /// `2` when `None`.
  pub safety_tolerance: Option<u8>,
}

impl FalEndpoint for Flux3ImageToVideoRequest {
  const ENDPOINT: &str = "blackforestlabs/flux-3/image-to-video";

  type RawRequest = Flux3ImageToVideoInput;
  type RawResponse = Flux3ImageToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      image_url: self.image_url.clone(),
      duration: self.duration,
      resolution: self.resolution.map(|r| r.to_str().to_string()),
      aspect_ratio: self.aspect_ratio.map(|ar| ar.to_str().to_string()),
      generate_audio: self.generate_audio,
      safety_tolerance: self.safety_tolerance,
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
    "https://storage.googleapis.com/falserverless/example_inputs/veo31-flf2v-input-1.jpeg";

  // ── Real requests (manually run; require a live key and cost money) ──

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_image_to_video_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Flux3ImageToVideoRequest {
      prompt: "the camera slowly pulls back, revealing the full landscape".to_string(),
      image_url: EXAMPLE_IMAGE_URL.to_string(),
      duration: Some(Flux3Duration::Seconds(5)),
      resolution: Some(Flux3Resolution::SevenTwentyP),
      aspect_ratio: None,
      generate_audio: Some(false),
      safety_tolerance: None,
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

    let request = Flux3ImageToVideoRequest {
      prompt: "gentle wind moves through the scene as clouds drift overhead".to_string(),
      image_url: EXAMPLE_IMAGE_URL.to_string(),
      duration: Some(Flux3Duration::Seconds(5)),
      resolution: Some(Flux3Resolution::SevenTwentyP),
      aspect_ratio: None,
      generate_audio: Some(false),
      safety_tolerance: None,
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // ── Wire-shape sanity (no API calls) ──

  #[test]
  fn raw_request_maps_all_fields() {
    let request = Flux3ImageToVideoRequest {
      prompt: "p".to_string(),
      image_url: "https://example.com/frame.png".to_string(),
      duration: Some(Flux3Duration::Auto),
      resolution: Some(Flux3Resolution::TenEightyP),
      aspect_ratio: Some(Flux3AspectRatio::Auto),
      generate_audio: Some(true),
      safety_tolerance: Some(0),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert_eq!(raw.image_url, "https://example.com/frame.png");
    assert_eq!(raw.duration, Some(Flux3Duration::Auto));
    assert_eq!(raw.resolution.as_deref(), Some("1080p"));
    assert_eq!(raw.aspect_ratio.as_deref(), Some("auto"));
    assert_eq!(raw.generate_audio, Some(true));
    assert_eq!(raw.safety_tolerance, Some(0));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Flux3ImageToVideoRequest {
      prompt: "minimal".to_string(),
      image_url: "https://example.com/frame.png".to_string(),
      duration: None,
      resolution: None,
      aspect_ratio: None,
      generate_audio: None,
      safety_tolerance: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({
      "prompt": "minimal",
      "image_url": "https://example.com/frame.png",
    }));
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(Flux3ImageToVideoRequest::ENDPOINT, "blackforestlabs/flux-3/image-to-video");
  }

  // NB: Pricing tests are in cost.rs
}

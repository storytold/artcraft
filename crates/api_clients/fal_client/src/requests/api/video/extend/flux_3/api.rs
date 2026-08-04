use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::extend::flux_3::raw_request::{
  Flux3ExtendVideoInput, Flux3ExtendVideoOutput,
};
use crate::requests::api::video::text::flux_3::api::{
  Flux3AspectRatio, Flux3Duration, Flux3Resolution,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Flux3ExtendVideoRequest {
  /// Text prompt describing how the video should continue.
  pub prompt: String,

  /// URL of the video to extend.
  pub video_url: String,

  /// Duration of the extension in seconds. fal's default is `auto` when
  /// `None`.
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

impl FalEndpoint for Flux3ExtendVideoRequest {
  const ENDPOINT: &str = "blackforestlabs/flux-3/extend-video";

  type RawRequest = Flux3ExtendVideoInput;
  type RawResponse = Flux3ExtendVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      video_url: self.video_url.clone(),
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

  // ── Real requests (manually run; require a live key and cost money) ──

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_extend_video_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Flux3ExtendVideoRequest {
      prompt: "the camera keeps drifting forward as the scene continues".to_string(),
      video_url: "https://storage.googleapis.com/falserverless/example_inputs/hunyuan_video_input.mp4".to_string(),
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
    let request = Flux3ExtendVideoRequest {
      prompt: "p".to_string(),
      video_url: "https://example.com/source.mp4".to_string(),
      duration: Some(Flux3Duration::Seconds(10)),
      resolution: Some(Flux3Resolution::TenEightyP),
      aspect_ratio: Some(Flux3AspectRatio::SixteenByNine),
      generate_audio: Some(true),
      safety_tolerance: Some(2),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert_eq!(raw.video_url, "https://example.com/source.mp4");
    assert_eq!(raw.duration, Some(Flux3Duration::Seconds(10)));
    assert_eq!(raw.resolution.as_deref(), Some("1080p"));
    assert_eq!(raw.aspect_ratio.as_deref(), Some("16:9"));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Flux3ExtendVideoRequest {
      prompt: "minimal".to_string(),
      video_url: "https://example.com/source.mp4".to_string(),
      duration: None,
      resolution: None,
      aspect_ratio: None,
      generate_audio: None,
      safety_tolerance: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({
      "prompt": "minimal",
      "video_url": "https://example.com/source.mp4",
    }));
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(Flux3ExtendVideoRequest::ENDPOINT, "blackforestlabs/flux-3/extend-video");
  }

  // NB: Pricing tests are in cost.rs
}

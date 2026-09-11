use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::keyframes::flux_3::raw_request::{
  Flux3Keyframe, Flux3KeyframesToVideoInput, Flux3KeyframesToVideoOutput,
};
use crate::requests::api::video::text::flux_3::api::{Flux3AspectRatio, Flux3Resolution};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Flux3KeyframesToVideoRequest {
  /// Text prompt for video generation.
  pub prompt: String,

  /// Keyframe images pinned to frame positions in the generated 24 fps video
  /// (1 to 10 entries with unique `frame_index` values, each at most
  /// `duration * 24`).
  pub keyframes: Vec<Flux3Keyframe>,

  /// Duration in seconds. Valid range 5–20; fal's default is `5` when `None`.
  pub duration: Option<u8>,

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

impl FalEndpoint for Flux3KeyframesToVideoRequest {
  const ENDPOINT: &str = "blackforestlabs/flux-3/keyframes-to-video";

  type RawRequest = Flux3KeyframesToVideoInput;
  type RawResponse = Flux3KeyframesToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      keyframes: self.keyframes.clone(),
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

  const KEYFRAME_ONE_URL: &str =
    "https://storage.googleapis.com/falserverless/example_inputs/veo31-flf2v-input-1.jpeg";
  const KEYFRAME_TWO_URL: &str =
    "https://storage.googleapis.com/falserverless/example_inputs/veo31-flf2v-input-2.jpeg";

  // ── Real requests (manually run; require a live key and cost money) ──

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_keyframes_to_video_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Flux3KeyframesToVideoRequest {
      prompt: "the scene flows naturally between the pinned keyframes".to_string(),
      keyframes: vec![
        Flux3Keyframe { image_url: KEYFRAME_ONE_URL.to_string(), frame_index: 0 },
        Flux3Keyframe { image_url: KEYFRAME_TWO_URL.to_string(), frame_index: 96 },
      ],
      duration: Some(5),
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
    let request = Flux3KeyframesToVideoRequest {
      prompt: "p".to_string(),
      keyframes: vec![
        Flux3Keyframe { image_url: "https://example.com/a.png".to_string(), frame_index: 0 },
        Flux3Keyframe { image_url: "https://example.com/b.png".to_string(), frame_index: 120 },
      ],
      duration: Some(10),
      resolution: Some(Flux3Resolution::TenEightyP),
      aspect_ratio: Some(Flux3AspectRatio::SixteenByNine),
      generate_audio: Some(true),
      safety_tolerance: Some(2),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert_eq!(raw.keyframes.len(), 2);
    assert_eq!(raw.keyframes[0].image_url, "https://example.com/a.png");
    assert_eq!(raw.keyframes[0].frame_index, 0);
    assert_eq!(raw.keyframes[1].frame_index, 120);
    assert_eq!(raw.duration, Some(10));
    assert_eq!(raw.resolution.as_deref(), Some("1080p"));
    assert_eq!(raw.aspect_ratio.as_deref(), Some("16:9"));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Flux3KeyframesToVideoRequest {
      prompt: "minimal".to_string(),
      keyframes: vec![
        Flux3Keyframe { image_url: "https://example.com/a.png".to_string(), frame_index: 0 },
      ],
      duration: None,
      resolution: None,
      aspect_ratio: None,
      generate_audio: None,
      safety_tolerance: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({
      "prompt": "minimal",
      "keyframes": [
        { "image_url": "https://example.com/a.png", "frame_index": 0 },
      ],
    }));
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(Flux3KeyframesToVideoRequest::ENDPOINT, "blackforestlabs/flux-3/keyframes-to-video");
  }

  // NB: Pricing tests are in cost.rs
}

use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::text::vidu_q3::raw_request::{
  ViduQ3TextToVideoInput, ViduQ3TextToVideoOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct ViduQ3TextToVideoRequest {
  /// Text prompt (max 2000 characters).
  pub prompt: String,

  /// Duration in seconds. Valid range 1–16; fal's default is `5` when `None`.
  pub duration: Option<u8>,

  /// Seed for reproducibility. Random when `None`.
  pub seed: Option<i64>,

  /// Aspect ratio. fal's default is `16:9` when `None`.
  pub aspect_ratio: Option<ViduQ3TextToVideoAspectRatio>,

  /// Output resolution. fal's default is `720p` when `None`.
  pub resolution: Option<ViduQ3TextToVideoResolution>,

  /// Whether to generate audio. fal's server default is `true` when `None`.
  pub audio: Option<bool>,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ViduQ3TextToVideoAspectRatio {
  SixteenByNine,
  NineBySixteen,
  FourByThree,
  ThreeByFour,
  Square,
}

impl ViduQ3TextToVideoAspectRatio {
  fn to_str(&self) -> &'static str {
    match self {
      Self::SixteenByNine => "16:9",
      Self::NineBySixteen => "9:16",
      Self::FourByThree => "4:3",
      Self::ThreeByFour => "3:4",
      Self::Square => "1:1",
    }
  }
}

/// Vidu Q3 resolutions. 720p/1080p bill at 2.2× the 360p/540p per-second rate.
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ViduQ3TextToVideoResolution {
  ThreeSixtyP,
  FiveFortyP,
  SevenTwentyP,
  TenEightyP,
}

impl ViduQ3TextToVideoResolution {
  /// 720p and 1080p are billed at the higher (2.2×) per-second rate.
  pub fn is_high_res(&self) -> bool {
    matches!(self, Self::SevenTwentyP | Self::TenEightyP)
  }

  fn to_str(&self) -> &'static str {
    match self {
      Self::ThreeSixtyP => "360p",
      Self::FiveFortyP => "540p",
      Self::SevenTwentyP => "720p",
      Self::TenEightyP => "1080p",
    }
  }
}

impl FalEndpoint for ViduQ3TextToVideoRequest {
  const ENDPOINT: &str = "fal-ai/vidu/q3/text-to-video";

  type RawRequest = ViduQ3TextToVideoInput;
  type RawResponse = ViduQ3TextToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      duration: self.duration,
      seed: self.seed,
      aspect_ratio: self.aspect_ratio.map(|ar| ar.to_str().to_string()),
      resolution: self.resolution.map(|r| r.to_str().to_string()),
      audio: self.audio,
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
  async fn test_text_to_video_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = ViduQ3TextToVideoRequest {
      prompt: "a golden retriever puppy chases butterflies through a sunlit meadow".to_string(),
      duration: Some(5),
      seed: None,
      aspect_ratio: Some(ViduQ3TextToVideoAspectRatio::SixteenByNine),
      resolution: Some(ViduQ3TextToVideoResolution::SevenTwentyP),
      audio: Some(true),
    };

    let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
    println!("Webhook result: {:?}", result);
    assert!(result.request_id.is_some() || result.gateway_request_id.is_some());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_video_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = ViduQ3TextToVideoRequest {
      prompt: "a wave crashes against a rocky shoreline at sunset".to_string(),
      duration: Some(5),
      seed: Some(1234),
      aspect_ratio: Some(ViduQ3TextToVideoAspectRatio::SixteenByNine),
      resolution: Some(ViduQ3TextToVideoResolution::ThreeSixtyP),
      audio: Some(false),
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // ── Wire-shape sanity (no API calls) ──

  #[test]
  fn raw_request_maps_all_fields() {
    let request = ViduQ3TextToVideoRequest {
      prompt: "p".to_string(),
      duration: Some(12),
      seed: Some(42),
      aspect_ratio: Some(ViduQ3TextToVideoAspectRatio::FourByThree),
      resolution: Some(ViduQ3TextToVideoResolution::TenEightyP),
      audio: Some(false),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert_eq!(raw.duration, Some(12));
    assert_eq!(raw.seed, Some(42));
    assert_eq!(raw.aspect_ratio.as_deref(), Some("4:3"));
    assert_eq!(raw.resolution.as_deref(), Some("1080p"));
    assert_eq!(raw.audio, Some(false));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = ViduQ3TextToVideoRequest {
      prompt: "minimal".to_string(),
      duration: None,
      seed: None,
      aspect_ratio: None,
      resolution: None,
      audio: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({ "prompt": "minimal" }));
  }

  #[test]
  fn seed_serializes_when_set() {
    let request = ViduQ3TextToVideoRequest {
      prompt: "p".to_string(),
      duration: None,
      seed: Some(777),
      aspect_ratio: None,
      resolution: None,
      audio: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json.get("seed").and_then(|s| s.as_i64()), Some(777));
  }

  #[test]
  fn every_aspect_ratio_maps_to_wire_string() {
    for (variant, expected) in [
      (ViduQ3TextToVideoAspectRatio::SixteenByNine, "16:9"),
      (ViduQ3TextToVideoAspectRatio::NineBySixteen, "9:16"),
      (ViduQ3TextToVideoAspectRatio::FourByThree, "4:3"),
      (ViduQ3TextToVideoAspectRatio::ThreeByFour, "3:4"),
      (ViduQ3TextToVideoAspectRatio::Square, "1:1"),
    ] {
      assert_eq!(variant.to_str(), expected);
    }
  }

  #[test]
  fn every_resolution_maps_to_wire_string() {
    for (variant, expected, high) in [
      (ViduQ3TextToVideoResolution::ThreeSixtyP, "360p", false),
      (ViduQ3TextToVideoResolution::FiveFortyP, "540p", false),
      (ViduQ3TextToVideoResolution::SevenTwentyP, "720p", true),
      (ViduQ3TextToVideoResolution::TenEightyP, "1080p", true),
    ] {
      assert_eq!(variant.to_str(), expected);
      assert_eq!(variant.is_high_res(), high);
    }
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(ViduQ3TextToVideoRequest::ENDPOINT, "fal-ai/vidu/q3/text-to-video");
  }

  // NB: Pricing tests are in cost.rs
}

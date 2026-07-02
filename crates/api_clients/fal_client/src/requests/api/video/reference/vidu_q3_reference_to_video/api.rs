use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::reference::vidu_q3_reference_to_video::raw_request::{
  ViduQ3ReferenceToVideoInput, ViduQ3ReferenceToVideoOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct ViduQ3ReferenceToVideoRequest {
  /// Text prompt (max 2000 characters).
  pub prompt: String,

  /// Reference image URLs (1 to 4) used for subject consistency.
  pub reference_image_urls: Vec<String>,

  /// Duration in seconds. Valid range 1–16; fal's default is `5` when `None`.
  pub duration: Option<u8>,

  /// Seed for reproducibility. Random when `None`.
  pub seed: Option<i64>,

  /// Aspect ratio. fal's default is `16:9` when `None`.
  pub aspect_ratio: Option<ViduQ3ReferenceToVideoAspectRatio>,

  /// Output resolution. fal's default is `720p` when `None`.
  pub resolution: Option<ViduQ3ReferenceToVideoResolution>,

  /// Whether to generate audio. fal's server default is `true` when `None`.
  pub audio: Option<bool>,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ViduQ3ReferenceToVideoAspectRatio {
  SixteenByNine,
  NineBySixteen,
  FourByThree,
  ThreeByFour,
  Square,
}

impl ViduQ3ReferenceToVideoAspectRatio {
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
pub enum ViduQ3ReferenceToVideoResolution {
  ThreeSixtyP,
  FiveFortyP,
  SevenTwentyP,
  TenEightyP,
}

impl ViduQ3ReferenceToVideoResolution {
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

impl FalEndpoint for ViduQ3ReferenceToVideoRequest {
  const ENDPOINT: &str = "fal-ai/vidu/q3/reference-to-video";

  type RawRequest = ViduQ3ReferenceToVideoInput;
  type RawResponse = ViduQ3ReferenceToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      reference_image_urls: self.reference_image_urls.clone(),
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
  use test_data::web::image_urls::{JUNO_AT_LAKE_IMAGE_URL, TALL_MOCHI_WITH_GLASSES_IMAGE_URL};

  // ── Real requests (manually run; require a live key and cost money) ──

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_reference_to_video_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = ViduQ3ReferenceToVideoRequest {
      prompt: "the two dogs run side by side across a sunlit meadow".to_string(),
      reference_image_urls: vec![
        TALL_MOCHI_WITH_GLASSES_IMAGE_URL.to_string(),
        JUNO_AT_LAKE_IMAGE_URL.to_string(),
      ],
      duration: Some(5),
      seed: None,
      aspect_ratio: Some(ViduQ3ReferenceToVideoAspectRatio::SixteenByNine),
      resolution: Some(ViduQ3ReferenceToVideoResolution::SevenTwentyP),
      audio: Some(false),
    };

    let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
    println!("Webhook result: {:?}", result);
    assert!(result.request_id.is_some() || result.gateway_request_id.is_some());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_reference_to_video_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = ViduQ3ReferenceToVideoRequest {
      prompt: "the dogs play together in a snowy field".to_string(),
      reference_image_urls: vec![TALL_MOCHI_WITH_GLASSES_IMAGE_URL.to_string()],
      duration: Some(5),
      seed: Some(1234),
      aspect_ratio: None,
      resolution: Some(ViduQ3ReferenceToVideoResolution::ThreeSixtyP),
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
    let request = ViduQ3ReferenceToVideoRequest {
      prompt: "p".to_string(),
      reference_image_urls: vec!["https://example.com/a.png".to_string(), "https://example.com/b.png".to_string()],
      duration: Some(12),
      seed: Some(42),
      aspect_ratio: Some(ViduQ3ReferenceToVideoAspectRatio::FourByThree),
      resolution: Some(ViduQ3ReferenceToVideoResolution::TenEightyP),
      audio: Some(false),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert_eq!(raw.reference_image_urls.len(), 2);
    assert_eq!(raw.duration, Some(12));
    assert_eq!(raw.seed, Some(42));
    assert_eq!(raw.aspect_ratio.as_deref(), Some("4:3"));
    assert_eq!(raw.resolution.as_deref(), Some("1080p"));
    assert_eq!(raw.audio, Some(false));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = ViduQ3ReferenceToVideoRequest {
      prompt: "p".to_string(),
      reference_image_urls: vec!["https://example.com/a.png".to_string()],
      duration: None,
      seed: None,
      aspect_ratio: None,
      resolution: None,
      audio: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({ "prompt": "p", "reference_image_urls": ["https://example.com/a.png"] }),
    );
  }

  #[test]
  fn seed_serializes_when_set() {
    let request = ViduQ3ReferenceToVideoRequest {
      prompt: "p".to_string(),
      reference_image_urls: vec!["https://example.com/a.png".to_string()],
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
      (ViduQ3ReferenceToVideoAspectRatio::SixteenByNine, "16:9"),
      (ViduQ3ReferenceToVideoAspectRatio::NineBySixteen, "9:16"),
      (ViduQ3ReferenceToVideoAspectRatio::FourByThree, "4:3"),
      (ViduQ3ReferenceToVideoAspectRatio::ThreeByFour, "3:4"),
      (ViduQ3ReferenceToVideoAspectRatio::Square, "1:1"),
    ] {
      assert_eq!(variant.to_str(), expected);
    }
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(
      ViduQ3ReferenceToVideoRequest::ENDPOINT,
      "fal-ai/vidu/q3/reference-to-video",
    );
  }

  // NB: Pricing tests are in cost.rs
}

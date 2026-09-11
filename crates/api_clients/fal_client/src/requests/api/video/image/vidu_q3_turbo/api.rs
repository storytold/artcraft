use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::image::vidu_q3_turbo::raw_request::{
  ViduQ3TurboImageToVideoInput, ViduQ3TurboImageToVideoOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct ViduQ3TurboImageToVideoRequest {
  /// Text prompt (max 2000 characters). Optional server-side; pass an empty
  /// string for a pure image-to-video generation.
  pub prompt: String,

  /// URL of the image used as the starting frame (URL or base64).
  pub image_url: String,

  /// Optional URL of an ending frame, for start→end transition videos.
  pub end_image_url: Option<String>,

  /// Duration in seconds. Valid range 1–16; fal's default is `5` when `None`.
  pub duration: Option<u8>,

  /// Seed for reproducibility. Random when `None`.
  pub seed: Option<i64>,

  /// Output resolution. fal's default is `720p` when `None`. Note fal rejects
  /// `360p` when `end_image_url` is set.
  pub resolution: Option<ViduQ3TurboImageToVideoResolution>,

  /// Whether to generate audio. fal's server default is `true` when `None`.
  pub audio: Option<bool>,
}

/// Vidu Q3 Turbo resolutions. 720p/1080p bill at 2.2× the 360p/540p rate.
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ViduQ3TurboImageToVideoResolution {
  ThreeSixtyP,
  FiveFortyP,
  SevenTwentyP,
  TenEightyP,
}

impl ViduQ3TurboImageToVideoResolution {
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

impl FalEndpoint for ViduQ3TurboImageToVideoRequest {
  const ENDPOINT: &str = "fal-ai/vidu/q3/image-to-video/turbo";

  type RawRequest = ViduQ3TurboImageToVideoInput;
  type RawResponse = ViduQ3TurboImageToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      image_url: self.image_url.clone(),
      end_image_url: self.end_image_url.clone(),
      duration: self.duration,
      seed: self.seed,
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
  async fn test_image_to_video_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = ViduQ3TurboImageToVideoRequest {
      prompt: "the lake comes alive with gentle ripples and dappled sunlight".to_string(),
      image_url: JUNO_AT_LAKE_IMAGE_URL.to_string(),
      end_image_url: None,
      duration: Some(5),
      seed: None,
      resolution: Some(ViduQ3TurboImageToVideoResolution::SevenTwentyP),
      audio: Some(false),
    };

    let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
    println!("Webhook result: {:?}", result);
    assert!(result.request_id.is_some() || result.gateway_request_id.is_some());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_image_to_video_with_end_frame_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = ViduQ3TurboImageToVideoRequest {
      prompt: "a smooth transition between the two frames".to_string(),
      image_url: TALL_MOCHI_WITH_GLASSES_IMAGE_URL.to_string(),
      end_image_url: Some(JUNO_AT_LAKE_IMAGE_URL.to_string()),
      duration: Some(5),
      seed: Some(1234),
      resolution: Some(ViduQ3TurboImageToVideoResolution::SevenTwentyP),
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
    let request = ViduQ3TurboImageToVideoRequest {
      prompt: "p".to_string(),
      image_url: "https://example.com/start.png".to_string(),
      end_image_url: Some("https://example.com/end.png".to_string()),
      duration: Some(7),
      seed: Some(42),
      resolution: Some(ViduQ3TurboImageToVideoResolution::TenEightyP),
      audio: Some(false),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert_eq!(raw.image_url, "https://example.com/start.png");
    assert_eq!(raw.end_image_url.as_deref(), Some("https://example.com/end.png"));
    assert_eq!(raw.duration, Some(7));
    assert_eq!(raw.seed, Some(42));
    assert_eq!(raw.resolution.as_deref(), Some("1080p"));
    assert_eq!(raw.audio, Some(false));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = ViduQ3TurboImageToVideoRequest {
      prompt: "p".to_string(),
      image_url: "https://example.com/start.png".to_string(),
      end_image_url: None,
      duration: None,
      seed: None,
      resolution: None,
      audio: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({ "prompt": "p", "image_url": "https://example.com/start.png" }),
    );
  }

  #[test]
  fn seed_serializes_when_set() {
    let request = ViduQ3TurboImageToVideoRequest {
      prompt: "p".to_string(),
      image_url: "https://example.com/start.png".to_string(),
      end_image_url: None,
      duration: None,
      seed: Some(777),
      resolution: None,
      audio: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json.get("seed").and_then(|s| s.as_i64()), Some(777));
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(
      ViduQ3TurboImageToVideoRequest::ENDPOINT,
      "fal-ai/vidu/q3/image-to-video/turbo",
    );
  }

  // NB: Pricing tests are in cost.rs
}

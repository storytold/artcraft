use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::reference::minimax_h3::raw_request::{
  MinimaxH3ReferenceToVideoInput, MinimaxH3ReferenceToVideoOutput,
};
use crate::requests::api::video::text::minimax_h3::api::MinimaxH3Resolution;
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct MinimaxH3ReferenceToVideoRequest {
  /// Text prompt (1 to 7000 characters). Refer to reference assets by their
  /// modality and order in the reference lists: Image 1, Image 2, Video 1,
  /// Audio 1, and so on.
  pub prompt: String,

  /// URLs of subject/style reference images (at most 9). Reference images,
  /// videos, and audio clips must add up to at most 12 files.
  pub reference_image_urls: Option<Vec<String>>,

  /// URLs of motion/reference video clips (at most 3; 2–15 seconds each,
  /// combined duration at most 15 seconds).
  pub reference_video_urls: Option<Vec<String>>,

  /// URLs of reference audio clips (at most 3; 2–15 seconds each, combined
  /// duration at most 15 seconds). Audio cannot be the only reference input.
  pub reference_audio_urls: Option<Vec<String>>,

  /// Duration in seconds. Valid range 5–15; fal's default is `5` when `None`.
  pub duration: Option<u8>,

  /// Output resolution. fal's default is `2K` when `None`.
  pub resolution: Option<MinimaxH3Resolution>,

  /// Aspect ratio. fal's default is `adaptive` when `None`.
  pub aspect_ratio: Option<MinimaxH3ReferenceToVideoAspectRatio>,
}

/// Reference-to-video aspect ratios. Unlike the text modality, `adaptive`
/// (derive the ratio from the reference assets) is supported and is fal's
/// default.
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum MinimaxH3ReferenceToVideoAspectRatio {
  Adaptive,
  TwentyOneByNine,
  SixteenByNine,
  FourByThree,
  Square,
  ThreeByFour,
  NineBySixteen,
}

impl MinimaxH3ReferenceToVideoAspectRatio {
  fn to_str(&self) -> &'static str {
    match self {
      Self::Adaptive => "adaptive",
      Self::TwentyOneByNine => "21:9",
      Self::SixteenByNine => "16:9",
      Self::FourByThree => "4:3",
      Self::Square => "1:1",
      Self::ThreeByFour => "3:4",
      Self::NineBySixteen => "9:16",
    }
  }
}

impl FalEndpoint for MinimaxH3ReferenceToVideoRequest {
  const ENDPOINT: &str = "minimax/h3/reference-to-video";

  type RawRequest = MinimaxH3ReferenceToVideoInput;
  type RawResponse = MinimaxH3ReferenceToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      reference_image_urls: self.reference_image_urls.clone(),
      reference_video_urls: self.reference_video_urls.clone(),
      reference_audio_urls: self.reference_audio_urls.clone(),
      duration: self.duration,
      resolution: self.resolution.map(|r| r.to_str().to_string()),
      aspect_ratio: self.aspect_ratio.map(|ar| ar.to_str().to_string()),
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
  async fn test_reference_to_video_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = MinimaxH3ReferenceToVideoRequest {
      prompt: "Image 1 is the subject. Keep the subject consistent while the camera slowly orbits.".to_string(),
      reference_image_urls: Some(vec![EXAMPLE_IMAGE_URL.to_string()]),
      reference_video_urls: None,
      reference_audio_urls: None,
      duration: Some(5),
      resolution: Some(MinimaxH3Resolution::SevenSixtyEightP),
      aspect_ratio: Some(MinimaxH3ReferenceToVideoAspectRatio::Adaptive),
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

    let request = MinimaxH3ReferenceToVideoRequest {
      prompt: "Image 1 is the subject. The subject walks through a sunlit garden.".to_string(),
      reference_image_urls: Some(vec![EXAMPLE_IMAGE_URL.to_string()]),
      reference_video_urls: None,
      reference_audio_urls: None,
      duration: Some(5),
      resolution: Some(MinimaxH3Resolution::SevenSixtyEightP),
      aspect_ratio: None,
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // ── Wire-shape sanity (no API calls) ──

  #[test]
  fn raw_request_maps_all_fields() {
    let request = MinimaxH3ReferenceToVideoRequest {
      prompt: "p".to_string(),
      reference_image_urls: Some(vec!["https://example.com/a.png".to_string()]),
      reference_video_urls: Some(vec!["https://example.com/b.mp4".to_string()]),
      reference_audio_urls: Some(vec!["https://example.com/c.mp3".to_string()]),
      duration: Some(12),
      resolution: Some(MinimaxH3Resolution::TwoK),
      aspect_ratio: Some(MinimaxH3ReferenceToVideoAspectRatio::Adaptive),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert_eq!(raw.reference_image_urls.as_deref(), Some(&["https://example.com/a.png".to_string()][..]));
    assert_eq!(raw.reference_video_urls.as_deref(), Some(&["https://example.com/b.mp4".to_string()][..]));
    assert_eq!(raw.reference_audio_urls.as_deref(), Some(&["https://example.com/c.mp3".to_string()][..]));
    assert_eq!(raw.duration, Some(12));
    assert_eq!(raw.resolution.as_deref(), Some("2K"));
    assert_eq!(raw.aspect_ratio.as_deref(), Some("adaptive"));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = MinimaxH3ReferenceToVideoRequest {
      prompt: "minimal".to_string(),
      reference_image_urls: None,
      reference_video_urls: None,
      reference_audio_urls: None,
      duration: None,
      resolution: None,
      aspect_ratio: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({ "prompt": "minimal" }));
  }

  #[test]
  fn every_aspect_ratio_maps_to_wire_string() {
    for (variant, expected) in [
      (MinimaxH3ReferenceToVideoAspectRatio::Adaptive, "adaptive"),
      (MinimaxH3ReferenceToVideoAspectRatio::TwentyOneByNine, "21:9"),
      (MinimaxH3ReferenceToVideoAspectRatio::SixteenByNine, "16:9"),
      (MinimaxH3ReferenceToVideoAspectRatio::FourByThree, "4:3"),
      (MinimaxH3ReferenceToVideoAspectRatio::Square, "1:1"),
      (MinimaxH3ReferenceToVideoAspectRatio::ThreeByFour, "3:4"),
      (MinimaxH3ReferenceToVideoAspectRatio::NineBySixteen, "9:16"),
    ] {
      assert_eq!(variant.to_str(), expected);
    }
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(MinimaxH3ReferenceToVideoRequest::ENDPOINT, "minimax/h3/reference-to-video");
  }

  // NB: Pricing tests are in cost.rs
}

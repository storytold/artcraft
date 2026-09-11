use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::text::veo_2::raw_request::{
  Veo2TextToVideoInput, Veo2TextToVideoOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Veo2TextToVideoRequest {
  /// Text prompt describing the video to generate.
  pub prompt: String,

  /// Aspect ratio. fal's default is `16:9` when `None`.
  pub aspect_ratio: Option<Veo2TextToVideoAspectRatio>,

  /// Video duration. fal's default is `5s` when `None`.
  pub duration: Option<Veo2TextToVideoDuration>,

  /// Optional negative prompt.
  pub negative_prompt: Option<String>,

  /// Whether to enhance the prompt before generation. fal's default is `true`
  /// when `None`.
  pub enhance_prompt: Option<bool>,

  /// Seed for the random number generator.
  pub seed: Option<i64>,

  /// Whether to auto-rewrite prompts that fail moderation. fal's default is
  /// `true` when `None`.
  pub auto_fix: Option<bool>,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Veo2TextToVideoAspectRatio {
  NineBySixteen,
  SixteenByNine,
  Square,
}

impl Veo2TextToVideoAspectRatio {
  fn to_str(&self) -> &'static str {
    match self {
      Self::NineBySixteen => "9:16",
      Self::SixteenByNine => "16:9",
      Self::Square => "1:1",
    }
  }
}

/// Veo 2 supports 5–8 second durations (default 5s), unlike the Veo 3 family's
/// 4/6/8.
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Veo2TextToVideoDuration {
  FiveSeconds,
  SixSeconds,
  SevenSeconds,
  EightSeconds,
}

impl Veo2TextToVideoDuration {
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

impl FalEndpoint for Veo2TextToVideoRequest {
  const ENDPOINT: &str = "fal-ai/veo2";

  type RawRequest = Veo2TextToVideoInput;
  type RawResponse = Veo2TextToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      aspect_ratio: self.aspect_ratio.map(|ar| ar.to_str().to_string()),
      duration: self.duration.map(|d| d.to_str().to_string()),
      negative_prompt: self.negative_prompt.clone(),
      enhance_prompt: self.enhance_prompt,
      seed: self.seed,
      auto_fix: self.auto_fix,
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

    let request = Veo2TextToVideoRequest {
      prompt: "a golden retriever puppy chases butterflies through a sunlit meadow".to_string(),
      aspect_ratio: Some(Veo2TextToVideoAspectRatio::SixteenByNine),
      duration: Some(Veo2TextToVideoDuration::FiveSeconds),
      negative_prompt: None,
      enhance_prompt: None,
      seed: None,
      auto_fix: None,
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

    let request = Veo2TextToVideoRequest {
      prompt: "a wave crashes against a rocky shoreline at sunset".to_string(),
      aspect_ratio: Some(Veo2TextToVideoAspectRatio::SixteenByNine),
      duration: Some(Veo2TextToVideoDuration::FiveSeconds),
      negative_prompt: None,
      enhance_prompt: None,
      seed: None,
      auto_fix: None,
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // ── Wire-shape sanity (no API calls) ──

  #[test]
  fn raw_request_maps_all_fields() {
    let request = Veo2TextToVideoRequest {
      prompt: "p".to_string(),
      aspect_ratio: Some(Veo2TextToVideoAspectRatio::Square),
      duration: Some(Veo2TextToVideoDuration::EightSeconds),
      negative_prompt: Some("blurry".to_string()),
      enhance_prompt: Some(false),
      seed: Some(42),
      auto_fix: Some(false),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert_eq!(raw.aspect_ratio.as_deref(), Some("1:1"));
    assert_eq!(raw.duration.as_deref(), Some("8s"));
    assert_eq!(raw.negative_prompt.as_deref(), Some("blurry"));
    assert_eq!(raw.enhance_prompt, Some(false));
    assert_eq!(raw.seed, Some(42));
    assert_eq!(raw.auto_fix, Some(false));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Veo2TextToVideoRequest {
      prompt: "minimal".to_string(),
      aspect_ratio: None,
      duration: None,
      negative_prompt: None,
      enhance_prompt: None,
      seed: None,
      auto_fix: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({ "prompt": "minimal" }));
  }

  #[test]
  fn every_aspect_ratio_maps_to_wire_string() {
    for (variant, expected) in [
      (Veo2TextToVideoAspectRatio::NineBySixteen, "9:16"),
      (Veo2TextToVideoAspectRatio::SixteenByNine, "16:9"),
      (Veo2TextToVideoAspectRatio::Square, "1:1"),
    ] {
      assert_eq!(variant.to_str(), expected);
    }
  }

  #[test]
  fn every_duration_maps_to_wire_string_and_seconds() {
    for (variant, s, secs) in [
      (Veo2TextToVideoDuration::FiveSeconds, "5s", 5),
      (Veo2TextToVideoDuration::SixSeconds, "6s", 6),
      (Veo2TextToVideoDuration::SevenSeconds, "7s", 7),
      (Veo2TextToVideoDuration::EightSeconds, "8s", 8),
    ] {
      assert_eq!(variant.to_str(), s);
      assert_eq!(variant.to_seconds(), secs);
    }
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(Veo2TextToVideoRequest::ENDPOINT, "fal-ai/veo2");
  }

  // NB: Pricing tests are in cost.rs
}

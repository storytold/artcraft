use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::text::veo_3::raw_request::{
  Veo3TextToVideoInput, Veo3TextToVideoOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Veo3TextToVideoRequest {
  /// Text prompt describing the video to generate.
  pub prompt: String,

  /// Aspect ratio. fal's default is `16:9` when `None`.
  pub aspect_ratio: Option<Veo3TextToVideoAspectRatio>,

  /// Video duration. fal's default is `8s` when `None`.
  pub duration: Option<Veo3TextToVideoDuration>,

  /// Output resolution. fal's default is `720p` when `None`.
  pub resolution: Option<Veo3TextToVideoResolution>,

  /// Optional negative prompt.
  pub negative_prompt: Option<String>,

  /// Whether to generate native audio. fal's server default is `true` when
  /// this is `None`.
  pub generate_audio: Option<bool>,

  /// Seed for the random number generator.
  pub seed: Option<i64>,

  /// Whether to auto-rewrite prompts that fail moderation. fal's default is
  /// `true` for text-to-video when `None`.
  pub auto_fix: Option<bool>,

  /// Safety tolerance. fal's default is `4` when `None`.
  pub safety_tolerance: Option<Veo3TextToVideoSafetyTolerance>,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Veo3TextToVideoAspectRatio {
  SixteenByNine,
  NineBySixteen,
}

impl Veo3TextToVideoAspectRatio {
  fn to_str(&self) -> &'static str {
    match self {
      Self::SixteenByNine => "16:9",
      Self::NineBySixteen => "9:16",
    }
  }
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Veo3TextToVideoDuration {
  FourSeconds,
  SixSeconds,
  EightSeconds,
}

impl Veo3TextToVideoDuration {
  pub fn to_seconds(&self) -> u64 {
    match self {
      Self::FourSeconds => 4,
      Self::SixSeconds => 6,
      Self::EightSeconds => 8,
    }
  }

  fn to_str(&self) -> &'static str {
    match self {
      Self::FourSeconds => "4s",
      Self::SixSeconds => "6s",
      Self::EightSeconds => "8s",
    }
  }
}

/// Veo 3 exposes only 720p/1080p (no 4k tier).
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Veo3TextToVideoResolution {
  SevenTwentyP,
  TenEightyP,
}

impl Veo3TextToVideoResolution {
  fn to_str(&self) -> &'static str {
    match self {
      Self::SevenTwentyP => "720p",
      Self::TenEightyP => "1080p",
    }
  }
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Veo3TextToVideoSafetyTolerance {
  /// "1" — strictest.
  Level1,
  Level2,
  Level3,
  /// "4" — fal default.
  Level4,
  Level5,
  /// "6" — least strict.
  Level6,
}

impl Veo3TextToVideoSafetyTolerance {
  fn to_str(&self) -> &'static str {
    match self {
      Self::Level1 => "1",
      Self::Level2 => "2",
      Self::Level3 => "3",
      Self::Level4 => "4",
      Self::Level5 => "5",
      Self::Level6 => "6",
    }
  }
}

impl FalEndpoint for Veo3TextToVideoRequest {
  const ENDPOINT: &str = "fal-ai/veo3";

  type RawRequest = Veo3TextToVideoInput;
  type RawResponse = Veo3TextToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      aspect_ratio: self.aspect_ratio.map(|ar| ar.to_str().to_string()),
      duration: self.duration.map(|d| d.to_str().to_string()),
      negative_prompt: self.negative_prompt.clone(),
      resolution: self.resolution.map(|r| r.to_str().to_string()),
      generate_audio: self.generate_audio,
      seed: self.seed,
      auto_fix: self.auto_fix,
      safety_tolerance: self.safety_tolerance.map(|s| s.to_str().to_string()),
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

    let request = Veo3TextToVideoRequest {
      prompt: "a golden retriever puppy chases butterflies through a sunlit meadow".to_string(),
      aspect_ratio: Some(Veo3TextToVideoAspectRatio::SixteenByNine),
      duration: Some(Veo3TextToVideoDuration::FourSeconds),
      resolution: Some(Veo3TextToVideoResolution::SevenTwentyP),
      negative_prompt: None,
      generate_audio: Some(true),
      seed: None,
      auto_fix: None,
      safety_tolerance: None,
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

    let request = Veo3TextToVideoRequest {
      prompt: "a wave crashes against a rocky shoreline at sunset".to_string(),
      aspect_ratio: Some(Veo3TextToVideoAspectRatio::SixteenByNine),
      duration: Some(Veo3TextToVideoDuration::FourSeconds),
      resolution: Some(Veo3TextToVideoResolution::SevenTwentyP),
      negative_prompt: None,
      generate_audio: Some(false),
      seed: None,
      auto_fix: None,
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
    let request = Veo3TextToVideoRequest {
      prompt: "p".to_string(),
      aspect_ratio: Some(Veo3TextToVideoAspectRatio::NineBySixteen),
      duration: Some(Veo3TextToVideoDuration::EightSeconds),
      resolution: Some(Veo3TextToVideoResolution::TenEightyP),
      negative_prompt: Some("blurry".to_string()),
      generate_audio: Some(true),
      seed: Some(42),
      auto_fix: Some(false),
      safety_tolerance: Some(Veo3TextToVideoSafetyTolerance::Level6),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert_eq!(raw.aspect_ratio.as_deref(), Some("9:16"));
    assert_eq!(raw.duration.as_deref(), Some("8s"));
    assert_eq!(raw.resolution.as_deref(), Some("1080p"));
    assert_eq!(raw.negative_prompt.as_deref(), Some("blurry"));
    assert_eq!(raw.generate_audio, Some(true));
    assert_eq!(raw.seed, Some(42));
    assert_eq!(raw.auto_fix, Some(false));
    assert_eq!(raw.safety_tolerance.as_deref(), Some("6"));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Veo3TextToVideoRequest {
      prompt: "minimal".to_string(),
      aspect_ratio: None,
      duration: None,
      resolution: None,
      negative_prompt: None,
      generate_audio: None,
      seed: None,
      auto_fix: None,
      safety_tolerance: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({ "prompt": "minimal" }));
  }

  #[test]
  fn every_duration_maps_to_wire_string_and_seconds() {
    for (variant, s, secs) in [
      (Veo3TextToVideoDuration::FourSeconds, "4s", 4),
      (Veo3TextToVideoDuration::SixSeconds, "6s", 6),
      (Veo3TextToVideoDuration::EightSeconds, "8s", 8),
    ] {
      assert_eq!(variant.to_str(), s);
      assert_eq!(variant.to_seconds(), secs);
    }
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(Veo3TextToVideoRequest::ENDPOINT, "fal-ai/veo3");
  }

  // NB: Pricing tests are in cost.rs
}

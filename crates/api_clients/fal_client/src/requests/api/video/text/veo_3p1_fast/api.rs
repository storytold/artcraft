use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::text::veo_3p1_fast::raw_request::{
  Veo3p1FastTextToVideoInput, Veo3p1FastTextToVideoOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Veo3p1FastTextToVideoRequest {
  /// Text prompt describing the video to generate.
  pub prompt: String,

  /// Aspect ratio. fal's default is `16:9` when `None`.
  pub aspect_ratio: Option<Veo3p1FastTextToVideoAspectRatio>,

  /// Video duration. fal's default is `8s` when `None`.
  pub duration: Option<Veo3p1FastTextToVideoDuration>,

  /// Output resolution. fal's default is `720p` when `None`.
  pub resolution: Option<Veo3p1FastTextToVideoResolution>,

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
  pub safety_tolerance: Option<Veo3p1FastTextToVideoSafetyTolerance>,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Veo3p1FastTextToVideoAspectRatio {
  SixteenByNine,
  NineBySixteen,
}

impl Veo3p1FastTextToVideoAspectRatio {
  fn to_str(&self) -> &'static str {
    match self {
      Self::SixteenByNine => "16:9",
      Self::NineBySixteen => "9:16",
    }
  }
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Veo3p1FastTextToVideoDuration {
  FourSeconds,
  SixSeconds,
  EightSeconds,
}

impl Veo3p1FastTextToVideoDuration {
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

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Veo3p1FastTextToVideoResolution {
  SevenTwentyP,
  TenEightyP,
  FourK,
}

impl Veo3p1FastTextToVideoResolution {
  /// 4k output is billed at a higher per-second rate than 720p/1080p.
  pub fn is_four_k(&self) -> bool {
    matches!(self, Self::FourK)
  }

  fn to_str(&self) -> &'static str {
    match self {
      Self::SevenTwentyP => "720p",
      Self::TenEightyP => "1080p",
      Self::FourK => "4k",
    }
  }
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Veo3p1FastTextToVideoSafetyTolerance {
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

impl Veo3p1FastTextToVideoSafetyTolerance {
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

impl FalEndpoint for Veo3p1FastTextToVideoRequest {
  const ENDPOINT: &str = "fal-ai/veo3.1/fast";

  type RawRequest = Veo3p1FastTextToVideoInput;
  type RawResponse = Veo3p1FastTextToVideoOutput;

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

    let request = Veo3p1FastTextToVideoRequest {
      prompt: "a golden retriever puppy chases butterflies through a sunlit meadow".to_string(),
      aspect_ratio: Some(Veo3p1FastTextToVideoAspectRatio::SixteenByNine),
      duration: Some(Veo3p1FastTextToVideoDuration::FourSeconds),
      resolution: Some(Veo3p1FastTextToVideoResolution::SevenTwentyP),
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

    let request = Veo3p1FastTextToVideoRequest {
      prompt: "a wave crashes against a rocky shoreline at sunset".to_string(),
      aspect_ratio: Some(Veo3p1FastTextToVideoAspectRatio::SixteenByNine),
      duration: Some(Veo3p1FastTextToVideoDuration::FourSeconds),
      resolution: Some(Veo3p1FastTextToVideoResolution::SevenTwentyP),
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
    let request = Veo3p1FastTextToVideoRequest {
      prompt: "p".to_string(),
      aspect_ratio: Some(Veo3p1FastTextToVideoAspectRatio::NineBySixteen),
      duration: Some(Veo3p1FastTextToVideoDuration::EightSeconds),
      resolution: Some(Veo3p1FastTextToVideoResolution::FourK),
      negative_prompt: Some("blurry".to_string()),
      generate_audio: Some(true),
      seed: Some(42),
      auto_fix: Some(false),
      safety_tolerance: Some(Veo3p1FastTextToVideoSafetyTolerance::Level6),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert_eq!(raw.aspect_ratio.as_deref(), Some("9:16"));
    assert_eq!(raw.duration.as_deref(), Some("8s"));
    assert_eq!(raw.resolution.as_deref(), Some("4k"));
    assert_eq!(raw.negative_prompt.as_deref(), Some("blurry"));
    assert_eq!(raw.generate_audio, Some(true));
    assert_eq!(raw.seed, Some(42));
    assert_eq!(raw.auto_fix, Some(false));
    assert_eq!(raw.safety_tolerance.as_deref(), Some("6"));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Veo3p1FastTextToVideoRequest {
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
    // Minimal payload must be literally `{"prompt": "minimal"}`.
    assert_eq!(json, serde_json::json!({ "prompt": "minimal" }));
  }

  #[test]
  fn every_aspect_ratio_maps_to_wire_string() {
    for (variant, expected) in [
      (Veo3p1FastTextToVideoAspectRatio::SixteenByNine, "16:9"),
      (Veo3p1FastTextToVideoAspectRatio::NineBySixteen, "9:16"),
    ] {
      assert_eq!(variant.to_str(), expected);
    }
  }

  #[test]
  fn every_duration_maps_to_wire_string_and_seconds() {
    for (variant, s, secs) in [
      (Veo3p1FastTextToVideoDuration::FourSeconds, "4s", 4),
      (Veo3p1FastTextToVideoDuration::SixSeconds, "6s", 6),
      (Veo3p1FastTextToVideoDuration::EightSeconds, "8s", 8),
    ] {
      assert_eq!(variant.to_str(), s);
      assert_eq!(variant.to_seconds(), secs);
    }
  }

  #[test]
  fn every_resolution_maps_to_wire_string() {
    for (variant, expected, four_k) in [
      (Veo3p1FastTextToVideoResolution::SevenTwentyP, "720p", false),
      (Veo3p1FastTextToVideoResolution::TenEightyP, "1080p", false),
      (Veo3p1FastTextToVideoResolution::FourK, "4k", true),
    ] {
      assert_eq!(variant.to_str(), expected);
      assert_eq!(variant.is_four_k(), four_k);
    }
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(Veo3p1FastTextToVideoRequest::ENDPOINT, "fal-ai/veo3.1/fast");
  }

  // NB: Pricing tests are in cost.rs
}

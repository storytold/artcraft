use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::extend::veo_3p1_fast::raw_request::{
  Veo3p1FastExtendVideoInput, Veo3p1FastExtendVideoOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Veo3p1FastExtendVideoRequest {
  /// Text prompt describing how the video should be extended.
  pub prompt: String,

  /// URL of the video to extend (720p/1080p, 16:9 or 9:16).
  pub video_url: String,

  /// Aspect ratio. fal's default is `auto` when `None`.
  pub aspect_ratio: Option<Veo3p1FastExtendVideoAspectRatio>,

  /// Extension duration. fal's default is `7s` when `None`.
  pub duration: Option<Veo3p1FastExtendVideoDuration>,

  /// Output resolution. fal's default is `720p` when `None`.
  pub resolution: Option<Veo3p1FastExtendVideoResolution>,

  /// Optional negative prompt.
  pub negative_prompt: Option<String>,

  /// Whether to generate native audio. fal's server default is `true` when
  /// this is `None`.
  pub generate_audio: Option<bool>,

  /// Seed for the random number generator.
  pub seed: Option<i64>,

  /// Whether to auto-rewrite prompts that fail moderation. fal's default is
  /// `false` when `None`.
  pub auto_fix: Option<bool>,

  /// Safety tolerance. fal's default is `4` when `None`.
  pub safety_tolerance: Option<Veo3p1FastExtendVideoSafetyTolerance>,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Veo3p1FastExtendVideoAspectRatio {
  Auto,
  SixteenByNine,
  NineBySixteen,
}

impl Veo3p1FastExtendVideoAspectRatio {
  fn to_str(&self) -> &'static str {
    match self {
      Self::Auto => "auto",
      Self::SixteenByNine => "16:9",
      Self::NineBySixteen => "9:16",
    }
  }
}

/// Extension duration. fal documents only the `7s` default for extend-video
/// (no explicit enum). We expose `7s` plus the standard Veo 3.1 Fast family
/// durations (`4s`/`6s`/`8s`) so callers stay strongly typed; if fal rejects
/// a value, trim this enum.
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Veo3p1FastExtendVideoDuration {
  FourSeconds,
  SixSeconds,
  /// fal's documented default for extend-video.
  SevenSeconds,
  EightSeconds,
}

impl Veo3p1FastExtendVideoDuration {
  pub fn to_seconds(&self) -> u64 {
    match self {
      Self::FourSeconds => 4,
      Self::SixSeconds => 6,
      Self::SevenSeconds => 7,
      Self::EightSeconds => 8,
    }
  }

  fn to_str(&self) -> &'static str {
    match self {
      Self::FourSeconds => "4s",
      Self::SixSeconds => "6s",
      Self::SevenSeconds => "7s",
      Self::EightSeconds => "8s",
    }
  }
}

/// Extend-video documents only 720p/1080p (no 4k tier), so this enum omits 4k.
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Veo3p1FastExtendVideoResolution {
  SevenTwentyP,
  TenEightyP,
}

impl Veo3p1FastExtendVideoResolution {
  fn to_str(&self) -> &'static str {
    match self {
      Self::SevenTwentyP => "720p",
      Self::TenEightyP => "1080p",
    }
  }
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Veo3p1FastExtendVideoSafetyTolerance {
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

impl Veo3p1FastExtendVideoSafetyTolerance {
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

impl FalEndpoint for Veo3p1FastExtendVideoRequest {
  const ENDPOINT: &str = "fal-ai/veo3.1/fast/extend-video";

  type RawRequest = Veo3p1FastExtendVideoInput;
  type RawResponse = Veo3p1FastExtendVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      video_url: self.video_url.clone(),
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
  use test_data::web::video_urls::ANGRY_SHIBA_VIDEO_URL;

  // ── Real requests (manually run; require a live key and cost money) ──

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_extend_video_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Veo3p1FastExtendVideoRequest {
      prompt: "the scene continues naturally, keeping the same motion and style".to_string(),
      video_url: ANGRY_SHIBA_VIDEO_URL.to_string(),
      aspect_ratio: None,
      duration: Some(Veo3p1FastExtendVideoDuration::SevenSeconds),
      resolution: Some(Veo3p1FastExtendVideoResolution::SevenTwentyP),
      negative_prompt: None,
      generate_audio: Some(false),
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
  async fn test_extend_video_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Veo3p1FastExtendVideoRequest {
      prompt: "the camera pulls back to reveal more of the landscape".to_string(),
      video_url: ANGRY_SHIBA_VIDEO_URL.to_string(),
      aspect_ratio: None,
      duration: Some(Veo3p1FastExtendVideoDuration::SevenSeconds),
      resolution: Some(Veo3p1FastExtendVideoResolution::SevenTwentyP),
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
    let request = Veo3p1FastExtendVideoRequest {
      prompt: "p".to_string(),
      video_url: "https://example.com/in.mp4".to_string(),
      aspect_ratio: Some(Veo3p1FastExtendVideoAspectRatio::SixteenByNine),
      duration: Some(Veo3p1FastExtendVideoDuration::SevenSeconds),
      resolution: Some(Veo3p1FastExtendVideoResolution::TenEightyP),
      negative_prompt: Some("nope".to_string()),
      generate_audio: Some(true),
      seed: Some(3),
      auto_fix: Some(false),
      safety_tolerance: Some(Veo3p1FastExtendVideoSafetyTolerance::Level4),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.video_url, "https://example.com/in.mp4");
    assert_eq!(raw.aspect_ratio.as_deref(), Some("16:9"));
    assert_eq!(raw.duration.as_deref(), Some("7s"));
    assert_eq!(raw.resolution.as_deref(), Some("1080p"));
    assert_eq!(raw.negative_prompt.as_deref(), Some("nope"));
    assert_eq!(raw.generate_audio, Some(true));
    assert_eq!(raw.seed, Some(3));
    assert_eq!(raw.auto_fix, Some(false));
    assert_eq!(raw.safety_tolerance.as_deref(), Some("4"));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Veo3p1FastExtendVideoRequest {
      prompt: "p".to_string(),
      video_url: "https://example.com/in.mp4".to_string(),
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
    assert_eq!(
      json,
      serde_json::json!({ "prompt": "p", "video_url": "https://example.com/in.mp4" }),
    );
  }

  #[test]
  fn every_duration_maps_to_wire_string_and_seconds() {
    for (variant, s, secs) in [
      (Veo3p1FastExtendVideoDuration::FourSeconds, "4s", 4),
      (Veo3p1FastExtendVideoDuration::SixSeconds, "6s", 6),
      (Veo3p1FastExtendVideoDuration::SevenSeconds, "7s", 7),
      (Veo3p1FastExtendVideoDuration::EightSeconds, "8s", 8),
    ] {
      assert_eq!(variant.to_str(), s);
      assert_eq!(variant.to_seconds(), secs);
    }
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(
      Veo3p1FastExtendVideoRequest::ENDPOINT,
      "fal-ai/veo3.1/fast/extend-video",
    );
  }

  // NB: Pricing tests are in cost.rs
}

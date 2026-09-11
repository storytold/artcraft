use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::reference::veo_3p1_fast::raw_request::{
  Veo3p1FastReferenceToVideoInput, Veo3p1FastReferenceToVideoOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Veo3p1FastReferenceToVideoRequest {
  /// Text prompt describing the video to generate.
  pub prompt: String,

  /// Reference image URLs used for consistent subject appearance.
  pub image_urls: Vec<String>,

  /// Aspect ratio. fal's default is `16:9` when `None`.
  pub aspect_ratio: Option<Veo3p1FastReferenceToVideoAspectRatio>,

  /// Video duration. fal's default is `8s` when `None`.
  pub duration: Option<Veo3p1FastReferenceToVideoDuration>,

  /// Output resolution. fal's default is `720p` when `None`.
  pub resolution: Option<Veo3p1FastReferenceToVideoResolution>,

  /// Whether to generate native audio. fal's server default is `true` when
  /// this is `None`.
  pub generate_audio: Option<bool>,

  /// Whether to auto-rewrite prompts that fail moderation. fal's default is
  /// `false` when `None`.
  pub auto_fix: Option<bool>,

  /// Safety tolerance. fal's default is `4` when `None`.
  pub safety_tolerance: Option<Veo3p1FastReferenceToVideoSafetyTolerance>,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Veo3p1FastReferenceToVideoAspectRatio {
  SixteenByNine,
  NineBySixteen,
}

impl Veo3p1FastReferenceToVideoAspectRatio {
  fn to_str(&self) -> &'static str {
    match self {
      Self::SixteenByNine => "16:9",
      Self::NineBySixteen => "9:16",
    }
  }
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Veo3p1FastReferenceToVideoDuration {
  FourSeconds,
  SixSeconds,
  EightSeconds,
}

impl Veo3p1FastReferenceToVideoDuration {
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
pub enum Veo3p1FastReferenceToVideoResolution {
  SevenTwentyP,
  TenEightyP,
  FourK,
}

impl Veo3p1FastReferenceToVideoResolution {
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
pub enum Veo3p1FastReferenceToVideoSafetyTolerance {
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

impl Veo3p1FastReferenceToVideoSafetyTolerance {
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

impl FalEndpoint for Veo3p1FastReferenceToVideoRequest {
  const ENDPOINT: &str = "fal-ai/veo3.1/fast/reference-to-video";

  type RawRequest = Veo3p1FastReferenceToVideoInput;
  type RawResponse = Veo3p1FastReferenceToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      image_urls: self.image_urls.clone(),
      aspect_ratio: self.aspect_ratio.map(|ar| ar.to_str().to_string()),
      duration: self.duration.map(|d| d.to_str().to_string()),
      resolution: self.resolution.map(|r| r.to_str().to_string()),
      generate_audio: self.generate_audio,
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
  use test_data::web::image_urls::{JUNO_AT_LAKE_IMAGE_URL, TALL_MOCHI_WITH_GLASSES_IMAGE_URL};

  // ── Real requests (manually run; require a live key and cost money) ──

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_reference_to_video_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Veo3p1FastReferenceToVideoRequest {
      prompt: "the two dogs run side by side across a sunlit meadow".to_string(),
      image_urls: vec![
        TALL_MOCHI_WITH_GLASSES_IMAGE_URL.to_string(),
        JUNO_AT_LAKE_IMAGE_URL.to_string(),
      ],
      aspect_ratio: Some(Veo3p1FastReferenceToVideoAspectRatio::SixteenByNine),
      duration: Some(Veo3p1FastReferenceToVideoDuration::FourSeconds),
      resolution: Some(Veo3p1FastReferenceToVideoResolution::SevenTwentyP),
      generate_audio: Some(false),
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
  async fn test_reference_to_video_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Veo3p1FastReferenceToVideoRequest {
      prompt: "the dogs play together in a snowy field".to_string(),
      image_urls: vec![TALL_MOCHI_WITH_GLASSES_IMAGE_URL.to_string()],
      aspect_ratio: None,
      duration: Some(Veo3p1FastReferenceToVideoDuration::FourSeconds),
      resolution: Some(Veo3p1FastReferenceToVideoResolution::SevenTwentyP),
      generate_audio: Some(false),
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
    let request = Veo3p1FastReferenceToVideoRequest {
      prompt: "p".to_string(),
      image_urls: vec!["https://example.com/a.png".to_string(), "https://example.com/b.png".to_string()],
      aspect_ratio: Some(Veo3p1FastReferenceToVideoAspectRatio::NineBySixteen),
      duration: Some(Veo3p1FastReferenceToVideoDuration::SixSeconds),
      resolution: Some(Veo3p1FastReferenceToVideoResolution::FourK),
      generate_audio: Some(true),
      auto_fix: Some(false),
      safety_tolerance: Some(Veo3p1FastReferenceToVideoSafetyTolerance::Level5),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.image_urls.len(), 2);
    assert_eq!(raw.aspect_ratio.as_deref(), Some("9:16"));
    assert_eq!(raw.duration.as_deref(), Some("6s"));
    assert_eq!(raw.resolution.as_deref(), Some("4k"));
    assert_eq!(raw.generate_audio, Some(true));
    assert_eq!(raw.auto_fix, Some(false));
    assert_eq!(raw.safety_tolerance.as_deref(), Some("5"));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Veo3p1FastReferenceToVideoRequest {
      prompt: "p".to_string(),
      image_urls: vec!["https://example.com/a.png".to_string()],
      aspect_ratio: None,
      duration: None,
      resolution: None,
      generate_audio: None,
      auto_fix: None,
      safety_tolerance: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({ "prompt": "p", "image_urls": ["https://example.com/a.png"] }),
    );
  }

  /// This endpoint's schema has no `negative_prompt`/`seed` fields, so they
  /// must never appear on the wire regardless of other settings.
  #[test]
  fn raw_request_never_emits_negative_prompt_or_seed() {
    let request = Veo3p1FastReferenceToVideoRequest {
      prompt: "p".to_string(),
      image_urls: vec!["https://example.com/a.png".to_string()],
      aspect_ratio: Some(Veo3p1FastReferenceToVideoAspectRatio::SixteenByNine),
      duration: Some(Veo3p1FastReferenceToVideoDuration::EightSeconds),
      resolution: Some(Veo3p1FastReferenceToVideoResolution::TenEightyP),
      generate_audio: Some(true),
      auto_fix: Some(true),
      safety_tolerance: Some(Veo3p1FastReferenceToVideoSafetyTolerance::Level4),
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert!(json.get("negative_prompt").is_none(), "unexpected negative_prompt: {json}");
    assert!(json.get("seed").is_none(), "unexpected seed: {json}");
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(
      Veo3p1FastReferenceToVideoRequest::ENDPOINT,
      "fal-ai/veo3.1/fast/reference-to-video",
    );
  }

  // NB: Pricing tests are in cost.rs
}

use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::image::veo_3p1_fast::raw_request::{
  Veo3p1FastImageToVideoInput, Veo3p1FastImageToVideoOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Veo3p1FastImageToVideoRequest {
  /// Text prompt describing the video to generate.
  pub prompt: String,

  /// URL of the image used as the starting frame.
  pub image_url: String,

  /// Aspect ratio. fal's default is `auto` when `None`.
  pub aspect_ratio: Option<Veo3p1FastImageToVideoAspectRatio>,

  /// Video duration. fal's default is `8s` when `None`.
  pub duration: Option<Veo3p1FastImageToVideoDuration>,

  /// Output resolution. fal's default is `720p` when `None`.
  pub resolution: Option<Veo3p1FastImageToVideoResolution>,

  /// Whether to generate native audio. fal's server default is `true` when
  /// this is `None`.
  pub generate_audio: Option<bool>,

  /// Optional negative prompt.
  pub negative_prompt: Option<String>,

  /// Seed for the random number generator.
  pub seed: Option<i64>,

  /// Whether to auto-rewrite prompts that fail moderation. fal's default is
  /// `false` for image-to-video when `None`.
  pub auto_fix: Option<bool>,

  /// Safety tolerance. fal's default is `4` when `None`.
  pub safety_tolerance: Option<Veo3p1FastImageToVideoSafetyTolerance>,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Veo3p1FastImageToVideoAspectRatio {
  Auto,
  SixteenByNine,
  NineBySixteen,
}

impl Veo3p1FastImageToVideoAspectRatio {
  fn to_str(&self) -> &'static str {
    match self {
      Self::Auto => "auto",
      Self::SixteenByNine => "16:9",
      Self::NineBySixteen => "9:16",
    }
  }
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Veo3p1FastImageToVideoDuration {
  FourSeconds,
  SixSeconds,
  EightSeconds,
}

impl Veo3p1FastImageToVideoDuration {
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
pub enum Veo3p1FastImageToVideoResolution {
  SevenTwentyP,
  TenEightyP,
  FourK,
}

impl Veo3p1FastImageToVideoResolution {
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
pub enum Veo3p1FastImageToVideoSafetyTolerance {
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

impl Veo3p1FastImageToVideoSafetyTolerance {
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

impl FalEndpoint for Veo3p1FastImageToVideoRequest {
  const ENDPOINT: &str = "fal-ai/veo3.1/fast/image-to-video";

  type RawRequest = Veo3p1FastImageToVideoInput;
  type RawResponse = Veo3p1FastImageToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      image_url: self.image_url.clone(),
      aspect_ratio: self.aspect_ratio.map(|ar| ar.to_str().to_string()),
      duration: self.duration.map(|d| d.to_str().to_string()),
      resolution: self.resolution.map(|r| r.to_str().to_string()),
      generate_audio: self.generate_audio,
      negative_prompt: self.negative_prompt.clone(),
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
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  // ── Real requests (manually run; require a live key and cost money) ──

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_image_to_video_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Veo3p1FastImageToVideoRequest {
      prompt: "the lake comes alive with gentle ripples and dappled sunlight".to_string(),
      image_url: JUNO_AT_LAKE_IMAGE_URL.to_string(),
      aspect_ratio: Some(Veo3p1FastImageToVideoAspectRatio::SixteenByNine),
      duration: Some(Veo3p1FastImageToVideoDuration::FourSeconds),
      resolution: Some(Veo3p1FastImageToVideoResolution::SevenTwentyP),
      generate_audio: Some(false),
      negative_prompt: None,
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
  async fn test_image_to_video_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Veo3p1FastImageToVideoRequest {
      prompt: "wind moves through the trees".to_string(),
      image_url: JUNO_AT_LAKE_IMAGE_URL.to_string(),
      aspect_ratio: None,
      duration: Some(Veo3p1FastImageToVideoDuration::FourSeconds),
      resolution: Some(Veo3p1FastImageToVideoResolution::SevenTwentyP),
      generate_audio: Some(false),
      negative_prompt: None,
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
    let request = Veo3p1FastImageToVideoRequest {
      prompt: "p".to_string(),
      image_url: "https://example.com/start.png".to_string(),
      aspect_ratio: Some(Veo3p1FastImageToVideoAspectRatio::Auto),
      duration: Some(Veo3p1FastImageToVideoDuration::SixSeconds),
      resolution: Some(Veo3p1FastImageToVideoResolution::TenEightyP),
      generate_audio: Some(false),
      negative_prompt: Some("nope".to_string()),
      seed: Some(7),
      auto_fix: Some(true),
      safety_tolerance: Some(Veo3p1FastImageToVideoSafetyTolerance::Level2),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert_eq!(raw.image_url, "https://example.com/start.png");
    assert_eq!(raw.aspect_ratio.as_deref(), Some("auto"));
    assert_eq!(raw.duration.as_deref(), Some("6s"));
    assert_eq!(raw.resolution.as_deref(), Some("1080p"));
    assert_eq!(raw.generate_audio, Some(false));
    assert_eq!(raw.negative_prompt.as_deref(), Some("nope"));
    assert_eq!(raw.seed, Some(7));
    assert_eq!(raw.auto_fix, Some(true));
    assert_eq!(raw.safety_tolerance.as_deref(), Some("2"));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Veo3p1FastImageToVideoRequest {
      prompt: "p".to_string(),
      image_url: "https://example.com/start.png".to_string(),
      aspect_ratio: None,
      duration: None,
      resolution: None,
      generate_audio: None,
      negative_prompt: None,
      seed: None,
      auto_fix: None,
      safety_tolerance: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    // Only the two required fields remain on the wire.
    assert_eq!(
      json,
      serde_json::json!({ "prompt": "p", "image_url": "https://example.com/start.png" }),
    );
  }

  #[test]
  fn every_aspect_ratio_maps_to_wire_string() {
    for (variant, expected) in [
      (Veo3p1FastImageToVideoAspectRatio::Auto, "auto"),
      (Veo3p1FastImageToVideoAspectRatio::SixteenByNine, "16:9"),
      (Veo3p1FastImageToVideoAspectRatio::NineBySixteen, "9:16"),
    ] {
      assert_eq!(variant.to_str(), expected);
    }
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(
      Veo3p1FastImageToVideoRequest::ENDPOINT,
      "fal-ai/veo3.1/fast/image-to-video",
    );
  }

  // NB: Pricing tests are in cost.rs
}

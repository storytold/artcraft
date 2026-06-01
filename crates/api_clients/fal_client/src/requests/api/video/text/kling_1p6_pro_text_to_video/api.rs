use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::text::kling_1p6_pro_text_to_video::raw_request::{
  Kling1p6ProTextToVideoInput, Kling1p6ProTextToVideoOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Kling1p6ProTextToVideoRequest {
  /// Text prompt describing the video to generate.
  pub prompt: String,

  /// Optional negative prompt. fal's default is
  /// `"blur, distort, and low quality"` when this is `None`.
  pub negative_prompt: Option<String>,

  /// Video duration. Kling 1.6 Pro supports 5 or 10 seconds only.
  pub duration: Option<Kling1p6ProTextToVideoDuration>,

  /// Aspect ratio.
  pub aspect_ratio: Option<Kling1p6ProTextToVideoAspectRatio>,

  /// CFG scale. Defaults to fal's `0.5` when `None`.
  pub cfg_scale: Option<f32>,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Kling1p6ProTextToVideoDuration {
  FiveSeconds,
  TenSeconds,
}

impl Kling1p6ProTextToVideoDuration {
  pub fn to_seconds(&self) -> u64 {
    match self {
      Self::FiveSeconds => 5,
      Self::TenSeconds => 10,
    }
  }

  fn to_str(&self) -> &'static str {
    match self {
      Self::FiveSeconds => "5",
      Self::TenSeconds => "10",
    }
  }
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Kling1p6ProTextToVideoAspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
}

impl FalEndpoint for Kling1p6ProTextToVideoRequest {
  const ENDPOINT: &str = "fal-ai/kling-video/v1.6/pro/text-to-video";

  type RawRequest = Kling1p6ProTextToVideoInput;
  type RawResponse = Kling1p6ProTextToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let duration = self.duration.map(|d| d.to_str().to_string());

    let aspect_ratio = self.aspect_ratio.map(|ar| match ar {
      Kling1p6ProTextToVideoAspectRatio::Square => "1:1",
      Kling1p6ProTextToVideoAspectRatio::SixteenByNine => "16:9",
      Kling1p6ProTextToVideoAspectRatio::NineBySixteen => "9:16",
    }.to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      aspect_ratio,
      duration,
      negative_prompt: self.negative_prompt.clone(),
      cfg_scale: self.cfg_scale,
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

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_video_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Kling1p6ProTextToVideoRequest {
      prompt: "a golden retriever puppy chases butterflies through a sunlit meadow, cinematic slow motion".to_string(),
      negative_prompt: None,
      duration: Some(Kling1p6ProTextToVideoDuration::FiveSeconds),
      aspect_ratio: Some(Kling1p6ProTextToVideoAspectRatio::SixteenByNine),
      cfg_scale: None,
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

    let request = Kling1p6ProTextToVideoRequest {
      prompt: "a wave crashes against a rocky shoreline at sunset".to_string(),
      negative_prompt: None,
      duration: Some(Kling1p6ProTextToVideoDuration::FiveSeconds),
      aspect_ratio: Some(Kling1p6ProTextToVideoAspectRatio::SixteenByNine),
      cfg_scale: None,
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_aspect_ratios() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let aspect_ratios = [
      Kling1p6ProTextToVideoAspectRatio::Square,
      Kling1p6ProTextToVideoAspectRatio::SixteenByNine,
      Kling1p6ProTextToVideoAspectRatio::NineBySixteen,
    ];

    for ar in aspect_ratios {
      println!("--- aspect ratio: {:?} ---", ar);
      let request = Kling1p6ProTextToVideoRequest {
        prompt: "a wave crashes against a rocky shoreline at sunset".to_string(),
        negative_prompt: None,
        duration: Some(Kling1p6ProTextToVideoDuration::FiveSeconds),
        aspect_ratio: Some(ar),
        cfg_scale: None,
      };
      let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_durations() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let durations = [
      Kling1p6ProTextToVideoDuration::FiveSeconds,
      Kling1p6ProTextToVideoDuration::TenSeconds,
    ];

    for dur in durations {
      println!("--- duration: {:?} ---", dur);
      let request = Kling1p6ProTextToVideoRequest {
        prompt: "a candle flame flickers in a dark room".to_string(),
        negative_prompt: None,
        duration: Some(dur),
        aspect_ratio: Some(Kling1p6ProTextToVideoAspectRatio::SixteenByNine),
        cfg_scale: None,
      };
      let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  // ── Wire-shape sanity ──

  #[test]
  fn raw_request_aspect_ratio_uses_colon_format() {
    let request = Kling1p6ProTextToVideoRequest {
      prompt: "p".to_string(),
      negative_prompt: None,
      duration: Some(Kling1p6ProTextToVideoDuration::TenSeconds),
      aspect_ratio: Some(Kling1p6ProTextToVideoAspectRatio::NineBySixteen),
      cfg_scale: None,
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.aspect_ratio.as_deref(), Some("9:16"));
    assert_eq!(raw.duration.as_deref(), Some("10"));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Kling1p6ProTextToVideoRequest {
      prompt: "p".to_string(),
      negative_prompt: None,
      duration: None,
      aspect_ratio: None,
      cfg_scale: None,
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert!(raw.aspect_ratio.is_none());
    assert!(raw.duration.is_none());
    assert!(raw.negative_prompt.is_none());
    assert!(raw.cfg_scale.is_none());
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(
      Kling1p6ProTextToVideoRequest::ENDPOINT,
      "fal-ai/kling-video/v1.6/pro/text-to-video",
    );
  }

  // NB: Pricing tests are in cost.rs
}

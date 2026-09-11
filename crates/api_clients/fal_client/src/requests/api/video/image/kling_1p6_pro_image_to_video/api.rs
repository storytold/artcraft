use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::image::kling_1p6_pro_image_to_video::raw_request::{
  Kling1p6ProImageToVideoInput, Kling1p6ProImageToVideoOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Kling1p6ProImageToVideoRequest {
  /// Text prompt describing the video to generate.
  pub prompt: String,

  /// Starting frame image URL.
  pub image_url: String,

  /// Optional end-frame image URL.
  pub end_image_url: Option<String>,

  /// Optional negative prompt. fal's default is
  /// `"blur, distort, and low quality"` when this is `None`.
  pub negative_prompt: Option<String>,

  /// Video duration. Kling 1.6 Pro supports 5 or 10 seconds only.
  pub duration: Option<Kling1p6ProImageToVideoDuration>,

  /// Aspect ratio.
  pub aspect_ratio: Option<Kling1p6ProImageToVideoAspectRatio>,

  /// CFG scale. Defaults to fal's `0.5` when `None`.
  pub cfg_scale: Option<f32>,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Kling1p6ProImageToVideoDuration {
  FiveSeconds,
  TenSeconds,
}

impl Kling1p6ProImageToVideoDuration {
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
pub enum Kling1p6ProImageToVideoAspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
}

impl FalEndpoint for Kling1p6ProImageToVideoRequest {
  const ENDPOINT: &str = "fal-ai/kling-video/v1.6/pro/image-to-video";

  type RawRequest = Kling1p6ProImageToVideoInput;
  type RawResponse = Kling1p6ProImageToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let duration = self.duration.map(|d| d.to_str().to_string());

    let aspect_ratio = self.aspect_ratio.map(|ar| match ar {
      Kling1p6ProImageToVideoAspectRatio::Square => "1:1",
      Kling1p6ProImageToVideoAspectRatio::SixteenByNine => "16:9",
      Kling1p6ProImageToVideoAspectRatio::NineBySixteen => "9:16",
    }.to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      image_url: self.image_url.clone(),
      // fal's schema names this `tail_image_url`; our public API uses
      // `end_image_url` for consistency with the other Kling modules.
      tail_image_url: self.end_image_url.clone(),
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
  use test_data::web::image_urls::{JUNO_AT_LAKE_IMAGE_URL, TALL_MOCHI_WITH_GLASSES_IMAGE_URL};

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_image_to_video_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Kling1p6ProImageToVideoRequest {
      prompt: "shiba in glasses runs to the lake and stands by the shore".to_string(),
      image_url: TALL_MOCHI_WITH_GLASSES_IMAGE_URL.to_string(),
      end_image_url: Some(JUNO_AT_LAKE_IMAGE_URL.to_string()),
      negative_prompt: None,
      duration: Some(Kling1p6ProImageToVideoDuration::FiveSeconds),
      aspect_ratio: Some(Kling1p6ProImageToVideoAspectRatio::SixteenByNine),
      cfg_scale: None,
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

    let request = Kling1p6ProImageToVideoRequest {
      prompt: "shiba bounds across the meadow chasing a falling leaf".to_string(),
      image_url: TALL_MOCHI_WITH_GLASSES_IMAGE_URL.to_string(),
      end_image_url: None,
      negative_prompt: None,
      duration: Some(Kling1p6ProImageToVideoDuration::FiveSeconds),
      aspect_ratio: Some(Kling1p6ProImageToVideoAspectRatio::SixteenByNine),
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
      Kling1p6ProImageToVideoAspectRatio::Square,
      Kling1p6ProImageToVideoAspectRatio::SixteenByNine,
      Kling1p6ProImageToVideoAspectRatio::NineBySixteen,
    ];

    for ar in aspect_ratios {
      println!("--- aspect ratio: {:?} ---", ar);
      let request = Kling1p6ProImageToVideoRequest {
        prompt: "shiba bounds across the meadow chasing a falling leaf".to_string(),
        image_url: TALL_MOCHI_WITH_GLASSES_IMAGE_URL.to_string(),
        end_image_url: None,
        negative_prompt: None,
        duration: Some(Kling1p6ProImageToVideoDuration::FiveSeconds),
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
      Kling1p6ProImageToVideoDuration::FiveSeconds,
      Kling1p6ProImageToVideoDuration::TenSeconds,
    ];

    for dur in durations {
      println!("--- duration: {:?} ---", dur);
      let request = Kling1p6ProImageToVideoRequest {
        prompt: "shiba bounds across the meadow chasing a falling leaf".to_string(),
        image_url: TALL_MOCHI_WITH_GLASSES_IMAGE_URL.to_string(),
        end_image_url: None,
        negative_prompt: None,
        duration: Some(dur),
        aspect_ratio: Some(Kling1p6ProImageToVideoAspectRatio::SixteenByNine),
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
    let request = Kling1p6ProImageToVideoRequest {
      prompt: "p".to_string(),
      image_url: "https://example.com/i.png".to_string(),
      end_image_url: None,
      negative_prompt: None,
      duration: Some(Kling1p6ProImageToVideoDuration::FiveSeconds),
      aspect_ratio: Some(Kling1p6ProImageToVideoAspectRatio::SixteenByNine),
      cfg_scale: None,
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.aspect_ratio.as_deref(), Some("16:9"));
    assert_eq!(raw.duration.as_deref(), Some("5"));
  }

  #[test]
  fn raw_request_translates_end_image_url_to_tail_image_url() {
    let request = Kling1p6ProImageToVideoRequest {
      prompt: "p".to_string(),
      image_url: "https://example.com/i.png".to_string(),
      end_image_url: Some("https://example.com/end.png".to_string()),
      negative_prompt: None,
      duration: None,
      aspect_ratio: None,
      cfg_scale: None,
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.tail_image_url.as_deref(), Some("https://example.com/end.png"));
  }

  // NB: Pricing tests are in cost.rs
}

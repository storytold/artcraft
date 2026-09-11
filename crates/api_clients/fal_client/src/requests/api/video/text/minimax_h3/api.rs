use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::text::minimax_h3::raw_request::{
  MinimaxH3TextToVideoInput, MinimaxH3TextToVideoOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct MinimaxH3TextToVideoRequest {
  /// Text prompt (1 to 7000 characters).
  pub prompt: String,

  /// Duration in seconds. Valid range 5–15; fal's default is `5` when `None`.
  pub duration: Option<u8>,

  /// Output resolution. fal's default is `2K` when `None`.
  pub resolution: Option<MinimaxH3Resolution>,

  /// Aspect ratio. fal's default is `16:9` when `None`.
  pub aspect_ratio: Option<MinimaxH3TextToVideoAspectRatio>,
}

/// MiniMax H3 (Hailuo-03) resolutions. 2K bills at a higher per-second rate
/// than 768P (see the cost module). Shared by the text + image + reference
/// modalities.
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum MinimaxH3Resolution {
  SevenSixtyEightP,
  TwoK,
}

impl MinimaxH3Resolution {
  /// 2K is billed at the higher per-second rate.
  pub fn is_2k(&self) -> bool {
    matches!(self, Self::TwoK)
  }

  pub(crate) fn to_str(&self) -> &'static str {
    match self {
      Self::SevenSixtyEightP => "768P",
      Self::TwoK => "2K",
    }
  }
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum MinimaxH3TextToVideoAspectRatio {
  TwentyOneByNine,
  SixteenByNine,
  FourByThree,
  Square,
  ThreeByFour,
  NineBySixteen,
}

impl MinimaxH3TextToVideoAspectRatio {
  fn to_str(&self) -> &'static str {
    match self {
      Self::TwentyOneByNine => "21:9",
      Self::SixteenByNine => "16:9",
      Self::FourByThree => "4:3",
      Self::Square => "1:1",
      Self::ThreeByFour => "3:4",
      Self::NineBySixteen => "9:16",
    }
  }
}

impl FalEndpoint for MinimaxH3TextToVideoRequest {
  const ENDPOINT: &str = "minimax/h3/text-to-video";

  type RawRequest = MinimaxH3TextToVideoInput;
  type RawResponse = MinimaxH3TextToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
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

  // ── Real requests (manually run; require a live key and cost money) ──

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_video_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = MinimaxH3TextToVideoRequest {
      prompt: "a white kitten chases a butterfly across a sunlit garden".to_string(),
      duration: Some(5),
      resolution: Some(MinimaxH3Resolution::SevenSixtyEightP),
      aspect_ratio: Some(MinimaxH3TextToVideoAspectRatio::SixteenByNine),
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

    let request = MinimaxH3TextToVideoRequest {
      prompt: "a wave crashes against a rocky shoreline at sunset".to_string(),
      duration: Some(5),
      resolution: Some(MinimaxH3Resolution::SevenSixtyEightP),
      aspect_ratio: Some(MinimaxH3TextToVideoAspectRatio::SixteenByNine),
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // ── Wire-shape sanity (no API calls) ──

  #[test]
  fn raw_request_maps_all_fields() {
    let request = MinimaxH3TextToVideoRequest {
      prompt: "p".to_string(),
      duration: Some(12),
      resolution: Some(MinimaxH3Resolution::TwoK),
      aspect_ratio: Some(MinimaxH3TextToVideoAspectRatio::FourByThree),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert_eq!(raw.duration, Some(12));
    assert_eq!(raw.resolution.as_deref(), Some("2K"));
    assert_eq!(raw.aspect_ratio.as_deref(), Some("4:3"));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = MinimaxH3TextToVideoRequest {
      prompt: "minimal".to_string(),
      duration: None,
      resolution: None,
      aspect_ratio: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({ "prompt": "minimal" }));
  }

  #[test]
  fn every_resolution_maps_to_wire_string() {
    for (variant, expected, is_2k) in [
      (MinimaxH3Resolution::SevenSixtyEightP, "768P", false),
      (MinimaxH3Resolution::TwoK, "2K", true),
    ] {
      assert_eq!(variant.to_str(), expected);
      assert_eq!(variant.is_2k(), is_2k);
    }
  }

  #[test]
  fn every_aspect_ratio_maps_to_wire_string() {
    for (variant, expected) in [
      (MinimaxH3TextToVideoAspectRatio::TwentyOneByNine, "21:9"),
      (MinimaxH3TextToVideoAspectRatio::SixteenByNine, "16:9"),
      (MinimaxH3TextToVideoAspectRatio::FourByThree, "4:3"),
      (MinimaxH3TextToVideoAspectRatio::Square, "1:1"),
      (MinimaxH3TextToVideoAspectRatio::ThreeByFour, "3:4"),
      (MinimaxH3TextToVideoAspectRatio::NineBySixteen, "9:16"),
    ] {
      assert_eq!(variant.to_str(), expected);
    }
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(MinimaxH3TextToVideoRequest::ENDPOINT, "minimax/h3/text-to-video");
  }

  // NB: Pricing tests are in cost.rs
}

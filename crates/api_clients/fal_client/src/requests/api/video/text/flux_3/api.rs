use std::fmt;

use serde::de::{self, Visitor};
use serde::{Deserialize, Deserializer, Serialize, Serializer};

use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::text::flux_3::raw_request::{
  Flux3TextToVideoInput, Flux3TextToVideoOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Flux3TextToVideoRequest {
  /// Text prompt for video generation.
  pub prompt: String,

  /// Duration in seconds. fal's default is `auto` when `None` (the model
  /// picks a duration that fits the prompt).
  pub duration: Option<Flux3Duration>,

  /// Output resolution. fal's default is `720p` when `None`.
  pub resolution: Option<Flux3Resolution>,

  /// Aspect ratio. fal's default is `auto` when `None`.
  pub aspect_ratio: Option<Flux3AspectRatio>,

  /// Whether to generate synchronized audio. fal's default is `true` when
  /// `None`. Audio does not affect the bill.
  pub generate_audio: Option<bool>,

  /// Safety tolerance, 0 (strictest) to 4 (most permissive). fal's default is
  /// `2` when `None`.
  pub safety_tolerance: Option<u8>,
}

/// Flux 3 durations: either `auto` (the model decides) or a whole number of
/// seconds in 5–20. Serializes as the string `"auto"` or a bare integer.
/// Shared by every Flux 3 / Flux 3 Draft video modality.
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Flux3Duration {
  Auto,
  Seconds(u8),
}

/// Flux 3 resolutions. 1080p bills at a higher per-second rate than 720p (see
/// the cost modules). Draft endpoints always render 720p and take no
/// resolution input. Shared by every full-quality Flux 3 video modality.
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Flux3Resolution {
  SevenTwentyP,
  TenEightyP,
}

/// Flux 3 aspect ratios. `auto` derives the ratio from the inputs (or the
/// prompt for text-to-video). Shared by every Flux 3 / Flux 3 Draft video
/// modality.
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Flux3AspectRatio {
  Auto,
  TwentyOneByNine,
  TwoByOne,
  SixteenByNine,
  FourByThree,
  Square,
  ThreeByFour,
  NineBySixteen,
}

impl Serialize for Flux3Duration {
  fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
    match self {
      Self::Auto => serializer.serialize_str("auto"),
      Self::Seconds(seconds) => serializer.serialize_u8(*seconds),
    }
  }
}

impl<'de> Deserialize<'de> for Flux3Duration {
  fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
    struct Flux3DurationVisitor;

    impl Visitor<'_> for Flux3DurationVisitor {
      type Value = Flux3Duration;

      fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
        formatter.write_str("the string \"auto\" or an integer number of seconds")
      }

      fn visit_str<E: de::Error>(self, value: &str) -> Result<Flux3Duration, E> {
        if value == "auto" {
          Ok(Flux3Duration::Auto)
        } else {
          Err(E::invalid_value(de::Unexpected::Str(value), &self))
        }
      }

      fn visit_u64<E: de::Error>(self, value: u64) -> Result<Flux3Duration, E> {
        u8::try_from(value)
          .map(Flux3Duration::Seconds)
          .map_err(|_| E::invalid_value(de::Unexpected::Unsigned(value), &self))
      }

      fn visit_i64<E: de::Error>(self, value: i64) -> Result<Flux3Duration, E> {
        u8::try_from(value)
          .map(Flux3Duration::Seconds)
          .map_err(|_| E::invalid_value(de::Unexpected::Signed(value), &self))
      }
    }

    deserializer.deserialize_any(Flux3DurationVisitor)
  }
}

impl Flux3Resolution {
  /// 1080p is billed at the higher per-second rate.
  pub fn is_1080p(&self) -> bool {
    matches!(self, Self::TenEightyP)
  }

  pub(crate) fn to_str(&self) -> &'static str {
    match self {
      Self::SevenTwentyP => "720p",
      Self::TenEightyP => "1080p",
    }
  }
}

impl Flux3AspectRatio {
  pub(crate) fn to_str(&self) -> &'static str {
    match self {
      Self::Auto => "auto",
      Self::TwentyOneByNine => "21:9",
      Self::TwoByOne => "2:1",
      Self::SixteenByNine => "16:9",
      Self::FourByThree => "4:3",
      Self::Square => "1:1",
      Self::ThreeByFour => "3:4",
      Self::NineBySixteen => "9:16",
    }
  }
}

impl FalEndpoint for Flux3TextToVideoRequest {
  const ENDPOINT: &str = "blackforestlabs/flux-3/text-to-video";

  type RawRequest = Flux3TextToVideoInput;
  type RawResponse = Flux3TextToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      duration: self.duration,
      resolution: self.resolution.map(|r| r.to_str().to_string()),
      aspect_ratio: self.aspect_ratio.map(|ar| ar.to_str().to_string()),
      generate_audio: self.generate_audio,
      safety_tolerance: self.safety_tolerance,
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

    let request = Flux3TextToVideoRequest {
      prompt: "a white kitten chases a butterfly across a sunlit garden".to_string(),
      duration: Some(Flux3Duration::Seconds(5)),
      resolution: Some(Flux3Resolution::SevenTwentyP),
      aspect_ratio: Some(Flux3AspectRatio::SixteenByNine),
      generate_audio: Some(false),
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

    let request = Flux3TextToVideoRequest {
      prompt: "a wave crashes against a rocky shoreline at sunset".to_string(),
      duration: Some(Flux3Duration::Seconds(5)),
      resolution: Some(Flux3Resolution::SevenTwentyP),
      aspect_ratio: Some(Flux3AspectRatio::SixteenByNine),
      generate_audio: Some(false),
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
    let request = Flux3TextToVideoRequest {
      prompt: "p".to_string(),
      duration: Some(Flux3Duration::Seconds(12)),
      resolution: Some(Flux3Resolution::TenEightyP),
      aspect_ratio: Some(Flux3AspectRatio::TwoByOne),
      generate_audio: Some(false),
      safety_tolerance: Some(4),
    };
    let raw = request.to_raw_request().unwrap();
    assert_eq!(raw.prompt, "p");
    assert_eq!(raw.duration, Some(Flux3Duration::Seconds(12)));
    assert_eq!(raw.resolution.as_deref(), Some("1080p"));
    assert_eq!(raw.aspect_ratio.as_deref(), Some("2:1"));
    assert_eq!(raw.generate_audio, Some(false));
    assert_eq!(raw.safety_tolerance, Some(4));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Flux3TextToVideoRequest {
      prompt: "minimal".to_string(),
      duration: None,
      resolution: None,
      aspect_ratio: None,
      generate_audio: None,
      safety_tolerance: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({ "prompt": "minimal" }));
  }

  #[test]
  fn duration_serializes_as_auto_string_or_bare_integer() {
    assert_eq!(serde_json::to_value(Flux3Duration::Auto).unwrap(), serde_json::json!("auto"));
    assert_eq!(serde_json::to_value(Flux3Duration::Seconds(12)).unwrap(), serde_json::json!(12));
  }

  #[test]
  fn duration_deserializes_from_auto_string_or_integer() {
    assert_eq!(serde_json::from_value::<Flux3Duration>(serde_json::json!("auto")).unwrap(), Flux3Duration::Auto);
    assert_eq!(serde_json::from_value::<Flux3Duration>(serde_json::json!(7)).unwrap(), Flux3Duration::Seconds(7));
    assert!(serde_json::from_value::<Flux3Duration>(serde_json::json!("fast")).is_err());
  }

  #[test]
  fn every_resolution_maps_to_wire_string() {
    for (variant, expected, is_1080p) in [
      (Flux3Resolution::SevenTwentyP, "720p", false),
      (Flux3Resolution::TenEightyP, "1080p", true),
    ] {
      assert_eq!(variant.to_str(), expected);
      assert_eq!(variant.is_1080p(), is_1080p);
    }
  }

  #[test]
  fn every_aspect_ratio_maps_to_wire_string() {
    for (variant, expected) in [
      (Flux3AspectRatio::Auto, "auto"),
      (Flux3AspectRatio::TwentyOneByNine, "21:9"),
      (Flux3AspectRatio::TwoByOne, "2:1"),
      (Flux3AspectRatio::SixteenByNine, "16:9"),
      (Flux3AspectRatio::FourByThree, "4:3"),
      (Flux3AspectRatio::Square, "1:1"),
      (Flux3AspectRatio::ThreeByFour, "3:4"),
      (Flux3AspectRatio::NineBySixteen, "9:16"),
    ] {
      assert_eq!(variant.to_str(), expected);
    }
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(Flux3TextToVideoRequest::ENDPOINT, "blackforestlabs/flux-3/text-to-video");
  }

  // NB: Pricing tests are in cost.rs
}

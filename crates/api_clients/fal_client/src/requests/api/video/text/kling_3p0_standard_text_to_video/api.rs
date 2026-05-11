use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::video::text::kling_3p0_standard_text_to_video::raw_request::{
  Kling3p0StandardTextToVideoInput, Kling3p0StandardTextToVideoOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Kling3p0StandardTextToVideoRequest {
  /// Text prompt describing the video to generate.
  pub prompt: String,

  /// Whether to generate audio. Defaults to true if not specified.
  pub generate_audio: Option<bool>,

  /// Optional negative prompt.
  pub negative_prompt: Option<String>,

  /// Video duration.
  pub duration: Option<Kling3p0StandardTextToVideoDuration>,

  /// Aspect ratio.
  pub aspect_ratio: Option<Kling3p0StandardTextToVideoAspectRatio>,

  /// Shot type for multi-shot generation.
  pub shot_type: Option<Kling3p0StandardTextToVideoShotType>,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Kling3p0StandardTextToVideoDuration {
  ThreeSeconds,
  FourSeconds,
  FiveSeconds,
  SixSeconds,
  SevenSeconds,
  EightSeconds,
  NineSeconds,
  TenSeconds,
  ElevenSeconds,
  TwelveSeconds,
  ThirteenSeconds,
  FourteenSeconds,
  FifteenSeconds,
}

impl Kling3p0StandardTextToVideoDuration {
  pub fn to_seconds(&self) -> u64 {
    match self {
      Self::ThreeSeconds => 3,
      Self::FourSeconds => 4,
      Self::FiveSeconds => 5,
      Self::SixSeconds => 6,
      Self::SevenSeconds => 7,
      Self::EightSeconds => 8,
      Self::NineSeconds => 9,
      Self::TenSeconds => 10,
      Self::ElevenSeconds => 11,
      Self::TwelveSeconds => 12,
      Self::ThirteenSeconds => 13,
      Self::FourteenSeconds => 14,
      Self::FifteenSeconds => 15,
    }
  }

  fn to_str(&self) -> &'static str {
    match self {
      Self::ThreeSeconds => "3",
      Self::FourSeconds => "4",
      Self::FiveSeconds => "5",
      Self::SixSeconds => "6",
      Self::SevenSeconds => "7",
      Self::EightSeconds => "8",
      Self::NineSeconds => "9",
      Self::TenSeconds => "10",
      Self::ElevenSeconds => "11",
      Self::TwelveSeconds => "12",
      Self::ThirteenSeconds => "13",
      Self::FourteenSeconds => "14",
      Self::FifteenSeconds => "15",
    }
  }
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Kling3p0StandardTextToVideoAspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Kling3p0StandardTextToVideoShotType {
  Customize,
  Intelligent,
}

impl FalEndpoint for Kling3p0StandardTextToVideoRequest {
  const ENDPOINT: &str = "fal-ai/kling-video/v3/standard/text-to-video";

  type RawRequest = Kling3p0StandardTextToVideoInput;
  type RawResponse = Kling3p0StandardTextToVideoOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let duration = self.duration.map(|d| d.to_str().to_string());

    let aspect_ratio = self.aspect_ratio.map(|ar| match ar {
      Kling3p0StandardTextToVideoAspectRatio::Square => "1:1",
      Kling3p0StandardTextToVideoAspectRatio::SixteenByNine => "16:9",
      Kling3p0StandardTextToVideoAspectRatio::NineBySixteen => "9:16",
    }.to_string());

    let shot_type = self.shot_type.map(|st| match st {
      Kling3p0StandardTextToVideoShotType::Customize => "customize",
      Kling3p0StandardTextToVideoShotType::Intelligent => "intelligent",
    }.to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      generate_audio: self.generate_audio,
      negative_prompt: self.negative_prompt.clone(),
      duration,
      aspect_ratio,
      shot_type,
      cfg_scale: None,
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

    let request = Kling3p0StandardTextToVideoRequest {
      prompt: "a golden retriever puppy chases butterflies through a sunlit meadow, cinematic slow motion".to_string(),
      generate_audio: Some(true),
      negative_prompt: None,
      duration: Some(Kling3p0StandardTextToVideoDuration::FiveSeconds),
      aspect_ratio: Some(Kling3p0StandardTextToVideoAspectRatio::SixteenByNine),
      shot_type: None,
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

    let request = Kling3p0StandardTextToVideoRequest {
      prompt: "a wave crashes against a rocky shoreline at sunset".to_string(),
      generate_audio: Some(false),
      negative_prompt: None,
      duration: Some(Kling3p0StandardTextToVideoDuration::ThreeSeconds),
      aspect_ratio: Some(Kling3p0StandardTextToVideoAspectRatio::SixteenByNine),
      shot_type: None,
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
      Kling3p0StandardTextToVideoAspectRatio::Square,
      Kling3p0StandardTextToVideoAspectRatio::SixteenByNine,
      Kling3p0StandardTextToVideoAspectRatio::NineBySixteen,
    ];

    for ar in aspect_ratios {
      println!("--- aspect ratio: {:?} ---", ar);
      let request = Kling3p0StandardTextToVideoRequest {
        prompt: "a wave crashes against a rocky shoreline at sunset".to_string(),
        generate_audio: Some(true),
        negative_prompt: None,
        duration: Some(Kling3p0StandardTextToVideoDuration::ThreeSeconds),
        aspect_ratio: Some(ar),
        shot_type: None,
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
      Kling3p0StandardTextToVideoDuration::ThreeSeconds,
      Kling3p0StandardTextToVideoDuration::FourSeconds,
      Kling3p0StandardTextToVideoDuration::FiveSeconds,
      Kling3p0StandardTextToVideoDuration::SixSeconds,
      Kling3p0StandardTextToVideoDuration::SevenSeconds,
      Kling3p0StandardTextToVideoDuration::EightSeconds,
      Kling3p0StandardTextToVideoDuration::NineSeconds,
      Kling3p0StandardTextToVideoDuration::TenSeconds,
      Kling3p0StandardTextToVideoDuration::ElevenSeconds,
      Kling3p0StandardTextToVideoDuration::TwelveSeconds,
      Kling3p0StandardTextToVideoDuration::ThirteenSeconds,
      Kling3p0StandardTextToVideoDuration::FourteenSeconds,
      Kling3p0StandardTextToVideoDuration::FifteenSeconds,
    ];

    for dur in durations {
      println!("--- duration: {:?} ---", dur);
      let request = Kling3p0StandardTextToVideoRequest {
        prompt: "a candle flame flickers in a dark room".to_string(),
        generate_audio: Some(false),
        negative_prompt: None,
        duration: Some(dur),
        aspect_ratio: Some(Kling3p0StandardTextToVideoAspectRatio::SixteenByNine),
        shot_type: None,
      };
      let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_shot_types() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let shot_types = [
      Kling3p0StandardTextToVideoShotType::Customize,
      Kling3p0StandardTextToVideoShotType::Intelligent,
    ];

    for st in shot_types {
      println!("--- shot type: {:?} ---", st);
      let request = Kling3p0StandardTextToVideoRequest {
        prompt: "a bird takes flight from a tree branch".to_string(),
        generate_audio: Some(true),
        negative_prompt: None,
        duration: Some(Kling3p0StandardTextToVideoDuration::FiveSeconds),
        aspect_ratio: Some(Kling3p0StandardTextToVideoAspectRatio::SixteenByNine),
        shot_type: Some(st),
      };
      let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  // NB: Pricing tests are in cost.rs
}

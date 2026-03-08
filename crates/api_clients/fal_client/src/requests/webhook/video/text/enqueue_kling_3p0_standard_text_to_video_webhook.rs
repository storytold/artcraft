use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::video::http_kling_3p0_standard_text_to_video::{kling_3p0_standard_text_to_video, Kling3p0StandardTextToVideoInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueKling3p0StandardTextToVideoArgs<'a, R: IntoUrl> {
  pub prompt: String,

  // Optional args
  pub generate_audio: Option<bool>,
  pub negative_prompt: Option<String>,
  pub duration: Option<EnqueueKling3p0StandardTextToVideoDuration>,
  pub aspect_ratio: Option<EnqueueKling3p0StandardTextToVideoAspectRatio>,
  pub shot_type: Option<EnqueueKling3p0StandardTextToVideoShotType>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq, strum::EnumIter)]
pub enum EnqueueKling3p0StandardTextToVideoDuration {
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

impl EnqueueKling3p0StandardTextToVideoDuration {
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

  pub fn to_str(&self) -> &'static str {
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

#[derive(Copy, Clone, Debug, Eq, PartialEq, strum::EnumIter)]
pub enum EnqueueKling3p0StandardTextToVideoAspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq, strum::EnumIter)]
pub enum EnqueueKling3p0StandardTextToVideoShotType {
  Customize,
  Intelligent,
}

impl <U: IntoUrl> FalRequestCostCalculator for EnqueueKling3p0StandardTextToVideoArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Kling 3.0 Standard pricing:
    //   Audio off: $0.168/second
    //   Audio on:  $0.252/second
    let generate_audio = self.generate_audio.unwrap_or(true);
    let duration_secs = self.duration
        .unwrap_or(EnqueueKling3p0StandardTextToVideoDuration::FiveSeconds)
        .to_seconds();

    // Rate in tenths-of-cents per second
    let rate = if generate_audio { 252u64 } else { 168u64 };
    (rate * duration_secs + 9) / 10
  }
}

/// Kling 3.0 Standard Text-to-Video
/// https://fal.ai/models/fal-ai/kling-video/v3/standard/text-to-video
pub async fn enqueue_kling_3p0_standard_text_to_video_webhook<R: IntoUrl>(
  args: EnqueueKling3p0StandardTextToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|d| d.to_str().to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|aspect| match aspect {
        EnqueueKling3p0StandardTextToVideoAspectRatio::Square => "1:1",
        EnqueueKling3p0StandardTextToVideoAspectRatio::SixteenByNine => "16:9",
        EnqueueKling3p0StandardTextToVideoAspectRatio::NineBySixteen => "9:16",
      })
      .map(|s| s.to_string());

  let shot_type = args.shot_type
      .map(|st| match st {
        EnqueueKling3p0StandardTextToVideoShotType::Customize => "customize",
        EnqueueKling3p0StandardTextToVideoShotType::Intelligent => "intelligent",
      })
      .map(|s| s.to_string());

  let request = Kling3p0StandardTextToVideoInput {
    prompt: args.prompt,
    generate_audio: args.generate_audio,
    duration,
    aspect_ratio,
    negative_prompt: args.negative_prompt,
    shot_type,
    cfg_scale: None,
  };

  let result = kling_3p0_standard_text_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use strum::IntoEnumIterator;

  #[test]
  fn test_cost() {
    let api_key = FalApiKey::from_str("");

    let mut args = EnqueueKling3p0StandardTextToVideoArgs {
      prompt: "a cat sitting on a windowsill watching rain".to_string(),
      generate_audio: Some(false),
      negative_prompt: None,
      duration: Some(EnqueueKling3p0StandardTextToVideoDuration::FiveSeconds),
      aspect_ratio: None,
      shot_type: None,
      webhook_url: "https://example.com/webhook",
      api_key: &api_key,
    };

    // Audio off: $0.168/sec
    // 5s: (168 * 5 + 9) / 10 = 849 / 10 = 84
    assert_eq!(args.calculate_cost_in_cents(), 84);

    // 3s: (168 * 3 + 9) / 10 = 513 / 10 = 51
    args.duration = Some(EnqueueKling3p0StandardTextToVideoDuration::ThreeSeconds);
    assert_eq!(args.calculate_cost_in_cents(), 51);

    // 10s: (168 * 10 + 9) / 10 = 1689 / 10 = 168
    args.duration = Some(EnqueueKling3p0StandardTextToVideoDuration::TenSeconds);
    assert_eq!(args.calculate_cost_in_cents(), 168);

    // 15s: (168 * 15 + 9) / 10 = 2529 / 10 = 252
    args.duration = Some(EnqueueKling3p0StandardTextToVideoDuration::FifteenSeconds);
    assert_eq!(args.calculate_cost_in_cents(), 252);

    // Audio on: $0.252/sec
    args.generate_audio = Some(true);

    // 5s: (252 * 5 + 9) / 10 = 1269 / 10 = 126
    args.duration = Some(EnqueueKling3p0StandardTextToVideoDuration::FiveSeconds);
    assert_eq!(args.calculate_cost_in_cents(), 126);

    // 10s: (252 * 10 + 9) / 10 = 2529 / 10 = 252
    args.duration = Some(EnqueueKling3p0StandardTextToVideoDuration::TenSeconds);
    assert_eq!(args.calculate_cost_in_cents(), 252);

    // 15s: (252 * 15 + 9) / 10 = 3789 / 10 = 378
    args.duration = Some(EnqueueKling3p0StandardTextToVideoDuration::FifteenSeconds);
    assert_eq!(args.calculate_cost_in_cents(), 378);
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueKling3p0StandardTextToVideoArgs {
      prompt: "a golden retriever puppy chases butterflies through a sunlit meadow, cinematic slow motion".to_string(),
      generate_audio: Some(true),
      negative_prompt: None,
      duration: Some(EnqueueKling3p0StandardTextToVideoDuration::FiveSeconds),
      aspect_ratio: Some(EnqueueKling3p0StandardTextToVideoAspectRatio::SixteenByNine),
      shot_type: None,
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_kling_3p0_standard_text_to_video_webhook(args).await?;
    println!("result: {:?}", result);

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_aspect_ratios() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for ar in EnqueueKling3p0StandardTextToVideoAspectRatio::iter() {
      println!("--- aspect ratio: {:?} ---", ar);
      let args = EnqueueKling3p0StandardTextToVideoArgs {
        prompt: "a wave crashes against a rocky shoreline at sunset".to_string(),
        generate_audio: Some(true),
        negative_prompt: None,
        duration: Some(EnqueueKling3p0StandardTextToVideoDuration::ThreeSeconds),
        aspect_ratio: Some(ar),
        shot_type: None,
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_kling_3p0_standard_text_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_durations() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for dur in EnqueueKling3p0StandardTextToVideoDuration::iter() {
      println!("--- duration: {:?} ---", dur);
      let args = EnqueueKling3p0StandardTextToVideoArgs {
        prompt: "a candle flame flickers in a dark room".to_string(),
        generate_audio: Some(false),
        negative_prompt: None,
        duration: Some(dur),
        aspect_ratio: Some(EnqueueKling3p0StandardTextToVideoAspectRatio::SixteenByNine),
        shot_type: None,
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_kling_3p0_standard_text_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_shot_types() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for st in EnqueueKling3p0StandardTextToVideoShotType::iter() {
      println!("--- shot type: {:?} ---", st);
      let args = EnqueueKling3p0StandardTextToVideoArgs {
        prompt: "a bird takes flight from a tree branch".to_string(),
        generate_audio: Some(true),
        negative_prompt: None,
        duration: Some(EnqueueKling3p0StandardTextToVideoDuration::FiveSeconds),
        aspect_ratio: Some(EnqueueKling3p0StandardTextToVideoAspectRatio::SixteenByNine),
        shot_type: Some(st),
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_kling_3p0_standard_text_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }
}

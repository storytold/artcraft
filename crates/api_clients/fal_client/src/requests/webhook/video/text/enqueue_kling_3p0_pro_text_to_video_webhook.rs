use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::video::text::http_kling_3p0_pro_text_to_video::{kling_3p0_pro_text_to_video, Kling3p0ProTextToVideoInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueKling3p0ProTextToVideoArgs<'a, R: IntoUrl> {
  pub prompt: String,

  // Optional args
  pub generate_audio: Option<bool>,
  pub negative_prompt: Option<String>,
  pub duration: Option<EnqueueKling3p0ProTextToVideoDuration>,
  pub aspect_ratio: Option<EnqueueKling3p0ProTextToVideoAspectRatio>,
  pub shot_type: Option<EnqueueKling3p0ProTextToVideoShotType>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq, strum::EnumIter)]
pub enum EnqueueKling3p0ProTextToVideoDuration {
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

impl EnqueueKling3p0ProTextToVideoDuration {
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
pub enum EnqueueKling3p0ProTextToVideoAspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq, strum::EnumIter)]
pub enum EnqueueKling3p0ProTextToVideoShotType {
  Customize,
  Intelligent,
}

impl <U: IntoUrl> FalRequestCostCalculator for EnqueueKling3p0ProTextToVideoArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Kling 3.0 Pro pricing:
    //   Audio off: $0.224/second
    //   Audio on:  $0.336/second
    let generate_audio = self.generate_audio.unwrap_or(true);
    let duration_secs = self.duration
        .unwrap_or(EnqueueKling3p0ProTextToVideoDuration::FiveSeconds)
        .to_seconds();

    let rate = if generate_audio { 336u64 } else { 224u64 };
    (rate * duration_secs + 9) / 10
  }
}

/// Kling 3.0 Pro Text-to-Video
/// https://fal.ai/models/fal-ai/kling-video/v3/pro/text-to-video
pub async fn enqueue_kling_3p0_pro_text_to_video_webhook<R: IntoUrl>(
  args: EnqueueKling3p0ProTextToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|d| d.to_str().to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|aspect| match aspect {
        EnqueueKling3p0ProTextToVideoAspectRatio::Square => "1:1",
        EnqueueKling3p0ProTextToVideoAspectRatio::SixteenByNine => "16:9",
        EnqueueKling3p0ProTextToVideoAspectRatio::NineBySixteen => "9:16",
      })
      .map(|s| s.to_string());

  let shot_type = args.shot_type
      .map(|st| match st {
        EnqueueKling3p0ProTextToVideoShotType::Customize => "customize",
        EnqueueKling3p0ProTextToVideoShotType::Intelligent => "intelligent",
      })
      .map(|s| s.to_string());

  let request = Kling3p0ProTextToVideoInput {
    prompt: args.prompt,
    generate_audio: args.generate_audio,
    duration,
    aspect_ratio,
    negative_prompt: args.negative_prompt,
    shot_type,
    cfg_scale: None,
  };

  let result = kling_3p0_pro_text_to_video(request)
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

    let mut args = EnqueueKling3p0ProTextToVideoArgs {
      prompt: "a spacecraft drifts through an asteroid field, dramatic lighting".to_string(),
      generate_audio: Some(false),
      negative_prompt: None,
      duration: Some(EnqueueKling3p0ProTextToVideoDuration::FiveSeconds),
      aspect_ratio: None,
      shot_type: None,
      webhook_url: "https://example.com/webhook",
      api_key: &api_key,
    };

    // Audio off: $0.224/sec
    // 5s: (224 * 5 + 9) / 10 = 1129 / 10 = 112
    assert_eq!(args.calculate_cost_in_cents(), 112);

    // 3s: (224 * 3 + 9) / 10 = 681 / 10 = 68
    args.duration = Some(EnqueueKling3p0ProTextToVideoDuration::ThreeSeconds);
    assert_eq!(args.calculate_cost_in_cents(), 68);

    // 10s: (224 * 10 + 9) / 10 = 2249 / 10 = 224
    args.duration = Some(EnqueueKling3p0ProTextToVideoDuration::TenSeconds);
    assert_eq!(args.calculate_cost_in_cents(), 224);

    // 15s: (224 * 15 + 9) / 10 = 3369 / 10 = 336
    args.duration = Some(EnqueueKling3p0ProTextToVideoDuration::FifteenSeconds);
    assert_eq!(args.calculate_cost_in_cents(), 336);

    // Audio on: $0.336/sec
    args.generate_audio = Some(true);

    // 5s: (336 * 5 + 9) / 10 = 1689 / 10 = 168
    args.duration = Some(EnqueueKling3p0ProTextToVideoDuration::FiveSeconds);
    assert_eq!(args.calculate_cost_in_cents(), 168);

    // 10s: (336 * 10 + 9) / 10 = 3369 / 10 = 336
    args.duration = Some(EnqueueKling3p0ProTextToVideoDuration::TenSeconds);
    assert_eq!(args.calculate_cost_in_cents(), 336);

    // 15s: (336 * 15 + 9) / 10 = 5049 / 10 = 504
    args.duration = Some(EnqueueKling3p0ProTextToVideoDuration::FifteenSeconds);
    assert_eq!(args.calculate_cost_in_cents(), 504);
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueKling3p0ProTextToVideoArgs {
      prompt: "a samurai draws a katana in a bamboo forest, cherry blossoms falling in slow motion".to_string(),
      generate_audio: Some(true),
      negative_prompt: None,
      duration: Some(EnqueueKling3p0ProTextToVideoDuration::FiveSeconds),
      aspect_ratio: Some(EnqueueKling3p0ProTextToVideoAspectRatio::SixteenByNine),
      shot_type: None,
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_kling_3p0_pro_text_to_video_webhook(args).await?;
    println!("result: {:?}", result);

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_aspect_ratios() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for ar in EnqueueKling3p0ProTextToVideoAspectRatio::iter() {
      println!("--- aspect ratio: {:?} ---", ar);
      let args = EnqueueKling3p0ProTextToVideoArgs {
        prompt: "a lighthouse beam sweeps across a stormy sea at night".to_string(),
        generate_audio: Some(true),
        negative_prompt: None,
        duration: Some(EnqueueKling3p0ProTextToVideoDuration::ThreeSeconds),
        aspect_ratio: Some(ar),
        shot_type: None,
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_kling_3p0_pro_text_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_durations() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for dur in EnqueueKling3p0ProTextToVideoDuration::iter() {
      println!("--- duration: {:?} ---", dur);
      let args = EnqueueKling3p0ProTextToVideoArgs {
        prompt: "a hot air balloon rises over misty mountains at dawn".to_string(),
        generate_audio: Some(false),
        negative_prompt: None,
        duration: Some(dur),
        aspect_ratio: Some(EnqueueKling3p0ProTextToVideoAspectRatio::SixteenByNine),
        shot_type: None,
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_kling_3p0_pro_text_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_shot_types() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for st in EnqueueKling3p0ProTextToVideoShotType::iter() {
      println!("--- shot type: {:?} ---", st);
      let args = EnqueueKling3p0ProTextToVideoArgs {
        prompt: "an eagle soars over a snow-capped mountain range".to_string(),
        generate_audio: Some(true),
        negative_prompt: None,
        duration: Some(EnqueueKling3p0ProTextToVideoDuration::FiveSeconds),
        aspect_ratio: Some(EnqueueKling3p0ProTextToVideoAspectRatio::SixteenByNine),
        shot_type: Some(st),
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_kling_3p0_pro_text_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }
}

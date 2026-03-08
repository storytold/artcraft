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

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
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

#[derive(Copy, Clone, Debug)]
pub enum EnqueueKling3p0StandardTextToVideoAspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
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

  let request = Kling3p0StandardTextToVideoInput {
    prompt: args.prompt,
    generate_audio: args.generate_audio,
    duration,
    aspect_ratio,
    negative_prompt: args.negative_prompt,
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

  #[test]
  fn test_cost_standard_audio_off() {
    let api_key = FalApiKey::from_str("");
    let args = EnqueueKling3p0StandardTextToVideoArgs {
      prompt: String::new(),
      generate_audio: Some(false),
      negative_prompt: None,
      duration: Some(EnqueueKling3p0StandardTextToVideoDuration::FiveSeconds),
      aspect_ratio: None,
      webhook_url: "https://example.com",
      api_key: &api_key,
    };
    // $0.168 * 5 = $0.84 = 84 cents
    assert_eq!(args.calculate_cost_in_cents(), 84);
  }

  #[test]
  fn test_cost_standard_audio_on() {
    let api_key = FalApiKey::from_str("");
    let args = EnqueueKling3p0StandardTextToVideoArgs {
      prompt: String::new(),
      generate_audio: Some(true),
      negative_prompt: None,
      duration: Some(EnqueueKling3p0StandardTextToVideoDuration::FiveSeconds),
      aspect_ratio: None,
      webhook_url: "https://example.com",
      api_key: &api_key,
    };
    // $0.252 * 5 = $1.26 = 126 cents
    assert_eq!(args.calculate_cost_in_cents(), 126);
  }

  #[test]
  fn test_cost_standard_audio_off_10s() {
    let api_key = FalApiKey::from_str("");
    let args = EnqueueKling3p0StandardTextToVideoArgs {
      prompt: String::new(),
      generate_audio: Some(false),
      negative_prompt: None,
      duration: Some(EnqueueKling3p0StandardTextToVideoDuration::TenSeconds),
      aspect_ratio: None,
      webhook_url: "https://example.com",
      api_key: &api_key,
    };
    // $0.168 * 10 = $1.68 = 168 cents
    assert_eq!(args.calculate_cost_in_cents(), 168);
  }

  #[test]
  fn test_cost_standard_audio_off_3s() {
    let api_key = FalApiKey::from_str("");
    let args = EnqueueKling3p0StandardTextToVideoArgs {
      prompt: String::new(),
      generate_audio: Some(false),
      negative_prompt: None,
      duration: Some(EnqueueKling3p0StandardTextToVideoDuration::ThreeSeconds),
      aspect_ratio: None,
      webhook_url: "https://example.com",
      api_key: &api_key,
    };
    // $0.168 * 3 = $0.504 = ceil(50.4) = 51 cents
    assert_eq!(args.calculate_cost_in_cents(), 51);
  }

  #[test]
  fn test_cost_standard_audio_off_15s() {
    let api_key = FalApiKey::from_str("");
    let args = EnqueueKling3p0StandardTextToVideoArgs {
      prompt: String::new(),
      generate_audio: Some(false),
      negative_prompt: None,
      duration: Some(EnqueueKling3p0StandardTextToVideoDuration::FifteenSeconds),
      aspect_ratio: None,
      webhook_url: "https://example.com",
      api_key: &api_key,
    };
    // $0.168 * 15 = $2.52 = 252 cents
    assert_eq!(args.calculate_cost_in_cents(), 252);
  }
}

use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use fal::endpoints::fal_ai::kling_video::v3::kling_v3_pro_text_to_video::{kling_v3_pro_text_to_video, KlingV3ProTextToVideoInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueKlingV3ProTextToVideoArgs<'a, R: IntoUrl> {
  pub prompt: String,

  // Optional args
  pub generate_audio: Option<bool>,
  pub negative_prompt: Option<String>,
  pub duration: Option<EnqueueKlingV3ProTextToVideoDuration>,
  pub aspect_ratio: Option<EnqueueKlingV3ProTextToVideoAspectRatio>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueKlingV3ProTextToVideoDuration {
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

impl EnqueueKlingV3ProTextToVideoDuration {
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
pub enum EnqueueKlingV3ProTextToVideoAspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
}

impl <U: IntoUrl> FalRequestCostCalculator for EnqueueKlingV3ProTextToVideoArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Kling 3.0 Pro pricing:
    //   Audio off: $0.224/second
    //   Audio on:  $0.336/second
    let generate_audio = self.generate_audio.unwrap_or(true);
    let duration_secs = self.duration
        .unwrap_or(EnqueueKlingV3ProTextToVideoDuration::FiveSeconds)
        .to_seconds();

    let rate = if generate_audio { 336u64 } else { 224u64 };
    (rate * duration_secs + 9) / 10
  }
}

/// Kling 3.0 Pro Text-to-Video
/// https://fal.ai/models/fal-ai/kling-video/v3/pro/text-to-video
pub async fn enqueue_kling_v3_pro_text_to_video_webhook<R: IntoUrl>(
  args: EnqueueKlingV3ProTextToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|d| d.to_str().to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|aspect| match aspect {
        EnqueueKlingV3ProTextToVideoAspectRatio::Square => "1:1",
        EnqueueKlingV3ProTextToVideoAspectRatio::SixteenByNine => "16:9",
        EnqueueKlingV3ProTextToVideoAspectRatio::NineBySixteen => "9:16",
      })
      .map(|s| s.to_string());

  let request = KlingV3ProTextToVideoInput {
    prompt: args.prompt,
    generate_audio: args.generate_audio,
    duration,
    aspect_ratio,
    negative_prompt: args.negative_prompt,
    cfg_scale: None,
  };

  let result = kling_v3_pro_text_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_cost_pro_audio_off_5s() {
    let api_key = FalApiKey::from_str("");
    let args = EnqueueKlingV3ProTextToVideoArgs {
      prompt: String::new(),
      generate_audio: Some(false),
      negative_prompt: None,
      duration: Some(EnqueueKlingV3ProTextToVideoDuration::FiveSeconds),
      aspect_ratio: None,
      webhook_url: "https://example.com",
      api_key: &api_key,
    };
    // $0.224 * 5 = $1.12 = 112 cents
    assert_eq!(args.calculate_cost_in_cents(), 112);
  }

  #[test]
  fn test_cost_pro_audio_on_5s() {
    let api_key = FalApiKey::from_str("");
    let args = EnqueueKlingV3ProTextToVideoArgs {
      prompt: String::new(),
      generate_audio: Some(true),
      negative_prompt: None,
      duration: Some(EnqueueKlingV3ProTextToVideoDuration::FiveSeconds),
      aspect_ratio: None,
      webhook_url: "https://example.com",
      api_key: &api_key,
    };
    // $0.336 * 5 = $1.68 = 168 cents
    assert_eq!(args.calculate_cost_in_cents(), 168);
  }

  #[test]
  fn test_cost_pro_audio_off_10s() {
    let api_key = FalApiKey::from_str("");
    let args = EnqueueKlingV3ProTextToVideoArgs {
      prompt: String::new(),
      generate_audio: Some(false),
      negative_prompt: None,
      duration: Some(EnqueueKlingV3ProTextToVideoDuration::TenSeconds),
      aspect_ratio: None,
      webhook_url: "https://example.com",
      api_key: &api_key,
    };
    // $0.224 * 10 = $2.24 = 224 cents
    assert_eq!(args.calculate_cost_in_cents(), 224);
  }

  #[test]
  fn test_cost_pro_audio_off_15s() {
    let api_key = FalApiKey::from_str("");
    let args = EnqueueKlingV3ProTextToVideoArgs {
      prompt: String::new(),
      generate_audio: Some(false),
      negative_prompt: None,
      duration: Some(EnqueueKlingV3ProTextToVideoDuration::FifteenSeconds),
      aspect_ratio: None,
      webhook_url: "https://example.com",
      api_key: &api_key,
    };
    // $0.224 * 15 = $3.36 = 336 cents
    assert_eq!(args.calculate_cost_in_cents(), 336);
  }
}

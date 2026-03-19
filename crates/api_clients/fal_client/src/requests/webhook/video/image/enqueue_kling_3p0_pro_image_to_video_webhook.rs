use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::video::image::http_kling_3p0_pro_image_to_video::{kling_3p0_pro_image_to_video, Kling3p0ProImageToVideoInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueKling3p0ProImageToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,
  pub image_url: String,

  // Optional args
  pub end_image_url: Option<String>,
  pub generate_audio: Option<bool>,
  pub negative_prompt: Option<String>,
  pub duration: Option<EnqueueKling3p0ProImageToVideoDuration>,
  pub aspect_ratio: Option<EnqueueKling3p0ProImageToVideoAspectRatio>,
  pub shot_type: Option<EnqueueKling3p0ProImageToVideoShotType>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq, strum::EnumIter)]
pub enum EnqueueKling3p0ProImageToVideoDuration {
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

impl EnqueueKling3p0ProImageToVideoDuration {
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
pub enum EnqueueKling3p0ProImageToVideoAspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq, strum::EnumIter)]
pub enum EnqueueKling3p0ProImageToVideoShotType {
  Customize,
  Intelligent,
}

impl <U: IntoUrl> FalRequestCostCalculator for EnqueueKling3p0ProImageToVideoArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Same pricing as text-to-video for Kling 3.0 Pro:
    //   Audio off: $0.224/second
    //   Audio on:  $0.336/second
    let generate_audio = self.generate_audio.unwrap_or(true);
    let duration_secs = self.duration
        .unwrap_or(EnqueueKling3p0ProImageToVideoDuration::FiveSeconds)
        .to_seconds();

    let rate = if generate_audio { 336u64 } else { 224u64 };
    (rate * duration_secs + 9) / 10
  }
}

/// Kling 3.0 Pro Image-to-Video
/// https://fal.ai/models/fal-ai/kling-video/v3/pro/image-to-video
pub async fn enqueue_kling_3p0_pro_image_to_video_webhook<R: IntoUrl>(
  args: EnqueueKling3p0ProImageToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|d| d.to_str().to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|ar| match ar {
        EnqueueKling3p0ProImageToVideoAspectRatio::Square => "1:1",
        EnqueueKling3p0ProImageToVideoAspectRatio::SixteenByNine => "16:9",
        EnqueueKling3p0ProImageToVideoAspectRatio::NineBySixteen => "9:16",
      })
      .map(|s| s.to_string());

  let shot_type = args.shot_type
      .map(|st| match st {
        EnqueueKling3p0ProImageToVideoShotType::Customize => "customize",
        EnqueueKling3p0ProImageToVideoShotType::Intelligent => "intelligent",
      })
      .map(|s| s.to_string());

  let request = Kling3p0ProImageToVideoInput {
    prompt: args.prompt,
    image_url: args.image_url,
    end_image_url: args.end_image_url,
    aspect_ratio,
    generate_audio: args.generate_audio,
    duration,
    negative_prompt: args.negative_prompt,
    shot_type,
    cfg_scale: None,
  };

  let result = kling_3p0_pro_image_to_video(request)
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
  use test_data::web::image_urls::TREX_SKELETON_IMAGE_URL;

  #[test]
  fn test_cost() {
    let api_key = FalApiKey::from_str("");

    let mut args = EnqueueKling3p0ProImageToVideoArgs {
      prompt: "the t-rex skeleton leaps off the podium and charges".to_string(),
      image_url: TREX_SKELETON_IMAGE_URL.to_string(),
      end_image_url: None,
      generate_audio: Some(false),
      negative_prompt: None,
      duration: Some(EnqueueKling3p0ProImageToVideoDuration::FiveSeconds),
      aspect_ratio: None,
      shot_type: None,
      webhook_url: "https://example.com/webhook",
      api_key: &api_key,
    };

    // Audio off: $0.224/sec
    // 5s: (224 * 5 + 9) / 10 = 1129 / 10 = 112
    assert_eq!(args.calculate_cost_in_cents(), 112);

    // 10s: (224 * 10 + 9) / 10 = 2249 / 10 = 224
    args.duration = Some(EnqueueKling3p0ProImageToVideoDuration::TenSeconds);
    assert_eq!(args.calculate_cost_in_cents(), 224);

    // 15s: (224 * 15 + 9) / 10 = 3369 / 10 = 336
    args.duration = Some(EnqueueKling3p0ProImageToVideoDuration::FifteenSeconds);
    assert_eq!(args.calculate_cost_in_cents(), 336);

    // Audio on: $0.336/sec
    args.generate_audio = Some(true);

    // 5s: (336 * 5 + 9) / 10 = 1689 / 10 = 168
    args.duration = Some(EnqueueKling3p0ProImageToVideoDuration::FiveSeconds);
    assert_eq!(args.calculate_cost_in_cents(), 168);

    // 10s: (336 * 10 + 9) / 10 = 3369 / 10 = 336
    args.duration = Some(EnqueueKling3p0ProImageToVideoDuration::TenSeconds);
    assert_eq!(args.calculate_cost_in_cents(), 336);
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueKling3p0ProImageToVideoArgs {
      image_url: TREX_SKELETON_IMAGE_URL.to_string(),
      prompt: "the t-rex skeleton gets off the podium and begins walking to the camera, then bites".to_string(),
      duration: Some(EnqueueKling3p0ProImageToVideoDuration::FiveSeconds),
      aspect_ratio: Some(EnqueueKling3p0ProImageToVideoAspectRatio::SixteenByNine),
      generate_audio: Some(true),
      negative_prompt: None,
      end_image_url: None,
      shot_type: None,
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_kling_3p0_pro_image_to_video_webhook(args).await?;
    println!("result: {:?}", result);

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_aspect_ratios() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for ar in EnqueueKling3p0ProImageToVideoAspectRatio::iter() {
      println!("--- aspect ratio: {:?} ---", ar);
      let args = EnqueueKling3p0ProImageToVideoArgs {
        image_url: TREX_SKELETON_IMAGE_URL.to_string(),
        prompt: "the t-rex skeleton comes alive and roars at the camera".to_string(),
        duration: Some(EnqueueKling3p0ProImageToVideoDuration::ThreeSeconds),
        aspect_ratio: Some(ar),
        generate_audio: Some(false),
        negative_prompt: None,
        end_image_url: None,
        shot_type: None,
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_kling_3p0_pro_image_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_durations() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for dur in EnqueueKling3p0ProImageToVideoDuration::iter() {
      println!("--- duration: {:?} ---", dur);
      let args = EnqueueKling3p0ProImageToVideoArgs {
        image_url: TREX_SKELETON_IMAGE_URL.to_string(),
        prompt: "the skeleton slowly turns its head and roars".to_string(),
        duration: Some(dur),
        aspect_ratio: Some(EnqueueKling3p0ProImageToVideoAspectRatio::SixteenByNine),
        generate_audio: Some(false),
        negative_prompt: None,
        end_image_url: None,
        shot_type: None,
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_kling_3p0_pro_image_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_shot_types() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for st in EnqueueKling3p0ProImageToVideoShotType::iter() {
      println!("--- shot type: {:?} ---", st);
      let args = EnqueueKling3p0ProImageToVideoArgs {
        image_url: TREX_SKELETON_IMAGE_URL.to_string(),
        prompt: "the skeleton lurches forward and snaps its jaws".to_string(),
        duration: Some(EnqueueKling3p0ProImageToVideoDuration::FiveSeconds),
        aspect_ratio: Some(EnqueueKling3p0ProImageToVideoAspectRatio::SixteenByNine),
        generate_audio: Some(true),
        negative_prompt: None,
        end_image_url: None,
        shot_type: Some(st),
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_kling_3p0_pro_image_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }
}

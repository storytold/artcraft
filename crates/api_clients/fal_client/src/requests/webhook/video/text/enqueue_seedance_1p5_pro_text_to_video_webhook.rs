use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::video::http_seedance_1p5_pro_text_to_video::{seedance_1p5_pro_text_to_video, Seedance1p5ProTextToVideoInput};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueSeedance1p5ProTextToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,

  // Optional args
  pub resolution: Option<EnqueueSeedance1p5ProTextToVideoResolution>,
  pub duration: Option<EnqueueSeedance1p5ProTextToVideoDuration>,
  pub aspect_ratio: Option<EnqueueSeedance1p5ProTextToVideoAspectRatio>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq, strum::EnumIter)]
pub enum EnqueueSeedance1p5ProTextToVideoDuration {
  FourSeconds,
  FiveSeconds,
  SixSeconds,
  SevenSeconds,
  EightSeconds,
  NineSeconds,
  TenSeconds,
  ElevenSeconds,
  TwelveSeconds,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq, strum::EnumIter)]
pub enum EnqueueSeedance1p5ProTextToVideoResolution {
  FourEightyP,
  SevenTwentyP,
  TenEightyP,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq, strum::EnumIter)]
pub enum EnqueueSeedance1p5ProTextToVideoAspectRatio {
  TwentyOneByNine,
  SixteenByNine,
  FourByThree,
  Square,
  ThreeByFour,
  NineBySixteen,
  Auto,
}

impl <U: IntoUrl> FalRequestCostCalculator for EnqueueSeedance1p5ProTextToVideoArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "Each 720p 5 second video with audio costs roughly $0.26.
    //  For other resolutions, 1 million video tokens with audio costs $2.4.
    //  tokens(video) = (height x width x FPS x duration) / 1024."

    let resolution = self.resolution.unwrap_or(EnqueueSeedance1p5ProTextToVideoResolution::SevenTwentyP);
    let duration = self.duration.unwrap_or(EnqueueSeedance1p5ProTextToVideoDuration::FiveSeconds);

    if resolution == EnqueueSeedance1p5ProTextToVideoResolution::SevenTwentyP
        && duration == EnqueueSeedance1p5ProTextToVideoDuration::FiveSeconds
    {
      return 26;
    }

    // TODO: Only correct for some aspect ratios for now.
    let (width, height) = match resolution {
      EnqueueSeedance1p5ProTextToVideoResolution::FourEightyP => (640u32, 480u32), // NB: Only for 4:3 !
      EnqueueSeedance1p5ProTextToVideoResolution::SevenTwentyP => (1280, 720), // NB: Only for 16:9 !
      EnqueueSeedance1p5ProTextToVideoResolution::TenEightyP => (1920, 1080),
    };

    let duration_secs = match duration {
      EnqueueSeedance1p5ProTextToVideoDuration::FourSeconds => 4.0,
      EnqueueSeedance1p5ProTextToVideoDuration::FiveSeconds => 5.0,
      EnqueueSeedance1p5ProTextToVideoDuration::SixSeconds => 6.0,
      EnqueueSeedance1p5ProTextToVideoDuration::SevenSeconds => 7.0,
      EnqueueSeedance1p5ProTextToVideoDuration::EightSeconds => 8.0,
      EnqueueSeedance1p5ProTextToVideoDuration::NineSeconds => 9.0,
      EnqueueSeedance1p5ProTextToVideoDuration::TenSeconds => 10.0,
      EnqueueSeedance1p5ProTextToVideoDuration::ElevenSeconds => 11.0,
      EnqueueSeedance1p5ProTextToVideoDuration::TwelveSeconds => 12.0,
    };

    const FPS: f64 = 30.0;

    let tokens = (height as f64) * (width as f64) * FPS * duration_secs;
    let tokens = tokens / 1024.0;

    let cost = tokens * 2.4 / 1_000_000.0;
    let cost = cost * 100.0; // Dollars to cents.
    let cost = cost.ceil();

    cost as UsdCents
  }
}

/// Seedance 1.5 Pro Text-to-Video
/// https://fal.ai/models/fal-ai/bytedance/seedance/v1.5/pro/text-to-video
pub async fn enqueue_seedance_1p5_pro_text_to_video_webhook<R: IntoUrl>(
  args: EnqueueSeedance1p5ProTextToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|d| match d {
        EnqueueSeedance1p5ProTextToVideoDuration::FourSeconds => "4",
        EnqueueSeedance1p5ProTextToVideoDuration::FiveSeconds => "5",
        EnqueueSeedance1p5ProTextToVideoDuration::SixSeconds => "6",
        EnqueueSeedance1p5ProTextToVideoDuration::SevenSeconds => "7",
        EnqueueSeedance1p5ProTextToVideoDuration::EightSeconds => "8",
        EnqueueSeedance1p5ProTextToVideoDuration::NineSeconds => "9",
        EnqueueSeedance1p5ProTextToVideoDuration::TenSeconds => "10",
        EnqueueSeedance1p5ProTextToVideoDuration::ElevenSeconds => "11",
        EnqueueSeedance1p5ProTextToVideoDuration::TwelveSeconds => "12",
      })
      .map(|d| d.to_string());

  let resolution = args.resolution
      .map(|r| match r {
        EnqueueSeedance1p5ProTextToVideoResolution::FourEightyP => "480p",
        EnqueueSeedance1p5ProTextToVideoResolution::SevenTwentyP => "720p",
        EnqueueSeedance1p5ProTextToVideoResolution::TenEightyP => "1080p",
      })
      .map(|r| r.to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|ar| match ar {
        EnqueueSeedance1p5ProTextToVideoAspectRatio::TwentyOneByNine => "21:9",
        EnqueueSeedance1p5ProTextToVideoAspectRatio::SixteenByNine => "16:9",
        EnqueueSeedance1p5ProTextToVideoAspectRatio::FourByThree => "4:3",
        EnqueueSeedance1p5ProTextToVideoAspectRatio::Square => "1:1",
        EnqueueSeedance1p5ProTextToVideoAspectRatio::ThreeByFour => "3:4",
        EnqueueSeedance1p5ProTextToVideoAspectRatio::NineBySixteen => "9:16",
        EnqueueSeedance1p5ProTextToVideoAspectRatio::Auto => "auto",
      })
      .map(|ar| ar.to_string());

  let request = Seedance1p5ProTextToVideoInput {
    prompt: args.prompt,
    duration,
    resolution,
    aspect_ratio,
    camera_fixed: None,
    seed: None,
    enable_safety_checker: Some(false),
    generate_audio: Some(true),
  };

  let result = seedance_1p5_pro_text_to_video(request)
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

    let mut args = EnqueueSeedance1p5ProTextToVideoArgs {
      prompt: String::new(),
      api_key: &api_key,
      duration: Some(EnqueueSeedance1p5ProTextToVideoDuration::FiveSeconds),
      resolution: Some(EnqueueSeedance1p5ProTextToVideoResolution::SevenTwentyP),
      aspect_ratio: None,
      webhook_url: "https://example.com/webhook",
    };

    // NB: Constant value specified by Fal
    let cost = args.calculate_cost_in_cents();
    assert_eq!(cost, 26);

    // Calculated values
    args.duration = Some(EnqueueSeedance1p5ProTextToVideoDuration::TenSeconds);
    args.resolution = Some(EnqueueSeedance1p5ProTextToVideoResolution::SevenTwentyP);
    let cost = args.calculate_cost_in_cents();
    assert_eq!(cost, 65);

    args.duration = Some(EnqueueSeedance1p5ProTextToVideoDuration::FiveSeconds);
    args.resolution = Some(EnqueueSeedance1p5ProTextToVideoResolution::TenEightyP);
    let cost = args.calculate_cost_in_cents();
    assert_eq!(cost, 73);

    args.duration = Some(EnqueueSeedance1p5ProTextToVideoDuration::TenSeconds);
    args.resolution = Some(EnqueueSeedance1p5ProTextToVideoResolution::TenEightyP);
    let cost = args.calculate_cost_in_cents();
    assert_eq!(cost, 146);
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueSeedance1p5ProTextToVideoArgs {
      prompt: "a dinosaur walks through a misty forest at dawn, cinematic lighting".to_string(),
      duration: Some(EnqueueSeedance1p5ProTextToVideoDuration::FiveSeconds),
      aspect_ratio: Some(EnqueueSeedance1p5ProTextToVideoAspectRatio::SixteenByNine),
      resolution: Some(EnqueueSeedance1p5ProTextToVideoResolution::SevenTwentyP),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_seedance_1p5_pro_text_to_video_webhook(args).await?;
    println!("result: {:?}", result);

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_aspect_ratios() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for ar in EnqueueSeedance1p5ProTextToVideoAspectRatio::iter() {
      println!("--- aspect ratio: {:?} ---", ar);
      let args = EnqueueSeedance1p5ProTextToVideoArgs {
        prompt: "a corgi runs along a beach at golden hour".to_string(),
        duration: Some(EnqueueSeedance1p5ProTextToVideoDuration::FourSeconds),
        aspect_ratio: Some(ar),
        resolution: None,
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_seedance_1p5_pro_text_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_durations() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for dur in EnqueueSeedance1p5ProTextToVideoDuration::iter() {
      println!("--- duration: {:?} ---", dur);
      let args = EnqueueSeedance1p5ProTextToVideoArgs {
        prompt: "a corgi runs along a beach at golden hour".to_string(),
        duration: Some(dur),
        aspect_ratio: Some(EnqueueSeedance1p5ProTextToVideoAspectRatio::SixteenByNine),
        resolution: None,
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_seedance_1p5_pro_text_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_resolutions() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for res in EnqueueSeedance1p5ProTextToVideoResolution::iter() {
      println!("--- resolution: {:?} ---", res);
      let args = EnqueueSeedance1p5ProTextToVideoArgs {
        prompt: "a bird flying over an ocean at golden hour".to_string(),
        duration: Some(EnqueueSeedance1p5ProTextToVideoDuration::FourSeconds),
        aspect_ratio: Some(EnqueueSeedance1p5ProTextToVideoAspectRatio::SixteenByNine),
        resolution: Some(res),
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_seedance_1p5_pro_text_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }
}

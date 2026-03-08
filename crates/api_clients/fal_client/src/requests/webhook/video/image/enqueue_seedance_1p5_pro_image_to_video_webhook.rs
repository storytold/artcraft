use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::video::http_seedance_1p5_pro_image_to_video::{seedance_1p5_pro_image_to_video, Seedance1p5ProImageToVideoInput};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueSeedance1p5ProImageToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,
  pub image_url: String,

  // Optional args
  pub end_image_url: Option<String>,
  pub resolution: Option<EnqueueSeedance1p5ProImageToVideoResolution>,
  pub duration: Option<EnqueueSeedance1p5ProImageToVideoDuration>,
  pub aspect_ratio: Option<EnqueueSeedance1p5ProImageToVideoAspectRatio>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq, strum::EnumIter)]
pub enum EnqueueSeedance1p5ProImageToVideoDuration {
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
pub enum EnqueueSeedance1p5ProImageToVideoResolution {
  FourEightyP,
  SevenTwentyP,
  TenEightyP,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq, strum::EnumIter)]
pub enum EnqueueSeedance1p5ProImageToVideoAspectRatio {
  TwentyOneByNine,
  SixteenByNine,
  FourByThree,
  Square,
  ThreeByFour,
  NineBySixteen,
  Auto,
}

impl <U: IntoUrl> FalRequestCostCalculator for EnqueueSeedance1p5ProImageToVideoArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "Each 720p 5 second video with audio costs roughly $0.26.
    //  For other resolutions, 1 million video tokens with audio costs $2.4.
    //  tokens(video) = (height x width x FPS x duration) / 1024."

    let resolution = self.resolution.unwrap_or(EnqueueSeedance1p5ProImageToVideoResolution::SevenTwentyP);
    let duration = self.duration.unwrap_or(EnqueueSeedance1p5ProImageToVideoDuration::FiveSeconds);

    if resolution == EnqueueSeedance1p5ProImageToVideoResolution::SevenTwentyP
        && duration == EnqueueSeedance1p5ProImageToVideoDuration::FiveSeconds
    {
      return 26;
    }

    // TODO: Only correct for some aspect ratios for now.
    let (width, height) = match resolution {
      EnqueueSeedance1p5ProImageToVideoResolution::FourEightyP => (640u32, 480u32), // NB: Only for 4:3 !
      EnqueueSeedance1p5ProImageToVideoResolution::SevenTwentyP => (1280, 720), // NB: Only for 16:9 !
      EnqueueSeedance1p5ProImageToVideoResolution::TenEightyP => (1920, 1080),
    };

    let duration_secs = match duration {
      EnqueueSeedance1p5ProImageToVideoDuration::FourSeconds => 4.0,
      EnqueueSeedance1p5ProImageToVideoDuration::FiveSeconds => 5.0,
      EnqueueSeedance1p5ProImageToVideoDuration::SixSeconds => 6.0,
      EnqueueSeedance1p5ProImageToVideoDuration::SevenSeconds => 7.0,
      EnqueueSeedance1p5ProImageToVideoDuration::EightSeconds => 8.0,
      EnqueueSeedance1p5ProImageToVideoDuration::NineSeconds => 9.0,
      EnqueueSeedance1p5ProImageToVideoDuration::TenSeconds => 10.0,
      EnqueueSeedance1p5ProImageToVideoDuration::ElevenSeconds => 11.0,
      EnqueueSeedance1p5ProImageToVideoDuration::TwelveSeconds => 12.0,
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

/// Seedance 1.5 Pro Image-to-Video
/// https://fal.ai/models/fal-ai/bytedance/seedance/v1.5/pro/image-to-video
pub async fn enqueue_seedance_1p5_pro_image_to_video_webhook<R: IntoUrl>(
  args: EnqueueSeedance1p5ProImageToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|d| match d {
        EnqueueSeedance1p5ProImageToVideoDuration::FourSeconds => "4",
        EnqueueSeedance1p5ProImageToVideoDuration::FiveSeconds => "5",
        EnqueueSeedance1p5ProImageToVideoDuration::SixSeconds => "6",
        EnqueueSeedance1p5ProImageToVideoDuration::SevenSeconds => "7",
        EnqueueSeedance1p5ProImageToVideoDuration::EightSeconds => "8",
        EnqueueSeedance1p5ProImageToVideoDuration::NineSeconds => "9",
        EnqueueSeedance1p5ProImageToVideoDuration::TenSeconds => "10",
        EnqueueSeedance1p5ProImageToVideoDuration::ElevenSeconds => "11",
        EnqueueSeedance1p5ProImageToVideoDuration::TwelveSeconds => "12",
      })
      .map(|d| d.to_string());

  let resolution = args.resolution
      .map(|r| match r {
        EnqueueSeedance1p5ProImageToVideoResolution::FourEightyP => "480p",
        EnqueueSeedance1p5ProImageToVideoResolution::SevenTwentyP => "720p",
        EnqueueSeedance1p5ProImageToVideoResolution::TenEightyP => "1080p",
      })
      .map(|r| r.to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|ar| match ar {
        EnqueueSeedance1p5ProImageToVideoAspectRatio::TwentyOneByNine => "21:9",
        EnqueueSeedance1p5ProImageToVideoAspectRatio::SixteenByNine => "16:9",
        EnqueueSeedance1p5ProImageToVideoAspectRatio::FourByThree => "4:3",
        EnqueueSeedance1p5ProImageToVideoAspectRatio::Square => "1:1",
        EnqueueSeedance1p5ProImageToVideoAspectRatio::ThreeByFour => "3:4",
        EnqueueSeedance1p5ProImageToVideoAspectRatio::NineBySixteen => "9:16",
        EnqueueSeedance1p5ProImageToVideoAspectRatio::Auto => "auto",
      })
      .map(|ar| ar.to_string());

  let request = Seedance1p5ProImageToVideoInput {
    prompt: args.prompt,
    image_url: args.image_url,
    end_image_url: args.end_image_url,
    duration,
    resolution,
    aspect_ratio,
    camera_fixed: None,
    seed: None,
    enable_safety_checker: Some(false),
    generate_audio: Some(true),
  };

  let result = seedance_1p5_pro_image_to_video(request)
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

    let mut args = EnqueueSeedance1p5ProImageToVideoArgs {
      prompt: String::new(),
      image_url: String::new(),
      end_image_url: None,
      api_key: &api_key,
      duration: Some(EnqueueSeedance1p5ProImageToVideoDuration::FiveSeconds),
      resolution: Some(EnqueueSeedance1p5ProImageToVideoResolution::SevenTwentyP),
      aspect_ratio: None,
      webhook_url: "https://example.com/webhook",
    };

    // NB: Constant value specified by Fal
    let cost = args.calculate_cost_in_cents();
    assert_eq!(cost, 26);

    // Calculated values
    args.duration = Some(EnqueueSeedance1p5ProImageToVideoDuration::TenSeconds);
    args.resolution = Some(EnqueueSeedance1p5ProImageToVideoResolution::SevenTwentyP);
    let cost = args.calculate_cost_in_cents();
    assert_eq!(cost, 65);

    args.duration = Some(EnqueueSeedance1p5ProImageToVideoDuration::FiveSeconds);
    args.resolution = Some(EnqueueSeedance1p5ProImageToVideoResolution::TenEightyP);
    let cost = args.calculate_cost_in_cents();
    assert_eq!(cost, 73);

    args.duration = Some(EnqueueSeedance1p5ProImageToVideoDuration::TenSeconds);
    args.resolution = Some(EnqueueSeedance1p5ProImageToVideoResolution::TenEightyP);
    let cost = args.calculate_cost_in_cents();
    assert_eq!(cost, 146);
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueSeedance1p5ProImageToVideoArgs {
      image_url: TREX_SKELETON_IMAGE_URL.to_string(),
      prompt: "the t-rex skeleton gets off the podium and begins walking to the camera".to_string(),
      duration: Some(EnqueueSeedance1p5ProImageToVideoDuration::FiveSeconds),
      aspect_ratio: Some(EnqueueSeedance1p5ProImageToVideoAspectRatio::SixteenByNine),
      resolution: Some(EnqueueSeedance1p5ProImageToVideoResolution::SevenTwentyP),
      end_image_url: None,
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_seedance_1p5_pro_image_to_video_webhook(args).await?;
    println!("result: {:?}", result);

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_aspect_ratios() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for ar in EnqueueSeedance1p5ProImageToVideoAspectRatio::iter() {
      println!("--- aspect ratio: {:?} ---", ar);
      let args = EnqueueSeedance1p5ProImageToVideoArgs {
        image_url: TREX_SKELETON_IMAGE_URL.to_string(),
        prompt: "the skeleton comes alive and roars at the camera".to_string(),
        duration: Some(EnqueueSeedance1p5ProImageToVideoDuration::FourSeconds),
        aspect_ratio: Some(ar),
        resolution: None,
        end_image_url: None,
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_seedance_1p5_pro_image_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_durations() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for dur in EnqueueSeedance1p5ProImageToVideoDuration::iter() {
      println!("--- duration: {:?} ---", dur);
      let args = EnqueueSeedance1p5ProImageToVideoArgs {
        image_url: TREX_SKELETON_IMAGE_URL.to_string(),
        prompt: "the skeleton slowly turns its head".to_string(),
        duration: Some(dur),
        aspect_ratio: Some(EnqueueSeedance1p5ProImageToVideoAspectRatio::SixteenByNine),
        resolution: None,
        end_image_url: None,
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_seedance_1p5_pro_image_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_resolutions() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for res in EnqueueSeedance1p5ProImageToVideoResolution::iter() {
      println!("--- resolution: {:?} ---", res);
      let args = EnqueueSeedance1p5ProImageToVideoArgs {
        image_url: TREX_SKELETON_IMAGE_URL.to_string(),
        prompt: "the skeleton slowly comes alive".to_string(),
        duration: Some(EnqueueSeedance1p5ProImageToVideoDuration::FourSeconds),
        aspect_ratio: Some(EnqueueSeedance1p5ProImageToVideoAspectRatio::SixteenByNine),
        resolution: Some(res),
        end_image_url: None,
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_seedance_1p5_pro_image_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }
}

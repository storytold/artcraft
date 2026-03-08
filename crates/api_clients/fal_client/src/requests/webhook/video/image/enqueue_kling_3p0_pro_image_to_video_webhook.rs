use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::webhook::video::text::enqueue_kling_3p0_pro_text_to_video_webhook::EnqueueKling3p0ProTextToVideoDuration;
use crate::requests::http::video::http_kling_3p0_pro_image_to_video::{kling_3p0_pro_image_to_video, Kling3p0ProImageToVideoInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueKling3p0ProImageToVideoArgs<'a, R: IntoUrl> {
  pub prompt: String,
  pub image_url: String,

  // Optional args
  pub end_image_url: Option<String>,
  pub generate_audio: Option<bool>,
  pub negative_prompt: Option<String>,
  pub duration: Option<EnqueueKling3p0ProTextToVideoDuration>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

impl <U: IntoUrl> FalRequestCostCalculator for EnqueueKling3p0ProImageToVideoArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Fal Docs:
    // For every second of video you generated, you will be charged $0.224 (audio off)
    // or $0.336 (audio on),
    // if voice control is used while generating audio you will be charged $0.392.
    // For example, a 5s video with audio on and voice control will cost $1.96

    // Our Docs:
    // Same pricing as text-to-video for Kling 3.0 Pro:
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

/// Kling 3.0 Pro Image-to-Video
/// https://fal.ai/models/fal-ai/kling-video/v3/pro/image-to-video
pub async fn enqueue_kling_3p0_pro_image_to_video_webhook<R: IntoUrl>(
  args: EnqueueKling3p0ProImageToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|d| d.to_str().to_string());

  let request = Kling3p0ProImageToVideoInput {
    prompt: args.prompt,
    image_url: args.image_url,
    end_image_url: args.end_image_url,
    aspect_ratio: None,
    generate_audio: args.generate_audio,
    duration,
    negative_prompt: args.negative_prompt,
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
      duration: Some(EnqueueKling3p0ProTextToVideoDuration::FiveSeconds),
      webhook_url: "https://example.com/webhook",
      api_key: &api_key,
    };

    // Audio off: $0.224/sec
    // 5s: (224 * 5 + 9) / 10 = 1129 / 10 = 112
    assert_eq!(args.calculate_cost_in_cents(), 112);

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
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueKling3p0ProImageToVideoArgs {
      image_url: TREX_SKELETON_IMAGE_URL.to_string(),
      prompt: "the t-rex skeleton gets off the podium and begins walking to the camera, then bites".to_string(),
      duration: Some(EnqueueKling3p0ProTextToVideoDuration::FiveSeconds),
      generate_audio: Some(true),
      negative_prompt: None,
      end_image_url: None,
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_kling_3p0_pro_image_to_video_webhook(args).await?;
    println!("result: {:?}", result);

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_durations() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for dur in EnqueueKling3p0ProTextToVideoDuration::iter() {
      println!("--- duration: {:?} ---", dur);
      let args = EnqueueKling3p0ProImageToVideoArgs {
        image_url: TREX_SKELETON_IMAGE_URL.to_string(),
        prompt: "the skeleton slowly turns its head and roars".to_string(),
        duration: Some(dur),
        generate_audio: Some(false),
        negative_prompt: None,
        end_image_url: None,
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_kling_3p0_pro_image_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }
}
